const mongoose = require('mongoose');
const Redis = require('../../redis');
const i18n = require('i18n');
const { findDuplicates } = require('../candidates/editCandidate');
const { groupHistory } = require('../../utils');

function randomIntFromInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}
/**
 * Shuffles an array of elements, excluding elements with a specific property.
 *
 * @param {Array} a - The array to be shuffled.
 * @returns {Array} - The shuffled array.
 *
 * @example
 * const exampleArray = [
 *    { value: 'A', isTrainingQuestion: true },
 *    { value: 'B', isTrainingQuestion: false },
 *    { value: 'C', isTrainingQuestion: true },
 *    { value: 'D', isTrainingQuestion: false },
 * ];
 *
 * // Output: Shuffled array excluding elements with isTrainingQuestion set to true:
 * // [
 * //    { value: 'B', isTrainingQuestion: false },
 * //    { value: 'D', isTrainingQuestion: false },
 * //    { value: 'A', isTrainingQuestion: true },
 * //    { value: 'C', isTrainingQuestion: true },
 * // ]
 */
function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        if (!a[j].isTrainingQuestion) [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}
/**
 * Shuffles the answers of a question object and updates correct answer indices.
 *
 * @param {Object} question - The question object to be shuffled.
 * @returns {Object} - The question object after shuffling.
 *
 * @example
 * const exampleQuestion = {
 *     questionText: "What is the capital of France?",
 *     answers: ["Berlin", "Paris", "Madrid", "Rome"],
 *     correctAnswer: [1],
 * };
 *
 * // Output:
 * // {
 * //    questionText: "What is the capital of France?",
 * //    answers: ["Madrid", "Rome", "Berlin", "Paris"],
 * //    correctAnswer: [2],
 * // }
 */
function shuffleAnswers(question) {
    for (let i = question.answers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [question.answers[i], question.answers[j]] = [
            question.answers[j],
            question.answers[i],
        ];

        if (question.correctAnswer.includes(j))
            question.correctAnswer.splice(
                question.correctAnswer.indexOf(j),
                1,
                i
            );
        else if (question.correctAnswer.includes(i))
            question.correctAnswer.splice(
                question.correctAnswer.indexOf(i),
                1,
                j
            );
    }
    return question;
}
const calculateAverageScore = async (evaluations) => {
    let averageScore = 0;
    let numberOfEvaluations = 0;
    evaluations.forEach((evaluation) => {
        if (evaluation.score > 0) {
            numberOfEvaluations++;
            averageScore += evaluation.score;
        }
    });
    if (averageScore > 0) return (averageScore /= numberOfEvaluations);
    return 0;
};
const findNumberOfQuestionsEvaluated = (evaluation = null) => {
    if (!evaluation || !evaluation.answers) {
        return 0;
    }
    return evaluation.answers.filter((answer) => !isNaN(answer.judgement))
        .length;
};
const findNumberOfQuestionsToEvaluate = (evaluation) => {
    return evaluation.packs.reduce((count, pack) => {
        return (
            count +
            pack.questions.filter(
                (question) => question.correctAnswer.length === 0
            ).length
        );
    }, 0);
};
const findEtatOfEvaluation = (evaluation = null, numberOfQuestions) => {
    let etat;
    switch (true) {
        case evaluation.locked instanceof Date &&
            numberOfQuestions === evaluation.answers.length:
            etat = 'EVALUATION_FINISHED';
            break;
        case evaluation.locked instanceof Date:
            etat = 'EVALUATION_LOCKED';
            break;
        case evaluation.startDate instanceof Date:
            etat = 'EVALUATION_IN_PROGRESS';
            break;
        default:
            etat = 'EVALUATION_NOT_STARTED';
            break;
    }
    return etat;
};
const calculateThreshold = (averageScore) => {
    const minThreshold = averageScore - 10;
    const maxThreshold = averageScore + 10;
    return { minThreshold: minThreshold, maxThreshold: maxThreshold };
};
const compareArrays = (arrA, arrB) => {
    const uniqueA = [...new Set(arrA)];
    const uniqueB = [...new Set(arrB)];
    uniqueA.sort();
    uniqueB.sort();
    let matches = 0;
    for (let i = 0; i < uniqueA.length; i++) {
        if (uniqueB.includes(uniqueA[i])) {
            matches++;
        }
    }
    const similarity = matches / Math.max(uniqueA.length, uniqueB.length);
    return similarity * 5;
};
/**
 * Calculates the overall score and score per pack based on user answers and evaluation criteria.
 *
 * @async
 * @param {Object[]} userAnswers - An array of user answers to questions.
 * @param {Object[]} packs - An array of evaluation packs containing questions.
 * @param {string} evaluationId - The unique identifier of the evaluation.
 * @param {Object} Evaluation - The model for the Evaluation.
 * @returns {Object} - An object containing the overall score and score per pack.
 *
 * @example
 * const exampleUserAnswers = [
 *    { question: 'questionId1', answers: ['option1'], judgement: 4 },
 *    { question: 'questionId2', answers: ['option2', 'option3'], judgement: 2 },
 *    // ... more user answers
 * ];
 *
 * const examplePacks = [
 *    {
 *        id: 'packId1',
 *        questions: [
 *            { id: 'questionId1', isTrainingQuestion: false, isRandomResponseChecker: false, correctAnswer: ['option1'] },
 *            { id: 'questionId2', isTrainingQuestion: false, isRandomResponseChecker: false, correctAnswer: ['option2', 'option3'] },
 *            // ... more questions in the pack
 *        ],
 *    },
 *    // ... more packs
 * ];
 * // Output:
 * // {
 * //    score: 75,
 * //    scorePerPack: [
 * //       { score: '(60%)', id: 'packId1' },
 * //       { score: '(30%)', id: 'packId2' },
 * //       // ... more score per pack entries
 * //    ],
 * // }
 */
async function calculateScore(userAnswers, packs, evaluationId, Evaluation) {
    let score = 0;
    let eligibleQuestions = 0;
    let eligibleQuestionsForPack;
    let scoreOfSinglePack;
    const scorePerPack = [];
    for (const pack of packs) {
        eligibleQuestionsForPack = 0;
        scoreOfSinglePack = 0;
        for (const question of pack.questions) {
            //Find questions that we take into account while calculating score
            if (
                !question.isTrainingQuestion &&
                !question.isRandomResponseChecker
            ) {
                const userAnswer = userAnswers.find(
                    (element) =>
                        element.question.toString() ===
                            question.id.toString() || null
                );
                eligibleQuestions++;
                eligibleQuestionsForPack++;
                //The user answered that question
                if (userAnswer) {
                    //No correct answer field
                    if (question.correctAnswer.length === 0) {
                        //value is defined
                        const judgement = Number(userAnswer.judgement);
                        if (!isNaN(judgement)) {
                            score += judgement;
                            scoreOfSinglePack += judgement;
                        }
                    }
                    //Radio
                    else if (question.correctAnswer.length === 1) {
                        if (
                            question.correctAnswer.toString() ===
                            userAnswer.answers.toString()
                        ) {
                            score += 5;
                            scoreOfSinglePack += 5;
                        }
                    }
                    //Checkbox
                    else if (question.correctAnswer.length >= 1) {
                        score += compareArrays(
                            question.correctAnswer,
                            userAnswer.answers
                        );
                        scoreOfSinglePack += compareArrays(
                            question.correctAnswer,
                            userAnswer.answers
                        );
                    }
                }
            }
        }
        scorePerPack.push({
            score: `(${Math.round(
                (scoreOfSinglePack / (eligibleQuestionsForPack * 5)) * 100
            )}%)`,
            id: pack.id,
        });
    }

    const finalScore = Math.round((score / (eligibleQuestions * 5)) * 100);
    if (finalScore >= 0)
        await Evaluation.updateOne(
            { _id: evaluationId },
            {
                $set: {
                    score: finalScore,
                    scorePerPack: scorePerPack,
                },
            }
        );
    return {
        score: finalScore,
        scorePerPack: scorePerPack,
    };
}
const getEvaluationForAdmin = async (req, res) => {
    try {
        const Evaluation = req.Evaluation;
        const Candidate = req.Candidate;
        const evaluationId = req.params.id;
        const databaseInfo = req.DatabaseInfo;
        const cacheKey = `evaluation${evaluationId}`;
        if (Redis.isConnected()) {
            const cachedData = await Redis.get(cacheKey);
            if (cachedData) {
                console.log(`Serving evaluation${evaluationId} from cache.`);
                const evaluations = JSON.parse(cachedData);
                return res.status(200).json(evaluations);
            }
        }
        const userId = mongoose.Types.ObjectId(req.user.userId);
        //get evaluation with all questions and test parameters
        const evaluationAggregate = await Evaluation.aggregate([
            {
                $match: {
                    _id: mongoose.Types.ObjectId(evaluationId),
                },
            },
            {
                $lookup: {
                    from: 'jobs',
                    let: { jobId: '$job' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ['$_id', '$$jobId'],
                                },
                            },
                        },
                        {
                            $project: {
                                _id: 1,
                                users: 1,
                                name: 1,
                            },
                        },
                    ],
                    as: 'job',
                },
            },
            {
                $match: {
                    $or: [
                        { 'job.users': { $in: [userId] } },
                        { currentUser: userId },
                    ],
                },
            },
            {
                $lookup: {
                    from: 'tests',
                    let: { testId: '$test' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ['$_id', '$$testId'],
                                },
                            },
                        },
                        {
                            $project: {
                                _id: 0,
                                allowedTime: 1,
                                name: 1,
                                disableCopyPaste: 1,
                                enableTrainingQuestions: 1,
                                enableExtraTime: 1,
                                extraTime: 1,
                                enableRandomResponsesChecker: 1,
                            },
                        },
                    ],
                    as: 'test',
                },
            },
            {
                $lookup: {
                    from: 'processes',
                    let: { statusId: '$status' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ['$_id', '$$statusId'],
                                },
                            },
                        },
                        {
                            $project: {
                                _id: 1,
                                name: 1,
                            },
                        },
                    ],
                    as: 'status',
                },
            },
            {
                $project: {
                    _id: 1,
                    publicUrl: 1,
                    resume: 1,
                    startDate: 1,
                    answers: 1,
                    locked: 1,
                    lockedReason: 1,
                    smartAnalysis: 1,
                    currentUser: 1,
                    created: 1,
                    candidateInfo: 1,
                    packs: 1,
                    score: 1,
                    scorePerPack: 1,
                    job: { $arrayElemAt: ['$job', 0] },
                    test: { $arrayElemAt: ['$test', 0] },
                    status: { $arrayElemAt: ['$status', 0] },
                },
            },
            {
                $limit: 1,
            },
        ]);

        const evaluation = evaluationAggregate[0];
        if (!evaluation) return res.status(404).send('Evaluation not found');
        //get candidate
        const currentCandidate = await Candidate.findOne({
            evaluations: { $in: [evaluation._id] },
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

        //get Steps
        const Process = req.Process;
        let fields = [
            'name',
            'emailBefore',
            'emailAfter',
            'hasEvaluation',
            'position',
            '_id',
        ];
        let params = { active: true };
        const processes = await Process.find(params, fields, {
            sort: { position: 1 },
        }).lean();

        const parsedSteps = processes.map((etape) => ({
            label: etape.name,
            value: etape._id.toString(),
        }));

        const selectedStep = parsedSteps.find(
            (element) => element.value === evaluation.status._id.toString()
        );

        //get Users
        const User = req.User;
        fields = ['firstName', 'lastName', '_id'];
        const users = await User.find(params, fields)
            .sort({ firstName: 1, lastName: 1 })
            .lean();

        const parsedUsers = users.map((user) => ({
            label:
                req.user.userId === user._id
                    ? i18n.__('You')
                    : `${user.firstName} ${user.lastName}`,
            value: user._id.toString(),
        }));
        //get History
        const steps = await Evaluation.findOne(
            { _id: mongoose.Types.ObjectId(evaluationId) },
            'steps -_id'
        )
            .populate({
                path: 'steps.author',
                select: 'firstName lastName avatar -_id',
            })
            .populate({ path: 'steps.step', select: 'name ' })
            .lean();

        const evaluationHistory = steps?.steps || [];
        const groupedHistory = groupHistory(evaluationHistory);
        const selectedUser = parsedUsers.find(
            (element) => element.value === evaluation.currentUser?.toString()
        );

        const publicLink = `${databaseInfo.frontendURI}evaluation/${evaluation.publicUrl}`;

        const numberOfQuestions = evaluation.packs.reduce((total, pack) => {
            return total + pack.questions.length;
        }, 0);
        // Calculate evaluation status
        const etat = findEtatOfEvaluation(evaluation, numberOfQuestions);
        const numberOfQuestionsEvaluated =
            findNumberOfQuestionsEvaluated(evaluation);
        const numberOfQuestionsToEvaluate =
            findNumberOfQuestionsToEvaluate(evaluation);

        // Calculate score if necessary
        let score;
        let scorePerPack;
        if (
            etat === 'EVALUATION_FINISHED' ||
            etat === 'EVALUATION_LOCKED'
            /*   && evaluation.score === undefined*/
        ) {
            const scoreResult = await calculateScore(
                evaluation.answers,
                evaluation.packs,
                evaluation._id,
                Evaluation
            );
            score = scoreResult.score;
            scorePerPack = scoreResult.scorePerPack;
        } else {
            score = evaluation.score;
            scorePerPack = evaluation.scorePerPack || [];
        }
        const jobId = evaluation.job._id;
        let threshold;
        let thresholdCache = `threshhold${jobId}`;
        let cachedThreshold;
        if (Redis.isConnected()) {
            cachedThreshold = await Redis.get(thresholdCache);
        }
        if (cachedThreshold) {
            console.log(`Serving threshhold${jobId} from cache.`);
            threshold = JSON.parse(cachedThreshold);
        } else {
            console.log(`Serving threshhold${jobId} from DB.`);
            // Calculate average score and threshold
            const evaluations = await Evaluation.find(
                { active: true, job: mongoose.Types.ObjectId(jobId) },
                'score'
            ).lean();
            const averageScore = await calculateAverageScore(evaluations);
            threshold = calculateThreshold(averageScore);
            if (Redis.isConnected()) {
                await Redis.set(thresholdCache, JSON.stringify(threshold), {
                    EX: 120,
                    NX: true,
                }); // cache for 60 seconds
            }
        }

        // Combine data into a single object
        const data = {
            ...evaluation,
            currentCandidate,
            etat,
            score,
            groupedHistory,
            scorePerPack,
            publicLink,
            threshold,
            numberOfQuestions,
            numberOfQuestionsToEvaluate,
            numberOfQuestionsEvaluated,
            selectedStep,
            parsedSteps,
            parsedUsers,
            selectedUser,
        };

        if (Redis.isConnected()) {
            await Redis.set(cacheKey, JSON.stringify(data), {
                EX: 120,
                NX: true,
            }); // cache for 60 seconds
        }
        return res.status(200).json(data);
    } catch (e) {
        return res.status(500).send('Error: ' + e.message);
    }
};
const getEvaluationHistory = async (req, res) => {
    try {
        const Evaluation = req.Evaluation;
        const evaluationId = req.params.id;
        const steps = await Evaluation.findOne(
            { _id: evaluationId },
            'steps -_id'
        )
            .populate({
                path: 'steps.author',
                select: 'firstName lastName avatar -_id',
            })
            .populate({ path: 'steps.step', select: 'name ' });

        if (!steps) return res.status(404).send('Evaluation not found');

        return res.status(200).json(steps);
    } catch (e) {
        return res.status(500).send('Error: ' + e.message);
    }
};
const getEvaluation = async (req, res) => {
    const fullUrl = req.protocol + '://' + req.get('host') + '/uploads/visual/';
    try {
        const Evaluation = req.Evaluation;
        const Question = req.Question;
        const Candidate = req.Candidate;

        const evaluationId = req.params.id;

        //get evaluation with all questions and test parameters
        let evaluation = await Evaluation.findOne({
            publicUrl: evaluationId,
            active: true,
        })
            .populate({ path: 'job', select: 'name image' })
            .populate({
                path: 'test',
                populate: { path: 'packs', populate: { path: 'questions' } },
            })
            .lean();
        if (!evaluation) return res.status(404).send('Evaluation not found');
        const currentCandidate = await Candidate.findOne(
            {
                evaluations: { $in: [evaluation._id] },
            },
            { firstName: 1 }
        ).lean();

        let numberOfVideoQuestions = 0;
        let numberOfCodeQuestions = 0;
        //We will store the questions after random order and with additional options here
        let finalQuestions = [];

        //We will store the packs after random order and with additional options here
        let finalPacks = [];
        //if we finished the evaluation
        let finished = false;
        //If evaluation is in progress  and has a next pack
        let hasNext = false;

        //user feedback of the packs
        let feedback = [];

        //Count of started and finished packs
        let packStarted = 0;
        let packFinished = 0;
        if (evaluation.packsStarted.length < evaluation.packs.length)
            hasNext = true;

        evaluation.packsStarted.forEach((pack) => {
            if (pack.startDate) packStarted++;
            if (pack.actualEndDate) packFinished++;
        });
        // We push true if user already gave feedback on that pack
        evaluation.feedbacks.forEach(() => {
            feedback.push(true);
        });
        if (
            packStarted === packFinished &&
            evaluation.packs.length === packFinished &&
            packStarted !== 0
        )
            finished = true;
        if (evaluation.locked && finished)
            return res.status(200).send({ finished: true, locked: true });
        if (evaluation.locked) return res.status(200).send({ locked: true });

        //If we finished the evaluation
        if (finished && !hasNext) {
            const numberOfQuestionsAnswered = evaluation.answers.length - 1;

            let questionIndex = 0;
            let packIndex = 0;

            let currentPackCount = null;
            let currentQuestionCount = null;

            // #TODO think about refactoring this
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

            const finalEvaluation = {
                id: evaluationId,
                hasNext: hasNext,
                currentPackCount: currentPackCount,
                currentQuestionCount: currentQuestionCount,
                outroVideo: evaluation.test.outroVideo,
                feedback: feedback,
                enableFeedback: evaluation.test.enableFeedback,
                finished: finished,
                jobName: evaluation.job.name,
                jobImage: fullUrl + evaluation.job.image,
                firstName: currentCandidate.firstName,
            };
            return res.status(200).json(finalEvaluation);
        }

        //if we finished all packs
        if (
            packStarted === packFinished &&
            evaluation.packs.length === packFinished &&
            packStarted !== 0
        )
            finished = true;
        //We didn't start the evaluation
        if (!evaluation.startDate) {
            //If enableTrainingQuestions is true we will set the X first questions as true
            if (evaluation.test.enableTrainingQuestions) {
                for (
                    let i = 0;
                    i < evaluation.test.numberOfTrainingQuestions &&
                    i < evaluation.test.packs[0].questions.length;
                    i++
                ) {
                    evaluation.test.packs[0].questions[
                        i
                    ].isTrainingQuestion = true;
                }
            }
            //If randomOrder is true we will shuffle the answers of all questions
            evaluation.test.packs.forEach((pack) => {
                if (pack.randomOrder)
                    pack.questions.forEach((question) => {
                        shuffleAnswers(question);
                    });
            });
            //If randomQuestions is true we will shuffle the questions
            evaluation.test.packs.forEach((pack) => {
                if (pack.randomQuestions) shuffle(pack.questions);
            });
            //If enableRandomResponsesChecker is true we ill add a question at a random order

            if (evaluation.test.enableRandomResponsesChecker) {
                const min = 0;
                const max = evaluation.test.packs.length;
                const randomPackIndex = randomIntFromInterval(min, max - 1);
                const maxQuestions =
                    evaluation.test.packs[randomPackIndex].questions.length;
                const randomQuestionIndex = randomIntFromInterval(
                    min + 1,
                    maxQuestions - 1
                );

                const randomResponseChecker = await Question.findOne({
                    _id: '637650020e38bc9876155bd4',
                });

                //insert the question in a random position
                evaluation.test.packs[randomPackIndex].questions.splice(
                    randomQuestionIndex,
                    0,
                    randomResponseChecker
                );
            }

            let timeForVideos = 0;

            evaluation.test.packs.forEach((pack) => {
                finalQuestions = [];

                pack.questions.forEach((question) => {
                    //count number of video and coding questions
                    if (question.type === 'video') {
                        numberOfVideoQuestions++;
                        timeForVideos -=
                            question.allowedTime -
                            Math.round(question.allowedTime / 10);
                    } else if (question.type === 'code')
                        numberOfCodeQuestions++;
                    //We save all the questions in an array so we can attach them to the evaluation in case the question is edited/deleted later

                    finalQuestions.push({
                        id: question._id,
                        type: question.type,
                        name: question.name,
                        allowedTime: question.allowedTime,
                        category: question.category,
                        isRandomResponseChecker:
                            question.isRandomResponseChecker,
                        difficulty: question.difficulty,
                        applyPenalty: question.applyPenalty,
                        isSearchable: question.isSearchable,
                        description: question.description,
                        answers: question.answers,
                        correctAnswer: question.correctAnswer,
                        isTrainingQuestion: question.isTrainingQuestion,
                    });
                });

                //We save all the packs in an array so we can attach them to the evaluation in case the pack is edited/deleted later
                finalPacks.push({
                    id: pack._id,
                    name: pack.name,
                    allowedTime: pack.allowedTime,
                    questions: finalQuestions,
                });
            });
            //We save the cloned packs/questions in DB
            const evaluationUpdated = await Evaluation.updateOne(
                { publicUrl: evaluationId },
                {
                    $set: {
                        packs: finalPacks,
                    },
                }
            );
            if (!evaluationUpdated)
                return res
                    .status(500)
                    .send(i18n.__('An unknown problem has occurred, please try again later'));

            //We save the number of questions/packs of the first pack since the evaluation is not started and the user will start in the first pack
            const numberOfQuestions = finalPacks[0].questions.length;
            const numberOfTests = finalPacks.length;

            //We don't want the user to see all questions
            finalPacks.forEach((pack) => {
                delete pack.questions;
            });

            if (evaluation.packsStarted.length < finalPacks.length)
                hasNext = true;

            const finalEvaluation = {
                id: evaluationId,
                hasNext: hasNext,
                enableFeedback: evaluation.test.enableFeedback,
                finished: finished,
                feedback: [],
                currentPackCount: 0,
                currentQuestionCount: 0,
                introVideo: evaluation.test.introVideo,
                outroVideo: evaluation.test.outroVideo,
                enableExtraTime: evaluation.test.enableExtraTime,
                disableCopyPaste: evaluation.test.disableCopyPaste,
                webcamScreenshots: evaluation.test.webcamScreenshots,
                estimatedTime: evaluation.test.allowedTime + timeForVideos,
                numberOfQuestions: numberOfQuestions,
                numberOfTests: numberOfTests,
                numberOfVideoQuestions: numberOfVideoQuestions,
                numberOfCodeQuestions: numberOfCodeQuestions,
                packs: finalPacks,
                packsStarted: evaluation.packsStarted || [],
                jobName: evaluation.job.name,
                jobImage: fullUrl + evaluation.job.image,
                firstName: currentCandidate.firstName,
            };
            return res.status(200).json(finalEvaluation);
        }

        //The user started the evaluation
        else if (!finished) {
            let timeForVideos = 0;
            //CHECK IF -1
            const numberOfQuestionsAnswered = evaluation.answers.length;
            let questionIndex = 0;
            let packIndex = 0;
            let currentPackCount = null;
            let currentQuestionCount = null;

            //We iterate over questions answered to get the current progress
            evaluation.packs.forEach((pack) => {
                pack.questions.forEach((question) => {
                    if (question.type === 'video')
                        timeForVideos -=
                            question.allowedTime -
                            Math.round(question.allowedTime / 10);
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
            const numberOfTests = evaluation.packs.length;

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

            const finalPacks = evaluation.packs;

            finalPacks.forEach((pack) => {
                delete pack.questions;
            });
            const finalEvaluation = {
                id: evaluationId,
                hasNext: hasNext,
                enableFeedback: evaluation.test.enableFeedback,
                finished: finished,
                feedback: feedback,
                currentPackCount: currentPackCount,
                currentQuestionCount: currentQuestionCount,
                startDate: evaluation.startDate,
                packsStarted: evaluation.packsStarted,
                introVideo: evaluation.test.introVideo,
                outroVideo: evaluation.test.outroVideo,
                enableExtraTime: evaluation.test.enableExtraTime,
                disableCopyPaste: evaluation.test.disableCopyPaste,
                webcamScreenshots: evaluation.test.webcamScreenshots,
                estimatedTime: evaluation.test.allowedTime + timeForVideos,
                numberOfQuestions: numberOfQuestions,
                numberOfTests: numberOfTests,
                numberOfVideoQuestions: numberOfVideoQuestions,
                numberOfCodeQuestions: numberOfCodeQuestions,
                packs: finalPacks,
                jobName: evaluation.job.name,
                jobImage: fullUrl + evaluation.job.image,
                firstName: currentCandidate.firstName,
            };
            return res.status(200).json(finalEvaluation);
        } else {
            return res.status(200).send({ locked: true, finished: true });
        }
    } catch (e) {
        return res.status(500).send('Error Evaluation: ' + e);
    }
};
const getEvaluations = async (req, res) => {
    try {
        const cacheKey = `evaluations-${req.user.userId}`;
        if (Redis.isConnected()) {
            const cachedData = await Redis.get(cacheKey);
            if (cachedData) {
                console.log(
                    `Serving evaluations-${req.user.userId} from cache`
                );
                const evaluations = JSON.parse(cachedData);
                return res.status(200).json(evaluations);
            }
        }
        let result = [];
        const userId = mongoose.Types.ObjectId(req.user.userId);
        const Evaluation = req.Evaluation;
        const Candidate = req.Candidate;
        const candidates = await Candidate.find(
            {},
            { firstName: 1, lastName: 1, email: 1, evaluations: 1 }
        ).lean();
        const evaluations = await Evaluation.aggregate([
            {
                $lookup: {
                    from: 'jobs',
                    let: { jobId: '$job' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ['$_id', '$$jobId'],
                                },
                            },
                        },
                        {
                            $project: {
                                _id: 1,
                                name: 1,
                                users: 1,
                            },
                        },
                    ],
                    as: 'job',
                },
            },
            {
                $match: {
                    $or: [
                        { 'job.users': { $in: [userId] } },
                        { currentUser: userId },
                    ],
                },
            },
            {
                $lookup: {
                    from: 'processes',
                    let: { statusId: '$status' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ['$_id', '$$statusId'],
                                },
                            },
                        },
                        {
                            $project: {
                                _id: 1,
                                name: 1,
                            },
                        },
                    ],
                    as: 'status',
                },
            },
            {
                $lookup: {
                    from: 'users',
                    let: { userId: '$currentUser' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ['$_id', '$$userId'],
                                },
                            },
                        },
                        {
                            $project: {
                                _id: 0,
                                firstName: 1,
                                lastName: 1,
                            },
                        },
                    ],
                    as: 'user',
                },
            },
            {
                $project: {
                    _id: 1,
                    startDate: 1,
                    locked: 1,
                    firstName: 1,
                    publicUrl: 1,
                    smartAnalysis: 1,
                    email: 1,
                    created: 1,
                    packs: 1,
                    answers: 1,
                    lastName: 1,
                    resume: 1,
                    score: 1,
                    job: { $arrayElemAt: ['$job', 0] },
                    status: { $arrayElemAt: ['$status', 0] },
                    user: { $arrayElemAt: ['$user', 0] },
                },
            },
            {
                $sort: {
                    applyDate: -1,
                    score: -1,
                },
            },
        ]);
        const searchTerms = [];
        if (!evaluations || evaluations.length === 0)
            return res.status(404).send('Evaluations not found');

        const jobsList = new Set();
        const status = new Set();
        const users = new Set();
        evaluations.map((evaluation) => {
            const currentCandidate = candidates.find((candidate) =>
                candidate.evaluations.some(
                    (evaluationId) =>
                        evaluationId.toString() === evaluation._id.toString()
                )
            );
            const otherJobs = currentCandidate?.evaluations?.length - 1 || 0;
            const numberOfQuestions = evaluation.packs.reduce((total, pack) => {
                return total + pack.questions.length;
            }, 0);
            const etat = findEtatOfEvaluation(evaluation, numberOfQuestions);
            const needAction =
                findNumberOfQuestionsToEvaluate(evaluation) !==
                    findNumberOfQuestionsEvaluated(evaluation) &&
                etat === 'EVALUATION_FINISHED';
            let user;

            if (evaluation.user) {
                user = `${evaluation.user.firstName} ${evaluation.user.lastName}`;
            } else {
                user = '';
            }
            jobsList.add(evaluation?.job?.name || '');
            users.add(user);
            status.add(evaluation.status.name);
            jobsList.delete('');
            users.delete('');

            const tmpObject = {
                user: user,
                questions: [],
                answers: [],
                status: evaluation.status.name,
                etat: etat,
                needAction: needAction,
                firstName: currentCandidate?.firstName || '',
                resume: evaluation.resume,
                lastName: currentCandidate?.lastName || '',
                email: currentCandidate?.email || '',
                publicUrl: evaluation.publicUrl,
                applyDate: evaluation.created,
                startDate: evaluation.startDate,
                finishDate: evaluation.locked,
                smartAnalysis: !!evaluation.smartAnalysis,
                //THis is a tmp fix because old evaluations didn't have a job and we implemented it later
                job: evaluation?.job?.name || '',
                score: evaluation.score,
                id: evaluation._id,
                otherJobs: otherJobs,
            };
            result.push(tmpObject);
        });

        const threshold = calculateThreshold(50);
        const finalEvaluations = {
            threshold: threshold,
            evaluations: result,
            jobsList: Array.from(jobsList),
            status: Array.from(status),
            users: Array.from(users),
            searchTerms: searchTerms,
        };

        if (Redis.isConnected()) {
            await Redis.set(cacheKey, JSON.stringify(finalEvaluations), {
                EX: 120,
                NX: true,
            }); // cache for 60 seconds
        }
        return res.status(200).json(finalEvaluations);
    } catch (e) {
        return res.status(500).send('Error: ' + e.message);
    }
};
const getCandidates = async (req, res) => {
    try {
        const cacheKey = `candidates-`;
        if (Redis.isConnected()) {
            const cachedData = await Redis.get(cacheKey);
            if (cachedData) {
                console.log(`Serving candidates- from cache`);
                const candidates = JSON.parse(cachedData);
                return res.status(200).json(candidates);
            }
        }
        const Evaluation = req.Evaluation;
        const Process = req.Process;
        const steps = await Process.find({ active: true }, 'name position');
        const candidates = await Evaluation.find(
            { active: true },
            'email firstName lastName resume smartAnalysis created score'
        )
            .populate({ path: 'status', select: 'name position _id' })
            .populate({ path: 'job', select: 'name' })
            .populate({
                path: 'currentUser',
                select: 'avatar firstName lastName _id',
            })
            .populate({ path: 'steps', select: 'author' });

        const duplicates = await findDuplicates(Evaluation);
        const filteredCandidates = [];
        const filteredSteps = [];
        if (!candidates) return res.status(404).send('Candidates not found');
        steps.forEach((step) => {
            filteredSteps.push({
                id: step._id,
                count: 0,
                name: step.name,
                cardIds: [],
                position: step.position,
            });
        });

        candidates.forEach((candidate) => {
            const item = filteredSteps.find(
                (item) => item.id.toString() === candidate.status._id.toString()
            );

            item.cardIds.push(candidate._id);
            item.count += 1;
            const otherJobs = duplicates.filter(
                (duplicate) => duplicate.email === candidate.email
            ).length;
            let currentUser;
            if (candidate.currentUser)
                currentUser = {
                    firstName: candidate.currentUser.firstName,
                    lastName: candidate.currentUser.lastName,
                    avatar: candidate.currentUser.avatar,
                    id: candidate.currentUser._id.toString(),
                };
            else currentUser = null;
            const comments = candidate.steps.reduce((totalComments, step) => {
                if (step.author && step.author !== '') {
                    return totalComments + 1;
                }
                return totalComments;
            }, 0);
            const tmpObject = {
                id: candidate._id,
                score: candidate.score,
                name: candidate.firstName + ' ' + candidate.lastName,
                email: candidate.email,
                applyDate: candidate.created,
                resume: candidate.resume,
                smartAnalysis: candidate.smartAnalysis ? 1 : null,
                job: candidate.job?.name || '',
                columnId: candidate.status._id,
                members: currentUser ? [currentUser] : [],
                memberIds: currentUser ? [currentUser.id] : [],
                attachments: [candidate.resume],
                checklists: [],
                comments: comments,
                otherJobs: otherJobs,
            };
            filteredCandidates.push(tmpObject);
        });
        const sortedCandidates = filteredCandidates.sort((a, b) => {
            if (a.email < b.email) return -1;
            if (a.email > b.email) return 1;
            return 0;
        });
        const sortedSteps = filteredSteps.sort(
            (a, b) => a.position - b.position
        );
        const finalCandidates = {
            columns: sortedSteps,
            cards: sortedCandidates,
        };
        if (Redis.isConnected()) {
            await Redis.set(cacheKey, JSON.stringify(finalCandidates), {
                EX: 120,
                NX: true,
            }); // cache for 60 seconds
        }
        return res.status(200).json(finalCandidates);
    } catch (e) {
        return res.status(500).send('Error: ' + e.message);
    }
};
const getNextQuestion = async (req, res) => {
    try {
        const Evaluation = req.Evaluation;
        const evaluationId = req.params.id;
        const evaluation = await Evaluation.findOne(
            { publicUrl: evaluationId },
            'answers packs locked'
        );
        if (!evaluation) return res.status(404).send('Evaluation not found');
        if (evaluation.locked) return res.status(200).send({ locked: true });
        let currentQuestion = null;

        if (evaluation.answers.length > 0) {
            const questionsAnswered = evaluation.answers.length;
            let questionIndex = 0;
            evaluation.packs.forEach((pack) => {
                pack.questions.forEach((question) => {
                    delete question.correctAnswer;
                    if (questionIndex === questionsAnswered)
                        currentQuestion = question;
                    questionIndex++;
                });
            });
        } else if (evaluation.packs.length === 0) {
            currentQuestion = null;
        } else {
            currentQuestion = evaluation.packs[0].questions[0];
        }
        return res.status(200).json(currentQuestion);
    } catch (e) {
        return res.status(500).send('Error: ' + e.message);
    }
};
const getScore = async (req, res) => {
    try {
        const Evaluation = req.Evaluation;
        const evaluationId = req.params.id;
        const evaluation = await Evaluation.findOne(
            { publicUrl: evaluationId },
            'answers packs score job'
        ).lean();

        if (!evaluation) {
            return res.status(404).send('Evaluation not found');
        }

        const { answers, packs, job } = evaluation;
        let { score = -1 } = evaluation;
        if (score === -1) {
            score = await calculateScore(
                evaluation.answers,
                evaluation.packs,
                evaluation._id,
                Evaluation
            );
            score = score.score;
        }
        const evaluations = await Evaluation.find(
            { job, score: { $gte: 0 } },
            'score -_id'
        ).lean();

        const allScores = evaluations.map(({ score }) => score);
        const numberOfCandidateAboveScore = allScores.filter(
            (s) => s > score
        ).length;
        const percentageBelow =
            allScores.length === 0
                ? 0
                : Math.round(
                      (1 - numberOfCandidateAboveScore / allScores.length) * 100
                  );

        const feedback = {};

        if (percentageBelow > 70) {
            feedback.type = 'P3';
            feedback.score = 100 - percentageBelow + 1;
        } else if (percentageBelow > 45) {
            feedback.type = 'P2';
            feedback.score = percentageBelow;
        } else {
            const numberOfQuestions = packs.reduce(
                (count, pack) => count + pack.questions.length,
                0
            );
            const questionsAnswered = answers.reduce(
                (count, { answers }) => count + (answers.length > 0 ? 1 : 0),
                0
            );
            const percentageAnswered =
                numberOfQuestions === 0
                    ? 0
                    : Math.round((questionsAnswered / numberOfQuestions) * 100);
            feedback.type = 'P1';
            feedback.score = percentageAnswered;
        }

        return res.status(200).json(feedback);
    } catch (e) {
        return res.status(500).send('Error: ' + e.message);
    }
};

module.exports = {
    getCandidates,
    getEvaluation,
    getEvaluations,
    getNextQuestion,
    getEvaluationForAdmin,
    getScore,
    calculateThreshold,
    findNumberOfQuestionsEvaluated,
    findNumberOfQuestionsToEvaluate,
    calculateScore,
    getEvaluationHistory,
};
