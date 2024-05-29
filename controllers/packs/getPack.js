const getPack = async (req, res) => {
    try {
        const Pack = req.Pack;
        const packId = req.params.id;
        const pack = await Pack.findOne({ _id: packId, active: true }, [
            '-_id',
        ]);
        if (!pack) return res.status(404).send('Pack not found');

        return res.status(200).json(pack);
    } catch (e) {
        return res.status(500).send('Error: ' + e.message);
    }
};
const getStatsOfPack = async (req, res) => {
    let timeDiff = 0;
    let candidates = 0;
    const hadFun = new Map([
        [1, 0],
        [2, 0],
        [3, 0],
        [4, 0],
        [5, 0],
    ]);
    const easy = new Map([
        [1, 0],
        [2, 0],
        [3, 0],
        [4, 0],
        [5, 0],
    ]);
    const job = new Map([
        [1, 0],
        [2, 0],
        [3, 0],
        [4, 0],
        [5, 0],
    ]);
    try {
        const Pack = req.Pack;
        const Evaluation = req.Evaluation;
        const Test = req.Test;

        const packId = req.params.id;
        const feedbacks = [];
        const pack = await Pack.findOne({ _id: packId, active: true }, [
            '-_id',
            'name',
        ]);
        const evaluations = await Evaluation.find(
            { 'packsStarted.id': packId },
            'packsStarted feedbacks packs answers'
        );
        const tests = await Test.countDocuments({ packs: packId });
        evaluations.forEach((evaluation) => {
            const index = evaluation.packsStarted.findIndex(
                (element) => element.id.toString() === packId.toString()
            );

            if (evaluation.feedbacks[index])
                feedbacks.push(evaluation.feedbacks[index]);
            evaluation.packsStarted.forEach((pack) => {
                if (pack.actualEndDate) {
                    let d1 = new Date(pack.actualEndDate);
                    let d2 = new Date(pack.startDate);
                    const diffMs = d1 - d2;
                    timeDiff += Math.round(
                        ((diffMs % 86400000) % 3600000) / 6000
                    );
                    candidates++;
                }
            });
        });
        feedbacks.forEach((feedback) => {
            if (feedback.hadFun)
                hadFun.set(feedback.hadFun, hadFun.get(feedback.hadFun) + 1);
            if (feedback.easy)
                easy.set(feedback.easy, easy.get(feedback.easy) + 1);
            if (feedback.job) job.set(feedback.job, job.get(feedback.job) + 1);
        });
        return res.status(200).json({
            name: pack.name,
            hadFun: [...hadFun],
            easy: [...easy],
            job: [...job],
            candidates: candidates,
            timeDiff: timeDiff,
            tests: tests,
        });
    } catch (e) {
        return res.status(500).send('Error: ' + e.message);
    }
};
const getPacks = async (req, res) => {
    try {
        const Pack = req.Pack;
        const { params, fields } = req.query;
        let packs;
        if (fields.includes('usedIn')) {
            const fieldsObject = fields.reduce(
                (a, v) => ({ ...a, [v]: true }),
                {}
            );
            delete fieldsObject.usedIn;
            packs = await Pack.aggregate([
                {
                    $match: {
                        ...params,
                    },
                },
                {
                    $lookup: {
                        from: 'tests',
                        localField: '_id',
                        foreignField: 'packs',
                        as: 'tests',
                    },
                },
                {
                    $project: {
                        usedIn: {
                            $size: '$tests',
                        },
                        ...fieldsObject,
                    },
                },
            ]);
        } else packs = await Pack.find(params, fields);
        if (!packs) return res.status(404).send('Packs not found');

        return res.status(200).json(packs);
    } catch (e) {
        return res.status(500).send('Error: ' + e.message);
    }
};

module.exports = { getPack, getPacks, getStatsOfPack };
