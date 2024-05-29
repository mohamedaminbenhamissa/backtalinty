const mongoose = require('mongoose');

const getJob = async (req, res) => {
    try {
        const Job = req.Job;
        const fields = req.params.fields;
        const jobId = req.params.id;
        let job;

        //Find it by id or slug
        if (mongoose.Types.ObjectId.isValid(jobId)) {
            job = await Job.findOne({ _id: jobId }, fields).populate({
                path: 'test',
                select: 'name',
            });
        } else {
            job = await Job.findOne({ slug: jobId }, fields).populate({
                path: 'test',
                select: 'name',
            });
        }
        if (!job) return res.status(404).send('Job not found');

        return res.status(200).json(job);
    } catch (e) {
        return res.status(500).send('Error: ' + e.message);
    }
};
const getJobStats = async (req, res) => {
    try {
        let jobId = req.params.id;
        const year = parseInt(req.query.year);
        const Evaluation = req.Evaluation;
        const Job = req.Job;
        const count = {};
        const avgScore = {};
        const sumAnswers = {};
        let evaluations;
        let etatDesCandidatures;
        let jobInfo;
        if (jobId === 'null') jobId = null;
        if (jobId)
            jobInfo = await Job.findOne(
                { _id: mongoose.Types.ObjectId(jobId) },
                'name created -_id'
            ).populate({
                path: 'test',
                select: 'name -_id',
                populate: { path: 'packs', select: 'name -_id' },
            });
        else jobInfo = {};

        const averageTime = await Evaluation.aggregate([
            {
                $match: jobId
                    ? {
                          job: mongoose.Types.ObjectId(jobId),
                          startDate: { $exists: true, $ne: null },
                          locked: { $exists: true, $ne: null },
                      }
                    : {
                          startDate: { $exists: true, $ne: null },
                          locked: { $exists: true, $ne: null },
                      },
            },
            {
                $group: {
                    _id: null,
                    totalMinutes: {
                        $sum: {
                            $divide: [
                                { $subtract: ['$locked', '$startDate'] },
                                60000,
                            ],
                        },
                    },
                    count: { $sum: 1 },
                },
            },
            {
                $project: {
                    averageMinutes: { $divide: ['$totalMinutes', '$count'] },
                },
            },
        ]);
        if (year) {
            etatDesCandidatures = await Evaluation.aggregate([
                {
                    $match: jobId
                        ? {
                              job: mongoose.Types.ObjectId(jobId),
                              created: {
                                  $gte: new Date(`${year}-01-01T00:00:00.000Z`),
                                  $lt: new Date(
                                      `${year + 1}-01-01T00:00:00.000Z`
                                  ),
                              },
                          }
                        : {
                              created: {
                                  $gte: new Date(`${year}-01-01T00:00:00.000Z`),
                                  $lt: new Date(
                                      `${year + 1}-01-01T00:00:00.000Z`
                                  ),
                              },
                          },
                },
                {
                    $lookup: {
                        from: 'processes',
                        localField: 'status',
                        foreignField: '_id',
                        as: 'process',
                    },
                },
                {
                    $unwind: '$process',
                },
                {
                    $group: {
                        _id: '$status',
                        status: { $first: '$process.name' },
                        count: { $sum: 1 },
                    },
                },
            ]);
            evaluations = await Evaluation.aggregate([
                {
                    $match: jobId
                        ? {
                              job: mongoose.Types.ObjectId(jobId),
                              created: {
                                  $gte: new Date(`${year}-01-01T00:00:00.000Z`),
                                  $lt: new Date(
                                      `${year + 1}-01-01T00:00:00.000Z`
                                  ),
                              },
                          }
                        : {
                              created: {
                                  $gte: new Date(`${year}-01-01T00:00:00.000Z`),
                                  $lt: new Date(
                                      `${year + 1}-01-01T00:00:00.000Z`
                                  ),
                              },
                          },
                },
                {
                    $group: {
                        _id: {
                            month: { $month: '$created' },
                            year: { $year: '$created' },
                        },
                        count: { $sum: 1 },
                        avgScore: { $avg: '$score' },
                        sumAnswers: {
                            $sum: {
                                $cond: [
                                    { $gt: [{ $size: '$answers' }, 0] },
                                    1,
                                    0,
                                ],
                            },
                        },
                    },
                },
            ]);
        } else {
            etatDesCandidatures = await Evaluation.aggregate([
                {
                    $match: jobId
                        ? {
                              job: mongoose.Types.ObjectId(jobId),
                          }
                        : {},
                },
                {
                    $lookup: {
                        from: 'processes',
                        localField: 'status',
                        foreignField: '_id',
                        as: 'process',
                    },
                },
                {
                    $unwind: '$process',
                },
                {
                    $group: {
                        _id: '$status',
                        status: { $first: '$process.name' },
                        count: { $sum: 1 },
                    },
                },
            ]);
            evaluations = await Evaluation.aggregate([
                {
                    $match: jobId
                        ? {
                              job: mongoose.Types.ObjectId(jobId),
                          }
                        : {},
                },
                {
                    $group: {
                        _id: {
                            month: { $month: '$created' },
                            year: { $year: '$created' },
                        },
                        count: { $sum: 1 },
                        avgScore: { $avg: '$score' },
                        sumAnswers: {
                            $sum: {
                                $cond: [
                                    { $gt: [{ $size: '$answers' }, 0] },
                                    1,
                                    0,
                                ],
                            },
                        },
                    },
                },
                { $sort: { '_id.month': -1 } },
            ]);
        }
        if (!evaluations) return res.status(404).send('No data');
        for (let i = 1; i <= 12; i++) {
            count[i] = 0;
            avgScore[i] = 0;
            sumAnswers[i] = 0;
        }
        const currentDate = new Date();
        const monthNumber = currentDate.getMonth() + 1;
        const yearNumber = currentDate.getFullYear();

        let numberOfCandidates = 0;
        let numberOfCandidatesThisMonth = 0;

        evaluations.forEach((evaluation) => {
            count[evaluation._id.month] = evaluation.count;
            sumAnswers[evaluation._id.month] = evaluation.sumAnswers;
            avgScore[evaluation._id.month] = Math.round(evaluation.avgScore);

            numberOfCandidates += evaluation.count;
            if (
                evaluation._id.month === monthNumber &&
                evaluation._id.year === yearNumber
            )
                numberOfCandidatesThisMonth += evaluation.count;
        });
        const etatDesCandidaturesCategory = [];
        const etatDesCandidaturesCount = [];

        etatDesCandidatures.forEach((candidature) => {
            etatDesCandidaturesCategory.push(candidature.status);
            etatDesCandidaturesCount.push(candidature.count);
        });

        return res.status(200).json({
            count: Object.values(count),
            avgScore: Object.values(avgScore),
            sumAnswers: Object.values(sumAnswers),
            etatDesCandidaturesCategory: etatDesCandidaturesCategory,
            etatDesCandidaturesCount: etatDesCandidaturesCount,
            averageTime: Math.round(averageTime[0]?.averageMinutes || 0),
            numberOfCandidates: numberOfCandidates,
            numberOfCandidatesThisMonth: numberOfCandidatesThisMonth,
            jobInfo: jobInfo,
        });
    } catch (e) {
        return res.status(500).send('Error: ' + e.message);
    }
};
const getJobsForAdmin = async (req, res) => {
    try {
        const Job = req.Job;
        const databaseInfo = req.DatabaseInfo;
        let { params, fields } = req.query;
        const userId = mongoose.Types.ObjectId(req.user.userId);
        params = { ...params, ...{ users: { $in: [userId] } } };

        const jobTypes = new Set();
        const remoteTypes = new Set();

        const fieldsObject = fields.reduce((a, v) => ({ ...a, [v]: true }), {});
        const jobs = await Job.aggregate([
            {
                $match: {
                    ...params,
                },
            },
            {
                $lookup: {
                    from: 'tests',
                    localField: 'test',
                    foreignField: '_id',
                    as: 'test',
                },
            },
            {
                $lookup: {
                    from: 'evaluations',
                    let: { job_id: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [{ $eq: ['$job', '$$job_id'] }],
                                },
                            },
                        },
                    ],
                    as: 'evaluations',
                },
            },
            {
                $project: {
                    ...fieldsObject,
                    testName: { $arrayElemAt: ['$test.name', 0] },
                    evaluations: { $size: '$evaluations' },
                    publicLink: {
                        $concat: [`${databaseInfo.frontendURI}job/`, '$slug'],
                    },
                },
            },
            {
                $sort: { created: -1 },
            },
        ]);

        if (!jobs) return res.status(404).send('Jobs not found');

        jobs.map((job) => {
            jobTypes.add(job.type);
            remoteTypes.add(job.remote);
        });

        return res.status(200).json({
            jobs: jobs,
            jobTypes: Array.from(jobTypes),
            remoteTypes: Array.from(remoteTypes),
        });
    } catch (e) {
        return res.status(500).send('Error: ' + e.message);
    }
};

const getJobs = async (req, res) => {
    try {
        const Job = req.Job;
        const { params, fields } = req.query;
        const jobTypes = new Set();
        const remoteTypes = new Set();
        let jobs;
        jobs = await Job.find(params, fields).sort([['created', -1]]);
        if (!jobs) return res.status(404).send('Jobs not found');
        jobs.map((job) => {
            jobTypes.add(job.type);
            remoteTypes.add(job.remote);
        });
       
        return res.status(200).json({
            jobs: jobs,
            jobTypes: Array.from(jobTypes),
            remoteTypes: Array.from(remoteTypes),
     
        });
    } catch (e) {
        return res.status(500).send('Error: ' + e.message);
    }
};

module.exports = {
    getJob,
    getJobsForAdmin,
    getJobs,
    getJobStats,
};
