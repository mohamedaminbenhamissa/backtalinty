const { v4: uuidv4 } = require('uuid');
const { capitalizeFirstLetter } = require('../../utils/utils');
const mongoose = require('mongoose');
const crypto = require('crypto');
const path = require('path');
const i18n = require('i18n');
const { sendHtmlEmail } = require('../../utils/mailer');
const { emitNotification } = require('../../socketServer');
const { controllers } = require('../../controllers/notificationController');

const postEvaluation = async (req, res) => {
    console.log('--------------------------------------------');
    try {
        const Evaluation = req.Evaluation;
        const Notification = req.Notification;
        const Candidate = req.Candidate;

        const evaluationInformation = req.body;
        console.log(evaluationInformation);
        const currentCandidate = await Candidate.findOne(
            { email: evaluationInformation.email.toLowerCase() },
            { _id: 1, evaluations: 1 }
        ).lean();
        let alreadyInProgress = null;

        if (currentCandidate) {
            alreadyInProgress = await Evaluation.findOne({
                _id: { $in: currentCandidate.evaluations },
                job: evaluationInformation.jobId,
                active: true,
            });
        }

        if (alreadyInProgress)
            return res
                .status(400)
                .send(i18n.__('You already applied to this job.'));

        let fileName = '';
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];

        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).send('Merci de joindre votre CV.');
        }

        if (!allowedTypes.includes(req.files.resume.mimetype)) {
            return res
                .status(400)
                .send(i18n.__('Please attach your CV in WORD or PDF format'));
        }

        let uploadedFile = req.files.resume;
        console.log('**********', uploadedFile);
        try {
            const hash = await new Promise((resolve, reject) => {
                crypto.randomBytes(16, (err, hash) => {
                    if (err) reject(err);
                    resolve(hash);
                });
            });
            const ext = path.extname(uploadedFile.name);
            fileName = `${hash.toString('hex')}${ext}`;
            await new Promise((resolve, reject) => {
                uploadedFile.mv(`uploads/${fileName}`, (err) => {
                    if (err) reject(err);
                    resolve();
                });
            });
        } catch (err) {
            return res.status(500).send(err);
        }
        const Process = req.Process;
        const Job = req.Job;
        const testId = await Job.findOne(
            { _id: evaluationInformation.jobId },
            'test name'
        );
        const process = await Process.findOne({ position: 0 }, '_id name');
        const stepsData = {
            author: null,
            comment: `${capitalizeFirstLetter(
                evaluationInformation.firstName
            )} ${capitalizeFirstLetter(
                evaluationInformation.lastName
            )} applied to the job`,
            step: process,
        };
        const evaluationData = {
            status: process._id,
            publicUrl: await uuidv4(),
            test: testId.test,
            job: evaluationInformation.jobId,
            steps: stepsData,
            resume: fileName,
        };
        const candidateData = {
            firstName: evaluationInformation.firstName,
            lastName: evaluationInformation.lastName,
            email: evaluationInformation.email.toLowerCase(),
            resumes: [fileName],
        };

        const databaseInfo = req.DatabaseInfo;
        console.log(
            '/////////////////////////////////////////////////////////////////////////////////',
            req.DatabaseInfo
        );
        const evaluation = await Evaluation.create(evaluationData);
        let candidateId;
        const Email = req.Email;
        const templateEmail = await Email.findOne({
            _id: mongoose.Types.ObjectId('6644bfc3dabc5169028b05ca'),
        });
        const replaceableObject = {
            '${first_name}': evaluationInformation.firstName,
            '${last_name}': evaluationInformation.lastName,
            '${job}': testId.name,
        };
        let newContent = templateEmail.html;
        Object.keys(replaceableObject).forEach((key) => {
            newContent = newContent.replaceAll(key, replaceableObject[key]);
        });
        await sendHtmlEmail(
            candidateData.email,
            templateEmail.subject,
            newContent
        );
        if (currentCandidate) {
            // Candidate exists, update the evaluations array
            await Candidate.updateOne(
                { _id: currentCandidate._id },
                { $push: { evaluations: evaluation._id, resumes: fileName } }
            );
            candidateId = currentCandidate._id;
        } else {
            // Candidate doesn't exist, create it and add the evaluation ID
            const candidateDataWithEvaluationId = {
                ...candidateData,
                evaluations: [evaluation._id],
            };

            const candidate = await Candidate.create(
                candidateDataWithEvaluationId
            );
            candidateId = candidate._id;
            //await findDuplicates(candidateId);
        }
        const evaluationUsers = await Evaluation.findOne(
            {
                _id: evaluation._id,
            },
            'currentUser job'
        )
            .populate({
                path: 'job',
                select: 'users',
            })
            .lean();
        const users = evaluationUsers.job.users || [];
        const currentUser = evaluationUsers.currentUser
            ? [evaluationUsers.currentUser]
            : [];
        const receivers = [...users, ...currentUser];
        for (const receiver of receivers) {
            try {
                const notificationInformation = {
                    evaluation: evaluation._id,
                    candidate: candidateId,
                    receiver: receiver,
                    job: evaluationInformation.jobId,
                    type: controllers.NotificationType.jobApplication,
                };

                const notification = await Notification.create(
                    notificationInformation
                );
                const result = await Notification.findOne({
                    _id: notification._id,
                })
                    .populate({
                        path: 'job',
                        select: 'name -_id ',
                    })
                    .select('-__v -read -active')
                    .lean();
                result.candidate = {
                    firstName: evaluationInformation.firstName,
                    lastName: evaluationInformation.firstName,
                };
                emitNotification(receiver, result);
            } catch (err) {
                console.error('Error creating new notification:', err);
            }
        }
        if (!evaluation)
            return res
                .status(500)
                .send(
                    i18n.__(
                        'An unknown problem has occurred, please try again later'
                    )
                );

        return res.status(201).send('Created');
    } catch (e) {
        return res.status(500).send('Error: ' + e.message);
    }
};

module.exports = { postEvaluation };
