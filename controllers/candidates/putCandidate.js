const { Configuration, OpenAIApi } = require('openai');
const mongoose = require('mongoose');
const { removeStopwords, eng, fra } = require('stopword');
const { AffindaCredential, AffindaAPI } = require('@affinda/affinda');
/**
 * Calculates the progress of a profile based on the presence of non-empty properties.
 *
 * @param {Object} obj - The profile object to calculate progress for.
 * @returns {number} - The profile progress percentage.
 *
 * @example
 * const exampleProfile = {
 *    firstName: 'John',
 *    lastName: 'Doe',
 *    age: 25,
 *    contact: {
 *        email: 'john.doe@example.com',
 *        phone: '',
 *    },
 *    hobbies: [],
 * };
 * // Output: 50
 */
function calculateProfileProgress(obj) {
    let emptyProps = 0;
    let numProps = 0;

    const stack = [obj];
    while (stack.length > 0) {
        const currObj = stack.pop();
        for (let prop in currObj) {
            if (currObj.hasOwnProperty(prop)) {
                numProps++;

                const val = currObj[prop];
                if (
                    val === null ||
                    val === '' ||
                    (Array.isArray(val) && val.length === 0)
                ) {
                    emptyProps++;
                } else if (typeof val === 'object') {
                    stack.push(val);
                }
            }
        }
    }
    return numProps === 0 ? 0 : Math.floor((1 - emptyProps / numProps) * 100);
}
const splitString = (str) => {
    // Ignore everything before '•'
    str = str.substring(str.indexOf('•') + 1);

    // Split the string by '•'
    return str.split('•');
};
const generateSmartAnalysis = async (req, res) => {
    try {
        const { Candidate } = req;
        const { id } = req.params;
        const candidate = await Candidate.findOne(
            { _id: id },
            ' smartAnalysis redactedContent _id'
        );
        if (!candidate) return res.status(404).send('Candidate not found');

        if (candidate.smartAnalysis) {
            return res.status(200).json(candidate.smartAnalysis);
        }
        const configuration = new Configuration({
            apiKey: process.env.OPENIA_API_KEY,
        });
        let prompt = candidate.redactedContent;
        const openai = new OpenAIApi(configuration);
        const lang = req.language;
        let message_EN = [
            {
                role: 'system',
                content:
                    'You are a helpful assistant that can summarize resumes.',
            },
            {
                role: 'user',
                content:
                    'Extract the 5 most(only top 5) important information(no phone number or email or social media links or any personal info) from this resume(start and use bullet points •) \nPROFILE:' +
                    prompt,
            },
        ];
        let message_FR = [
            {
                role: 'system',
                content:
                    'Vous êtes un assistant utile qui peut résumer les CV.',
            },
            {
                role: 'user',
                content:
                    "Extrayez les 5 informations les plus importantes (uniquement les 5 principales) (pas de numéro de téléphone, ni d'e-mail, ni de liens vers des réseaux sociaux, ni aucune information personnelle) de ce CV (commencez et utilisez des puces •) \nPROFIL:" +
                    prompt,
            },
        ];

        const response = await openai.createChatCompletion({
            model: 'gpt-3.5-turbo',
            messages: lang === 'en' ? message_EN : message_FR,
        });

        message_EN = [
            {
                role: 'system',
                content:
                    'You are a helpful assistant that can propose job titles and matching score depending on said profile.',
            },
            {
                role: 'user',
                content:
                    'Extract the 3 most adequate jobs(only top 3) and a score in percentage (from 0-100) of how much the candidate matches the job title (start and use bullet points •) Only respond with this format: "•Job title: %" \nPROFILE:' +
                    prompt,
            },
        ];
        message_FR = [
            {
                role: 'system',
                content:
                    'Vous êtes un assistant utile qui peut proposer des intitulés de poste et un score correspondant en fonction dudit profil.',
            },
            {
                role: 'user',
                content:
                    'Extrayez les 3 emplois les plus adéquats (seulement les 3 premiers) et un score en pourcentage (de 0 à 100) de la correspondance du candidat avec le titre du poste (commencez et utilisez des puces •) Répondez avec ce format uniquement: "•Titre du poste:  %" \nPROFIL:' +
                    prompt,
            },
        ];
        const response2 = await openai.createChatCompletion({
            model: 'gpt-3.5-turbo',
            messages: lang === 'en' ? message_EN : message_FR,
        });
        const smartAnalysis = {
            keys: splitString(response.data.choices[0].message.content),
            job: splitString(response2.data.choices[0].message.content),
        };
        const updateResult = await Candidate.updateOne(
            { _id: candidate._id },
            {
                $set: {
                    smartAnalysis: smartAnalysis,
                },
            }
        );
        if (!updateResult)
            return res.status(500).send('An error occurred with the database');

        return res.status(200).json(smartAnalysis);
    } catch (error) {
        console.log(error);
        return res.status(500).send(`Error: ${error.message}`);
    }
};
const parseResume = async (req, res) => {
    try {
        const { SearchTerm } = req;
        const { Candidate } = req;
        const { id } = req.params;
        const currentCandidate = await Candidate.findOne({
            _id: mongoose.Types.ObjectId(id),
        })
            .populate({
                path: 'evaluations',
                select: 'job created status',
                populate: [
                    { path: 'status', select: 'name' },
                    { path: 'job', select: 'name' },
                ],
            })
            .lean();
        if (!currentCandidate) {
            return res.status(404).send('Candidate not found');
        }

        if (currentCandidate.parsed) {
            return res.status(200).json(currentCandidate);
        }
        const affindaCredential = new AffindaCredential(
            process.env.AFFINDA_API_KEY
        );
        const affindaAPI = new AffindaAPI(affindaCredential);

        const resumeUrl = `https://api.akwant.com/uploads/${
            currentCandidate.resumes[currentCandidate.resumes.length - 1]
        }`;

        let candidateInfo;
        let complete;

        try {
            const affindaResponse = await affindaAPI.createResume({
                url: resumeUrl,
            });
            candidateInfo = jsonResumeToObject(
                affindaResponse.data,
                currentCandidate.email
            );

            complete = calculateProfileProgress(candidateInfo);
        } catch (error) {
            console.error('An error occurred;', error);
            return res.status(500).send('An error occurred.');
        }

        const updateResult = await Candidate.findOneAndUpdate(
            { _id: currentCandidate._id },
            {
                $set: {
                    ...candidateInfo,
                    profileComplete: complete,
                    parsed: true,
                },
            },
            { new: true }
        )
            .select('-__v -_id -redactedContent')
            .populate({
                path: 'evaluations',
                select: 'job created status',
                populate: [
                    { path: 'status', select: 'name' },
                    { path: 'job', select: 'name' },
                ],
            })
            .lean();

        if (!updateResult) {
            return res
                .status(500)
                .send('An error occurred updating the database');
        }
        //TODO this api hardSkills and softSkills are not really that they are just skills so we should just group them into a skills field instead of hardSkills and softSkills
        const { hardSkills, softSkills } = currentCandidate;

        const currentHardSkillNames = hardSkills.map((skill) => skill.name);
        const currentSoftSkillNames = softSkills.map((skill) => skill.name);

        await SearchTerm.findOneAndUpdate(
            {},
            {
                $addToSet: {
                    hardSkillName: {
                        $each: currentHardSkillNames,
                        $nin: '$hardSkillName',
                    },
                    softSkillName: {
                        $each: currentSoftSkillNames,
                        $nin: '$softSkillName',
                    },
                },
            },
            { upsert: true }
        );
        return res.status(200).json({ currentCandidate: updateResult });
    } catch (error) {
        console.log(error);
        return res.status(500).send(`Error: ${error.message}`);
    }
};

const findSocialMedia = (websitesArray) => {
    const result = {
        facebook: null,
        linkedin: null,
        github: null,
        gitlab: null,
        youtube: null,
        websites: [],
    };
    const websitesToMatch = [
        'facebook',
        'linkedin',
        'github',
        'gitlab',
        'youtube',
    ];

    if (websitesArray) {
        websitesArray.forEach((website) => {
            const match = website.match(
                /^(?:https?:\/\/)?([a-z]+\.)?([a-z]+)\.([a-z]+)\/?/i
            );
            if (match && websitesToMatch.includes(match[2])) {
                if (!/^https?:\/\//i.test(website)) {
                    website = 'https://' + website;
                }
                switch (match[2]) {
                    case 'facebook':
                        result.facebook = website;
                        break;
                    case 'linkedin':
                        result.linkedin = website;
                        break;
                    case 'github':
                        result.github = website;
                        break;
                    case 'gitlab':
                        result.gitlab = website;
                        break;
                    case 'youtube':
                        result.youtube = website;
                        break;
                    default:
                        break;
                }
            } else {
                result.websites.push(website);
            }
        });
    }

    return result;
};
const topLanguagesInTunisia = [
    'arabic',
    'french',
    'italian',
    'spanish',
    'english',
    'german',
    'russian',
    'chinese',
    'turkish',
    'japanese',
];
const filterLanguages = (languages) => {
    return languages.filter((language) =>
        topLanguagesInTunisia.includes(language.toLowerCase())
    );
};
/**
 * Converts and formats an array of education data for better presentation.
 *
 * @param {Object[]} educationArray - An array of education objects.
 * @returns {Object[]} - An array of formatted education data.
 *
 * @example
 * const exampleEducationArray = [
 *    {
 *        organization: 'University of Example',
 *        accreditation: { education: 'Bachelor of Science in Example' },
 *        dates: { startDate: '2020-09-01', endDate: '2024-05-31' },
 *    },
 *    // ... more education objects
 * ];
 *
 * // Output:
 * // [
 * //    {
 * //        organization: 'University of Example',
 * //        accreditation: 'Bachelor of Science in Example',
 * //        dates: { startDate: '01/09/2020', endDate: '31/05/2024' },
 * //        duration: 45, // Duration in months
 * //        isCurrent: false,
 * //    },
 * //    // ... more formatted education objects
 * // ]
 */
const convertEducationData = (educationArray) => {
    // Sort the education array based on the end dates in descending order

    return educationArray
        .sort(
            (a, b) => new Date(b?.dates?.endDate) - new Date(a?.dates?.endDate)
        )
        .map((education) => {
            const startDate = education?.dates?.startDate
                ? new Date(education.dates.startDate)
                : null;
            const endDate = education?.dates?.endDate
                ? new Date(education.dates.endDate)
                : null;
            const startDateString = startDate
                ? startDate.toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                  })
                : null;
            const endDateString = endDate
                ? endDate.toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                  })
                : null;

            let durationInMonths = null;
            if (startDate && endDate) {
                const startDateInMs = startDate.getTime();
                const endDateInMs = endDate.getTime();

                const durationInMs = endDateInMs - startDateInMs;
                durationInMonths = Math.floor(
                    durationInMs / (1000 * 60 * 60 * 24 * 30)
                );
            }
            return {
                organization: education.organization || null,
                accreditation: education?.accreditation?.education || null,
                dates: {
                    startDate: startDateString,
                    endDate: endDateString,
                },
                duration: durationInMonths,
                isCurrent: education?.dates?.isCurrent || null,
            };
        });
};
/**
 * Converts and formats an array of work experience data for better presentation.
 *
 * @param {Object[]} workArray - An array of work experience objects.
 * @returns {Object[]} - An array of formatted work experience data.
 *
 * @example
 * const exampleWorkArray = [
 *    {
 *        organization: 'Tech Company XYZ',
 *        jobTitle: 'Software Engineer',
 *        dates: { startDate: '2018-06-01', endDate: '2022-12-31', monthsInPosition: 54 },
 *        isCurrent: false,
 *        jobDescription: 'Developed and maintained software applications.',
 *        location: { state: 'California' },
 *    },
 *    // ... more work experience objects
 * ];
 * // Output:
 * // [
 * //    {
 * //        organization: 'Tech Company XYZ',
 * //        title: 'Software Engineer',
 * //        dates: { startDate: '01/06/2018', endDate: '31/12/2022' },
 * //        duration: 54, // Months in position
 * //        isCurrent: false,
 * //        description: 'Developed and maintained software applications.',
 * //        location: 'California',
 * //    },
 * //    // ... more formatted work experience objects
 * // ]
 */
const convertWorkExperienceData = (workArray) => {
    return workArray
        .sort(
            (a, b) => new Date(b?.dates?.endDate) - new Date(a?.dates?.endDate)
        ) // sort by date in descending order
        .map((work) => {
            const startDate = work?.dates?.startDate
                ? new Date(work.dates.startDate)
                : null;
            const endDate = work?.dates?.endDate
                ? new Date(work.dates.endDate)
                : null;
            const startDateString = startDate
                ? startDate.toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                  })
                : null;
            const endDateString = endDate
                ? endDate.toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                  })
                : null;
            let durationInMonths = null;
            return {
                organization: work?.organization || null,
                title: work?.jobTitle || null,
                dates: {
                    startDate: startDateString,
                    endDate: endDateString,
                },
                duration: work?.dates?.monthsInPosition || durationInMonths,
                isCurrent: work?.dates?.isCurrent || null,
                description: work?.jobDescription || null,
                location: work?.location?.state || null,
            };
        });
};
const convertSkills = (skills, type) => {
    return skills
        .filter((skill) => skill.type === type)
        .sort((a, b) => b.numberOfMonths - a.numberOfMonths)
        .map((skill) => ({
            name: skill?.name || null,
            duration: skill?.numberOfMonths || null,
        }));
};
/**
 * Converts JSON resume data to a structured object for better presentation.
 *
 * @param {Object} jsonData - JSON resume data.
 * @param {string} candidateEmail - Email of the candidate.
 * @returns {Object} - A structured object representing the resume data.
 */
const jsonResumeToObject = (jsonData, candidateEmail) => {
    let result = {
        phoneNumbers: jsonData?.phoneNumbers || [],
        totalYearsOfExperience: jsonData?.totalYearsExperience || null,
        certifications: jsonData?.certifications || [],
        summary: jsonData?.summary || null,
        redactedContent: jsonData?.redactedText || null,
    };
    let dateOfBirth = jsonData?.dateOfBirth
        ? new Date(jsonData.dateOfBirth)
        : null;
    dateOfBirth = dateOfBirth
        ? dateOfBirth.toLocaleDateString('en-GB', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
          })
        : null;
    result.dateOfBirth = dateOfBirth;

    result.jobTitle = jsonData?.profession;
    if (jsonData?.languages) {
        result.languages = filterLanguages(jsonData.languages);
    }
    if (jsonData?.emails) {
        if (!jsonData.emails.includes(candidateEmail)) {
            jsonData.emails.push(candidateEmail);
        }
        result.emails = jsonData.emails;
    }
    if (jsonData?.websites) {
        const socialMedia = findSocialMedia(jsonData.websites);
        result = { ...result, ...socialMedia };
    }
    if (jsonData?.education) {
        result.education = convertEducationData(jsonData.education);
    }
    if (jsonData?.workExperience) {
        result.workExperience = convertWorkExperienceData(
            jsonData.workExperience
        );
    }
    if (jsonData?.profession === null || jsonData?.profession === '') {
        result.jobTitle =
            result?.workExperience && result.workExperience.length > 0
                ? result.workExperience[0].title
                : null;
    }
    if (jsonData?.skills) {
        result.hardSkills = convertSkills(jsonData.skills, 'hard_skill');
        result.softSkills = convertSkills(jsonData.skills, 'soft_skill');
    }

    result.currentOrganization =
        result.workExperience && result.workExperience.length > 0
            ? result.workExperience[0].organization
            : null;
    return result;
};
const addCustomField = async (req, res) => {
    try {
        const candidateId = req.params.id;
        const { CustomFields, Candidate } = req;
        const { label, value } = req.body.value;
        let customField = await CustomFields.findOne({ label });
        if (!customField) await CustomFields.create({ label });

        await Candidate.updateOne(
            { _id: mongoose.Types.ObjectId(candidateId) },
            { $set: { [`customFields.${label}`]: value } },
            { upsert: true }
        );

        return res.status(201).send('Created');
    } catch (e) {
        return res.status(500).send('Error: ' + e.message);
    }
};
module.exports = {
    generateSmartAnalysis,
    parseResume,
    addCustomField,
};
