const { slugify } = require('../../utils/utils');
const crypto = require('crypto');
const mongoose = require('mongoose');
const path = require('path');
const i18n = require('i18n');
const { sendHtmlEmail } = require('../../utils/mailer');
const postJob = async (req, res) => {
    try {
        const Job = req.Job;
        const jobInformation = req.body;
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

        const date = new Date();
        if (jobInformation.expire > 0)
            jobInformation.expire = new Date(
                date.setMonth(date.getMonth() + jobInformation.expire)
            );
        else
            jobInformation.expire = new Date(
                date.setMonth(date.getMonth() + 500)
            );

        const job = await Job.findOne({ slug: jobInformation.slug }, '_id');
        if (job) {
            return res.status(400).send({ data: i18n.__('Name shoud be unique') });
        }
        if (!req.files || Object.keys(req.files).length === 0) {
            return res
                .status(400)
                .send({ data: i18n.__('Merci de joindre le visuel(image)') });
        }
        if (!allowedTypes.includes(req.files.image.mimetype)) {
            return res
                .status(400)
                .send({ data: i18n.__('Merci de joindre le visuel(image)') });
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

        const jobCreated = await Job.create(jobInformation);
        if(jobInformation.shareOnLinkedIn) {
            const urlToShare = encodeURIComponent(`${process.env.BASE_URL}jobs/${jobInformation.slug}`);
            const linkedInShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${urlToShare}`;
            return res.status(200).send(linkedInShareUrl)
        }

        if (!jobCreated)
            return res
                .status(500)
                .send(i18n.__('An unknown problem has occurred, please try again later'));

        return res.status(200).send(linkedInShareUrl);
    } catch (e) {
        return res.status(500).send('Error: ' + e.message);
    }
};
//#TODO Remake this
const sendJobEmail = async (req, res) => {
    try {
        return res.status(500).send('Feature not implemented');
        const Candidate = req.Candidate;
        const email = req.body.email;
        const jobLink = req.body.jobLink;
        const candidate = await Candidate.findOne(
            { email },
            'firstName lastName'
        );
        console.log('jobLink')
        console.log(jobLink)
        const databaseInfo = req.DatabaseInfo;
        const Email = req.Email;
        const templateEmail = await Email.findOne({ _id: mongoose.Types.ObjectId('65d4776dd5c3f032669d05f3') });
        const replaceableObject = {
            '${first_name}': candidate.firstName,
            '${last_name}': candidate.lastName,
            '${job}': testId.name,
            '${assessment_link}': jobLink,
            '${company_name}': databaseInfo.name,
        };
        let newContent = templateEmail.html;
        Object.keys(replaceableObject).forEach((key) => {
            newContent = newContent.replaceAll(key, replaceableObject[key]);
        });
        await sendHtmlEmail(
            candidate.email,
            templateEmail.subject,
            newContent
        );
        if (!mailSent) return res.status(500).send(i18n.__('An unknown problem has occurred, please try again later'));
        return res.sendStatus(200);
    } catch (e) {
        return res.status(500).send('Error: ' + e.message);
    }
};
module.exports = { postJob, sendJobEmail };
