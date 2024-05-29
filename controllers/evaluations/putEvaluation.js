const { Configuration, OpenAIApi } = require('openai');
const { controllers } = require('../../controllers/notificationController');
const { detectLanguage } = require('../../utils/utils');
const mongoose = require('mongoose');
const { sendHtmlEmail } = require('../../utils/mailer');
const pdfjsLib = require('pdfjs-dist');
const i18n = require('i18n');
const { emitNotification } = require('../../socketServer');
const { groupHistory } = require('../../utils');
const { removeStopwords, eng, fra } = require('stopword');
const { AffindaCredential, AffindaAPI } = require('@affinda/affinda');
const removeStopWords = (text, lang) => {
    const frenchChars = /[A-Za-zÀ-ÖØ-öø-ÿ]/;
    let filteredText;
    if (lang === 'french') {
        filteredText = removeStopwords(text.split(' '), fra);
    } else if (lang === 'english') {
        filteredText = removeStopwords(text.split(' '), eng);
    } else {
        filteredText = text.split('');
    }
    filteredText = filteredText.filter((el) => {
        if (isNaN(parseFloat(el)) && el.length > 1) return true;
        if (!isNaN(parseFloat(el)) && el.toString().length > 1) return true;
    });
    filteredText = filteredText.filter((el) => {
        if (frenchChars.test(el)) return true;
    });
    return filteredText.join(' ').substring(0, 2000);
};
const splitString = (str) => {
    // Ignore everything before '•'
    str = str.substring(str.indexOf('•') + 1);

    // Split the string by '•'
    return str.split('•');
};
const extractDataIdFromComment = (comment) => {
    const regex = /data-id="(?<dataId>[^"]+)"/;
    const { groups: { dataId } = {} } = comment.match(regex) || {};

    return dataId || null;
};
const { calculateScore } = require('./getEvaluation');
const { findNumberOfQuestionsToEvaluate } = require('./getEvaluation');
const { findNumberOfQuestionsEvaluated } = require('./getEvaluation');

const startEvaluation = async (req, res) => {
    try {
        const Evaluation = req.Evaluation;
        const evaluationId = req.params.id;
        const packId = req.params.packId;
        const hasHandicap = req.body.hasHandicap;

        const evaluation = await Evaluation.findOne({
            publicUrl: evaluationId,
            active: true,
            locked: { $exists: false },
        }).populate({
            path: 'test',
            select: 'packs extraTime',
            populate: { path: 'packs', select: '_id allowedTime questions' },
        });
        const startDate = new Date(Date.now());
        const pack = evaluation.packs.find(function (pack) {
            if (pack.id.toString() === packId.toString()) return pack;
        });
        const numberOfQuestions = pack.questions.length;
        const extraTime = hasHandicap
            ? (evaluation.test.extraTime * pack.allowedTime) / 100
            : 0;
        const packEndDate = new Date(
            startDate.getTime() + (extraTime + pack.allowedTime) * 1000
        );
        const startedPacks = evaluation.packsStarted.find(function (pack) {
            if (pack.id.toString() === packId.toString()) return pack;
        });
        if (startedPacks) {
            const numberOfQuestionsAnswered = evaluation.answers.length;
            let questionIndex = 0;
            let packIndex = 0;
            let currentPackCount = null;
            let currentQuestionCount = null;
            //We iterate over questions answered to get the current progress
            evaluation.packs.forEach((pack) => {
                pack.questions.forEach(() => {
                    if (questionIndex === numberOfQuestionsAnswered) {
                        currentPackCount = packIndex;
                        currentQuestionCount = questionIndex;
                    }
                    questionIndex++;
                });
                packIndex++;
            });
            const numberOfQuestions =
                evaluation.packs[currentPackCount].questions.length;

            let questionsAnswered = 0;

            //We get the number of questions that the user already answred
            evaluation.packsStarted.forEach((packPassed) => {
                evaluation.packs.forEach((pack) => {
                    if (
                        packPassed.id.toString() === pack.id.toString() &&
                        packPassed.actualEndDate
                    ) {
                        questionsAnswered += pack.questions.length;
                    }
                });
            });
            //We want to subtract questionsAnswered so we get the actual index
            currentQuestionCount -= questionsAnswered - 1;
            return res.status(200).json({
                numberOfQuestions: numberOfQuestions,
                currentQuestionCount: currentQuestionCount,
                packsStarted: [
                    {
                        startDate: startedPacks.startDate,
                        endDate: startedPacks.endDate,
                    },
                ],
            });
        }

        let evaluationStarted;

        if (evaluation.startDate) {
            evaluationStarted = await Evaluation.updateOne(
                { publicUrl: evaluationId },
                {
                    $push: {
                        packsStarted: {
                            startDate: startDate,
                            endDate: packEndDate,
                            id: packId,
                        },
                    },
                }
            );
        } else {
            evaluationStarted = await Evaluation.updateOne(
                { publicUrl: evaluationId },
                {
                    $set: {
                        hasHandicap: hasHandicap,
                        startDate: startDate,
                        packsStarted: {
                            startDate: startDate,
                            endDate: packEndDate,
                            id: packId,
                        },
                    },
                }
            );
        }
        if (!evaluationStarted)
            return res
                .status(500)
                .send(i18n.__('An unknown problem has occurred, please try again later'));

        return res.status(200).json({
            currentQuestionCount: 1,
            numberOfQuestions: numberOfQuestions,
            packsStarted: [{ startDate: startDate, endDate: packEndDate }],
        });
    } catch (e) {
        return res.status(500).send('Error: ' + e.message);
    }
};
const saveProgress = async (req, res) => {
    //TODO is the questions is checkbox, sometimes the user answers are not saved correctly
    try {
        const Evaluation = req.Evaluation;

        const evaluationId = req.params.id;
        const answers = req.body.answers;
        let finished = false;
        const evaluation = await Evaluation.findOne(
            { publicUrl: evaluationId, locked: { $exists: false } },
            'answers packs packsStarted firstName'
        ).populate({
            path: 'job',
            select: 'name'
        });
        if (!evaluation) return res.status(404).send('Evaluation not found');
        let currentQuestion = undefined;
        let nextQuestion = undefined;
        let endDate = undefined;
        let packId = undefined;
        if (evaluation.answers.length > 0) {
            const questionsAnswered = evaluation.answers.length;
            let questionIndex = 0;
            let packIndex = 0;
            evaluation.packs.forEach((pack) => {
                if (
                    questionIndex > questionsAnswered ||
                    nextQuestion === null
                ) {
                    return;
                }
                pack.questions.forEach((question) => {
                    delete question.correctAnswer;
                    if (questionIndex === questionsAnswered) {
                        currentQuestion = question;
                        if (
                            question ===
                            evaluation.packs[packIndex].questions[
                                evaluation.packs[packIndex].questions.length - 1
                            ]
                        ) {
                            nextQuestion = null;
                            endDate = new Date(Date.now());
                            packId = evaluation.packs[packIndex].id;
                            return;
                        }
                    } else if (questionIndex === questionsAnswered + 1)
                        nextQuestion = question;
                    else if (questionIndex > questionsAnswered + 1) {
                        return;
                    }
                    questionIndex++;
                });
                packIndex++;
            });
        } else {
            currentQuestion = evaluation.packs[0].questions[0];
            nextQuestion = evaluation.packs[0].questions[1]
                ? evaluation.packs[0].questions[1]
                : null;
        }
        if (currentQuestion) {
            const progressSaved = await Evaluation.updateOne(
                { publicUrl: evaluationId },
                {
                    $push: {
                        answers: {
                            question: currentQuestion.id,
                            answers: answers,
                        },
                    },
                }
            );
            if (!progressSaved)
                return res
                    .status(500)
                    .send(i18n.__('An unknown problem has occurred, please try again later'));
        }
        if (endDate) {
            const dateSaved = await Evaluation.updateOne(
                { publicUrl: evaluationId, 'packsStarted.id': packId },
                { $set: { 'packsStarted.$.actualEndDate': endDate } }
            );

            if (!dateSaved) {
                return res
                    .status(500)
                    .send(i18n.__('An unknown problem has occurred, please try again later'));
            }
        }
        if (
            evaluation.packs.length === evaluation.packsStarted.length &&
            nextQuestion === null
        ) {
            finished = true;
            const Candidate = req.Candidate;
            const candidate = await Candidate.findOne({
                    evaluations: { $in: [evaluation._id] },
                },
                'email firstName'
            )
            const Email = req.Email;
            const templateEmail = await Email.findOne({ _id: mongoose.Types.ObjectId('65d48640d5c3f032669d05fa') });
            const databaseInfo = req.DatabaseInfo;
            const replaceableObject = {
                '${first_name}': candidate.firstName,
                '${job}': evaluation.job.name,
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
        }
        return res
            .status(200)
            .json({ nextQuestion: nextQuestion, finished: finished });
    } catch (e) {
        return res.status(500).send('Error: ' + e.message);
    }
};
const addFeedback = async (req, res) => {
    try {
        const Evaluation = req.Evaluation;
        const evaluationId = req.params.id;
        const feedback = req.body.feedback;

        const evaluation = await Evaluation.findOne(
            { publicUrl: evaluationId },
            '_id'
        );

        if (!evaluation) return res.status(404).send('Evaluation not found');

        const feedbackAdded = await Evaluation.updateOne(
            { publicUrl: evaluationId },
            {
                $push: {
                    feedbacks: feedback,
                },
            }
        );
        if (!feedbackAdded)
            return res
                .status(500)
                .send(i18n.__('An unknown problem has occurred, please try again later'));

        return res.sendStatus(204);
    } catch (e) {
        return res.status(500).send('Error: ' + e.message);
    }
};
const addComment = async (req, res) => {
    try {
        //TODO: ADD NOTIFICATIONS
        const Evaluation = req.Evaluation;
        const evaluationId = req.params.id;
        const commentMessage = req.body.message;
        //TODO: change this to be dynamic
        const author = '6254441405e39ba31f88b264';
        const comment = {
            author: author,
            comment: commentMessage,
            date: new Date(Date.now()),
        };
        const commentAdded = await Evaluation.findOneAndUpdate(
            { _id: evaluationId },
            {
                $push: {
                    comments: comment,
                },
            }
        );
        if (!commentAdded)
            return res
                .status(500)
                .send(i18n.__('An unknown problem has occurred, please try again later'));
        comment.cardId = evaluationId;
        return res.status(200).json(comment);
    } catch (e) {
        return res.status(500).send('Error: ' + e.message);
    }
};
const resendEmail = async (req, res) => {
    try {
        const Evaluation = req.Evaluation;
        const evaluationId = req.params.id;
        const databaseInfo = req.DatabaseInfo;

        const evaluation = await Evaluation.findOne(
            { _id: mongoose.Types.ObjectId(evaluationId) },
            'publicUrl'
        ).populate({
            path: 'job',
            select: 'name'
        });
        const Candidate = req.Candidate;
        const candidate = await Candidate.findOne({
                evaluations: { $in: [evaluation._id] },
            },
            'email firstName lastName'
        )
        const Email = req.Email;
        const templateEmail = await Email.findOne({ _id: mongoose.Types.ObjectId('65d4776dd5c3f032669d05f3') });
        const replaceableObject = {
            '${first_name}': candidate.firstName,
            '${last_name}': candidate.lastName,
            '${job}': evaluation.job.name,
            '${assessment_link}': `${databaseInfo.frontendURI}evaluation/${evaluation.publicUrl}`,
            '${company_name}': databaseInfo.name,
        };
        let newContent = templateEmail.html;
        Object.keys(replaceableObject).forEach((key) => {
            newContent = newContent.replaceAll(key, replaceableObject[key]);
        });
        const mailSent = await sendHtmlEmail(
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
const updateStep = async (req, res) => {
    try {
        //TODO: ADD NOTIFICATIONS
        const Evaluation = req.Evaluation;
        const User = req.User;
        const Process = req.Process;
        const Notification = req.Notification;
        const evaluationId = req.params.id;
        const { comment, step } = req.body;
        const author = req.user.userId;
        const data = {
            author,
            comment,
            date: new Date(),
            step,
        };

        const updatedEvaluation = await Evaluation.findOneAndUpdate(
            { _id: evaluationId },
            {
                status: step,
                $push: {
                    steps: data,
                },
            },
            { new: true }
        ).populate('job', 'name');
        if (!updatedEvaluation) {
            return res.status(500).send('An error occurred with the database');
        }
        const stepEmail = await Process.findOne(
            { _id: step },
            'email name'
        ).populate({ path: 'email', select: 'subject attachments html -_id' });
        if (stepEmail.email) {
            const email = stepEmail.email;
            const databaseInfo = req.DatabaseInfo;
            const publicLink = `${databaseInfo.frontendURI}evaluation/${updatedEvaluation.publicUrl}`;

            const replaceableObject = {
                '${first_name}': updatedEvaluation.firstName,
                '${last_name}': updatedEvaluation.lastName,
                '${email}': updatedEvaluation.email,
                '${score}': updatedEvaluation.score,
                '${apply_date}': updatedEvaluation.created,
                '${job}': updatedEvaluation.job.name,
                '${status}': stepEmail.name,
                '${evaluation_link}': publicLink,
                '${evaluation_link}': publicLink,
            };
            let newContent = email.html;
            Object.keys(replaceableObject).forEach((key) => {
                newContent = newContent.replaceAll(key, replaceableObject[key]);
            });
            await sendHtmlEmail(
                updatedEvaluation.email,
                email.subject,
                newContent
            );
        }
        const steps = await Evaluation.findOne(
            { _id: evaluationId },
            'steps -_id'
        )
            .populate({
                path: 'steps.author',
                select: 'firstName lastName avatar -_id',
            })
            .populate({ path: 'steps.step', select: 'name email' })
            .lean();
        const extractedUser = extractDataIdFromComment(comment);
        if (extractedUser) {
            const notificationInformation = {
                sender: mongoose.Types.ObjectId(author),
                evaluation: evaluationId,
                receiver: extractedUser,
                type: controllers.NotificationType.userMentioned,
            };
            const notification = await Notification.create(
                notificationInformation
            );
            const result = await Notification.findOne(
                { _id: notification._id },
                'sender evaluation type created candidate job message'
            )
                .populate({
                    path: 'candidate',
                    select: 'firstName lastName -_id',
                })
                .populate({
                    path: 'sender',
                    select: 'firstName lastName -_id ',
                })
                .populate({ path: 'job', select: 'name -_id ' })
                .lean();
            emitNotification(extractedUser, result);
        }

        const evaluationHistory = steps.steps;
        const groupedHistory = groupHistory(evaluationHistory);

        return res.status(200).json({ groupedHistory });
    } catch (error) {
        return res.status(500).send(`Error: ${error.message}`);
    }
};
const addAdminEvaluationToQuestion = async (req, res) => {
    try {
        const Evaluation = req.Evaluation;
        const evaluationId = req.params.evaluationId;
        const questionId = req.params.questionId;
        const feedback = req.body.feedback;

        const evaluation = await Evaluation.findOne(
            { _id: evaluationId },
            'answers packs'
        );
        if (!evaluation) return res.status(404).send('Evaluation not found');
        const requestedQuestionIndex = evaluation.answers.findIndex(
            (element) => element.question.toString() === questionId
        );
        if (requestedQuestionIndex === -1)
            return res.status(400).json({
                data: "Le candidat n'a pas encore répondu à cette question",
            });

        const evaluationUpdated = await Evaluation.findOneAndUpdate(
            { _id: evaluationId },
            {
                $set: {
                    [`answers.${requestedQuestionIndex}.judgement`]: feedback,
                },
            },
            { returnOriginal: false }
        );

        if (!evaluationUpdated)
            return res
                .status(500)
                .send(i18n.__('An unknown problem has occurred, please try again later'));

        const scoreResult = await calculateScore(
            evaluationUpdated.answers,
            evaluationUpdated.packs,
            evaluation._id,
            Evaluation
        );
        const score = scoreResult.score;
        const scorePerPack = scoreResult.scorePerPack;

        const numberOfQuestionsEvaluated =
            findNumberOfQuestionsEvaluated(evaluationUpdated);
        const numberOfQuestionsToEvaluate =
            findNumberOfQuestionsToEvaluate(evaluationUpdated);

        return res.status(200).json({
            answers: evaluationUpdated.answers,
            numberOfQuestionsEvaluated: numberOfQuestionsEvaluated,
            numberOfQuestionsToEvaluate: numberOfQuestionsToEvaluate,
            score: score,
            scorePerPack: scorePerPack,
        });
    } catch (e) {
        return res.status(500).send('Error: ' + e.message);
    }
};
const lockEvaluation = async (req, res) => {
    try {
        const { Evaluation } = req;
        const { id } = req.params;
        let { reason, isUnlockOperation } = req.body;
        const endDate = new Date();
        const author = req.user.userId;
        let evaluation;

        if (isUnlockOperation === false) reason = 'ADMIN';
        if (mongoose.Types.ObjectId.isValid(id))
            evaluation = await Evaluation.findOne(
                { _id: id },
                '_id packs answers status'
            )
                .populate({ path: 'status', select: 'name' })
                .lean();
        else
            evaluation = await Evaluation.findOne(
                { publicUrl: id },
                '_id packs answers status'
            )
                .populate({ path: 'status', select: 'name' })
                .lean();

        if (!evaluation) return res.status(404).send('Evaluation not found');
        const stepsData = {
            author: author,
            comment: isUnlockOperation ? 'UNLOCK_OPERATION' : 'LOCK_OPERATION',
            step: evaluation.status,
        };
        let updateResult;
        if (isUnlockOperation) {
            updateResult = await Evaluation.updateOne(
                { _id: evaluation._id },
                {
                    $unset: { locked: '', lockedReason: '' },
                    $push: {
                        steps: stepsData,
                    },
                },
                { new: true }
            );
        } else {
            updateResult = await Evaluation.updateOne(
                { _id: evaluation._id },
                {
                    $set: {
                        locked: endDate,
                        lockedReason: reason,
                    },
                    $push: {
                        steps: stepsData,
                    },
                },
                { new: true }
            );
            await calculateScore(
                evaluation.answers,
                evaluation.packs,
                evaluation._id,
                Evaluation
            );
        }
        if (!updateResult)
            return res.status(500).send('An error occurred with the database');
        const steps = await Evaluation.findOne(
            { _id: evaluation._id },
            'steps -_id'
        )
            .populate({
                path: 'steps.author',
                select: 'firstName lastName avatar -_id',
            })
            .populate({ path: 'steps.step', select: 'name ' })
            .lean();
        const evaluationHistory = steps.steps;

        const groupedHistory = groupHistory(evaluationHistory);
        return res.status(200).send({ groupedHistory });
    } catch (error) {
        return res.status(500).send(`Error: ${error.message}`);
    }
};
const lockEvaluationFromCandidate = async (req, res) => {
    try {
        const { Evaluation } = req;
        const { id } = req.params;
        let { reason, isUnlockOperation } = req.body;
        const endDate = new Date();
        let evaluation;
        if (isUnlockOperation === false) reason = 'ADMIN';
        evaluation = await Evaluation.findOne(
            { publicUrl: id },
            '_id packs answers status'
        ).populate({ path: 'status', select: 'name' });
        if (!evaluation) return res.status(404).send('Evaluation not found');

        let updateResult = await Evaluation.findOneAndUpdate(
            { _id: evaluation._id },
            {
                $set: {
                    locked: endDate,
                    lockedReason: reason,
                },
            }
        );
        await calculateScore(
            evaluation.answers,
            evaluation.packs,
            evaluation._id,
            Evaluation
        );
        if (!updateResult)
            return res.status(500).send('An error occurred with the database');
        return res.sendStatus(200);
    } catch (error) {
        return res.status(500).send(`Error: ${error.message}`);
    }
};
const changeUser = async (req, res) => {
    try {
        const { Evaluation, Notification } = req;
        const { id } = req.params;
        let { newUser } = req.body;
        const author = req.user.userId;
        const updateResult = await Evaluation.updateOne(
            { _id: mongoose.Types.ObjectId(id) },
            { $set: { currentUser: newUser } }
        );
        const notificationInformation = {
            sender: author,
            evaluation: id,
            receiver: newUser,
            type: controllers.NotificationType.userAffectation,
        };
        const notification = await Notification.create(notificationInformation);
        const result = await Notification.findOne(
            { _id: notification._id },
            'sender evaluation type created candidate job message'
        )
            .populate({ path: 'candidate', select: 'firstName lastName -_id' })
            .populate({ path: 'sender', select: 'firstName lastName -_id ' })
            .populate({ path: 'job', select: 'name -_id ' })
            .lean();
        emitNotification(newUser, result);
        if (!updateResult)
            return res.status(500).send('An error occurred with the database');

        return res.sendStatus(204);
    } catch (error) {
        return res.status(500).send(`Error: ${error.message}`);
    }
};
//TODO we need to edit this to add X time instead of 5 minutes
const addTime = async (req, res) => {
    try {
        const { Evaluation } = req;
        const { id } = req.params;
        const fiveMinutes = 5 * 60 * 1000;
        const author = req.user.userId;
        const evaluation = await Evaluation.findOne(
            { _id: id },
            ' packsStarted _id status'
        )
            .populate({ path: 'status', select: 'name' })
            .lean();
        if (!evaluation) return res.status(404).send('Evaluation not found');

        const len = evaluation.packsStarted.length - 1;
        const endDate = evaluation.packsStarted[len].endDate;
        const packId = evaluation.packsStarted[len]._id;
        const updatedDate = new Date(endDate.getTime() + fiveMinutes);

        const objUpdate = {};
        const updateQuery = 'packsStarted.' + len + '.endDate';
        objUpdate[updateQuery] = updatedDate;

        const stepsData = {
            author: author,
            comment: 'TIME_ADDED',
            step: evaluation.status,
        };
        const updateResult = await Evaluation.updateOne(
            { _id: evaluation._id, 'packsStarted._id': packId },
            {
                $set: {
                    'packsStarted.$.endDate': updatedDate,
                },
                $push: {
                    steps: stepsData,
                },
            }
        );
        if (!updateResult)
            return res.status(500).send('An error occurred with the database');
        const steps = await Evaluation.findOne(
            { _id: evaluation._id },
            'steps -_id'
        )
            .populate({
                path: 'steps.author',
                select: 'firstName lastName avatar -_id',
            })
            .populate({ path: 'steps.step', select: 'name ' })
            .lean();
        const evaluationHistory = steps.steps;
        const groupedHistory = groupHistory(evaluationHistory);
        return res.status(200).send({ groupedHistory });
    } catch (error) {
        console.log(error);
        return res.status(500).send(`Error: ${error.message}`);
    }
};

module.exports = {
    startEvaluation,
    saveProgress,
    addFeedback,
    lockEvaluation,
    lockEvaluationFromCandidate,
    addAdminEvaluationToQuestion,
    addComment,
    updateStep,
    resendEmail,
    addTime,
    changeUser,
};
