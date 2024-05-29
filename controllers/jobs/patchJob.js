const { slugify } = require('../../utils/utils');
const { Configuration, OpenAIApi } = require('openai');
const { detectLanguage } = require('../../utils/utils');
const crypto = require('crypto');
const path = require('path');
const i18n = require('i18n');

const patchJob = async (req, res) => {
    try {
        const Job = req.Job;
        const jobInformation = req.body;
        const jobId = req.params.id;
        const date = new Date();
        jobInformation.slug = slugify(jobInformation.name);
        jobInformation.users = jobInformation.users.split(',');
        let fileName = '';
        const allowedTypes = [
            'image/png',
            'image/jpeg',
            'image/gif',
            'image/bmp',
            'image/webp',
        ];
        if (jobInformation.expire > 0)
            jobInformation.expire = new Date(
                date.setMonth(date.getMonth() + jobInformation.expire)
            );
        else
            jobInformation.expire = new Date(
                date.setMonth(date.getMonth() + 500)
            );
        const job = await Job.findOne(
            { slug: jobInformation.slug, _id: { $ne: jobId } },
            '_id'
        );
        if (job) {
            return res.status(400).send({ data: 'Name should be unique' });
        }

        if (req.files && Object.keys(req.files).length > 0) {
            if (!allowedTypes.includes(req.files.image.mimetype)) {
                return res
                    .status(400)
                    .send({ data: 'Merci de joindre le visuel(image)' });
            }
            let uploadedFile = req.files.image;
            const fileNamePromise = new Promise((resolve, reject) => {
                crypto.randomBytes(16, (err, hash) => {
                    if (err) return reject(err);

                    const ext = path.extname(uploadedFile.name);
                    fileName = `${hash.toString('hex')}${ext}`;

                    uploadedFile.mv(`uploads/visual/${fileName}`, (err) => {
                        if (err) return reject(err);
                        resolve(fileName);
                    });
                });
            });
            fileName = await fileNamePromise;
            jobInformation.image = fileName;
        }

        const jobUpdated = await Job.updateOne({ _id: jobId }, jobInformation);
        if (!jobUpdated)
            return res
                .status(500)
                .send(i18n.__('An unknown problem has occurred, please try again later'));

        return res.sendStatus(204);
    } catch (e) {
        return res.status(500).send('Error: ' + e.message);
    }
};
const rephraseJobDescription = async (req, res) => {
    try {
        const text = req.body.content;
        const configuration = new Configuration({
            apiKey: process.env.OPENIA_API_KEY,
        });
        const openai = new OpenAIApi(configuration);
        const lang = detectLanguage(text);
        let message;
        if (lang === 'english') {
            message = [
                {
                    role: 'system',
                    content:
                        'You are a helpful assistant that can improve a job description by correcting mistakes, improve the overall form, improve it for SEO and especially remove gender biases.',
                },
                {
                    role: 'user',
                    content:
                        'Improve this job offer by correcting mistakes, improve the overall form, improve it for SEO and especially remove gender biases(Just return the new job description without anything else and in one and a single line)- Also don\'t remove HTML tags and above all to eliminate sexist prejudices: "' +
                        text +
                        '"',
                },
            ];
        } else {
            message = [
                {
                    role: 'system',
                    content:
                        "Vous êtes un assistant utile qui peut améliorer une description de poste en corrigeant les erreurs, améliorer la forme globale, l'améliorer pour le référencement et surtout supprimer les préjugés sexistes et de genre.",
                },
                {
                    role: 'user',
                    content:
                        "Améliore cette offre d'emploi en corrigeant les erreurs, améliore la forme globale pour le référencement et surtout supprime les préjugés sexistes (Renvoyez simplement la nouvelle description de poste sans rien d'autre et en une seule ligne)- Ne supprime pas non plus les balises HTML et  surtout supprime les préjudés sexistes (example:Un candidat curieux=>Un(e) candidat(e) curieux(se): \"" +
                        text +
                        '"',
                },
            ];
        }
        const response = await openai.createChatCompletion({
            model: 'gpt-3.5-turbo',
            messages: message,
        });

        return res.status(200).json(response.data.choices[0].message.content);
    } catch (error) {
        console.error(error);
        return res.status(500).send(`Error: ${error.message}`);
    }
};
const suggestJobDescription = async (req, res) => {
    try {
        const job = req.body.content;
        const configuration = new Configuration({
            apiKey: process.env.OPENIA_API_KEY,
        });
        const openai = new OpenAIApi(configuration);
        const lang = 'english'
        let message;
        if (lang === 'english') {
            message = [
                {
                    role: 'system',
                    content:
                        'You are a helpful assistant who writes job description perfectly',
                },
                {
                    role: 'user',
                    content:
                        "Generates a job description  for '" +
                        job +
                        "' don't preface your answer with anything and use html tags like <p> <ul> <li> etc. and follow this structure(5-8 sentences or buletpoints per section VERY IMPORTANT ADD A HOW I WOULD DO IT SECTION EXPLANNING HOW YOU WOULD DO THE JOB WITH CONCRETE EXAMPLES ALSO INCLUDE AVERAGE SALARY FOR THAT POSITION BASED ON HISTORICAL FACTS QND IF THE JOOB IS COOK INCLUDE THE RECIPE):\n<h1>Job description</h1>\n<h1>Responsibilities</h1>\n<h1>Skills & Qualifications</h1>\n<h1>Preferred Skills</h1>",
                },
            ];
        } else {
            message = [
                {
                    role: 'system',
                    content:
                        "Vous êtes un assistant utile qui écrit à la perfection la description d'une offre d'emploi",
                },
                {
                    role: 'user',
                    content:
                        "Génére la description d'une offre d'emploi (utilise des termes sans genres (example:Un candidat curieux=>Un(e) candidat(e) curieux(se)) pour '" +
                        job +
                        "' ne faites pas précéder votre réponse de quoi que ce soit et utilise des balises html comme <p> <ul> <li> etc. et suivez cette structure : \n<h1>Description de poste</h1>\n<h1>Ta mission🎯</h1>\n<h1>Ton Profil 👉</h1>",
                },
            ];
        }
        const response = await openai.createChatCompletion({
            model: 'gpt-3.5-turbo',
            messages: message,
        });

        return res.status(200).json(response.data.choices[0].message.content);
    } catch (error) {
        console.error(error);
        return res.status(500).send(`Error: ${error.message}`);
    }
};

module.exports = { patchJob, rephraseJobDescription, suggestJobDescription };
