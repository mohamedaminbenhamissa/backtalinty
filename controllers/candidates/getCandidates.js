const mongoose = require('mongoose');

const getListCandidates = async (req, res) => {
    try {
        const Candidate = req.Candidate;
        const userId = mongoose.Types.ObjectId(req.user.userId);
        const result = await Candidate.aggregate([
            {
                $lookup: {
                    from: 'evaluations',
                    localField: 'evaluations',
                    foreignField: '_id',
                    as: 'evaluations',
                },
            },
            {
                $unwind: '$evaluations',
            },
            {
                $lookup: {
                    from: 'jobs',
                    localField: 'evaluations.job',
                    foreignField: '_id',
                    as: 'evaluations.job',
                },
            },
            {
                $unwind: '$evaluations.job',
            },
            {
                $match: {
                    $or: [
                        { 'evaluations.job.users': { $in: [userId] } },
                        { currentUser: userId },
                    ],
                },
            },
            {
                $group: {
                    _id: '$_id',
                    firstName: { $first: '$firstName' },
                    lastName: { $first: '$lastName' },
                    emails: { $first: '$emails' },
                    duplicate: { $first: '$duplicate' },
                    jobs: { $push: '$evaluations.job.name' },
                },
            },
            {
                $project: {
                    _id: 0,
                    id: '$_id',
                    firstName: 1,
                    lastName: 1,
                    emails: 1,
                    duplicate: 1,
                    jobs: 1,
                },
            },
        ]);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).send('Error: ' + error.message);
    }
};
module.exports = getListCandidates;
