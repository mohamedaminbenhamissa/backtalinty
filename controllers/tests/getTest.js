const getTest = async (req, res) => {
    try {
        const Test = req.Test;
        const testId = req.params.id;
        const test = await Test.findOne({ _id: testId, active: true }, [
            '-_id',
        ]);
        if (!test) return res.status(404).send('Test not found');

        return res.status(200).json(test);
    } catch (e) {
        return res.status(500).send('Error: ' + e.message);
    }
};
const getTests = async (req, res) => {
    try {
        const Test = req.Test;
        const { params, fields } = req.query;
        let tests;
        //TODO this is used like 3-4 times in other files so maybe refactor it in utils.js
        if (fields.includes('usedIn')) {
            const fieldsObject = fields.reduce(
                (a, v) => ({ ...a, [v]: true }),
                {}
            );
            delete fieldsObject.usedIn;
            tests = await Test.aggregate([
                {
                    $match: {
                        ...params,
                    },
                },
                {
                    $lookup: {
                        from: 'jobs',
                        localField: '_id',
                        foreignField: 'test',
                        as: 'jobs',
                    },
                },
                {
                    $project: {
                        usedIn: {
                            $size: '$jobs',
                        },
                        ...fieldsObject,
                    },
                },
            ]);
        } else tests = await Test.find(params, fields);

        if (!tests) return res.status(404).send('Tests not found');

        return res.status(200).json(tests);
    } catch (e) {
        return res.status(500).send('Error: ' + e.message);
    }
};
module.exports = { getTest, getTests };
