const getKanbanColumns = async (req, res) => {
    try {
        const Candidate = req.Candidate;
        const SearchTerm = req.SearchTerm;
        const columns = await Candidate.aggregate([
            {
                $lookup: {
                    from: 'evaluations',
                    localField: 'evaluations',
                    foreignField: '_id',
                    as: 'evaluationsData',
                },
            },
            {
                $unwind: '$evaluationsData',
            },
            {
                $lookup: {
                    from: 'jobs',
                    localField: 'evaluationsData.job',
                    foreignField: '_id',
                    as: 'jobData',
                },
            },
            {
                $unwind: '$jobData',
            },
            {
                $lookup: {
                    from: 'processes',
                    localField: 'evaluationsData.status',
                    foreignField: '_id',
                    as: 'statusData',
                },
            },
            {
                $unwind: '$statusData',
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'evaluationsData.currentUser',
                    foreignField: '_id',
                    as: 'userData',
                },
            },
            {
                $unwind: '$userData',
            },
            {
                $group: {
                    _id: '$statusData.name',
                    processId: { $first: '$statusData._id' },
                    items: {
                        $push: {
                            id: '$evaluationsData._id',
                            candidateId: '$_id',
                            firstName: '$firstName',
                            lastName: '$lastName',
                            score: '$evaluationsData.score',
                            applyDate: '$evaluationsData.created',
                            job: '$jobData.name',
                            resume: '$evaluationsData.resume',
                            userAvatar: '$userData.avatar',
                            user: {
                                $concat: [
                                    '$userData.firstName',
                                    ' ',
                                    '$userData.lastName',
                                ],
                            },
                            /*comments: {
                                $sum: {
                                    $size: '$evaluationsData.steps.author',
                                },
                            },*/
                            skills: {
                                $concatArrays: ['$hardSkills', '$softSkills'],
                            },
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: 'processes',
                    localField: '_id',
                    foreignField: 'name',
                    as: 'processData',
                },
            },
            {
                $unwind: '$processData',
            },
            {
                $sort: {
                    'processData.position': 1, // Assuming 1 is for ascending order
                },
            },
            {
                $project: {
                    process: '$_id',
                    processId: 1,
                    items: 1,
                    job: 1,
                    user: 1,
                },
            },
        ]);

        console.log(columns);
        if (!columns || columns.length === 0)
            return res.status(404).send('columns not found');

        const jobsList = Array.from(
            new Set(columns.map((item) => item.items.map((e) => e.job)).flat())
        );
        const users = Array.from(
            new Set(columns.map((item) => item.items.map((e) => e.user)).flat())
        );

        const searchTerms = await SearchTerm.findOne();
        const response = {
            columns,
            jobsList,
            users,
            searchTerms: [
                {
                    category: 'Soft Skills',
                    skills: searchTerms.softSkillName.sort(),
                },
                {
                    category: 'Hard Skills',
                    skills: searchTerms.hardSkillName.sort(),
                },
            ],
        };

        return res.status(200).json(response);
    } catch (e) {
        return res.status(500).send('Error: ' + e.message);
    }
};

module.exports = getKanbanColumns;
