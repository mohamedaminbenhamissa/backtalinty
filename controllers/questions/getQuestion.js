const getQuestion = async (req, res) => {
    try {
        const Question = req.Question;

        const fields = req.params.fields;
        const questionId = req.params.id;
        const question = await Question.findOne(
            { _id: questionId, active: true },
            fields
        );
        if (!question) return res.status(404).send('Question not found');

        return res.status(200).json(question);
    } catch (e) {
        return res.status(500).send('Error: ' + e.message);
    }
};
const getQuestions = async (req, res) => {
    try {
        const Question = req.Question;

        const { params, fields } = req.query;
        let questions;
        //We just change the fields we want to get in a format mongo can deal with it
        //EX INPUT const fields = ['name'];
        //EX OUTPUT const fieldsObject = {
        //     name: true,
        // };
        if (fields.includes('usedIn')) {
            const fieldsObject = fields.reduce(
                (a, v) => ({ ...a, [v]: true }),
                {}
            );
            delete fieldsObject.usedIn;
            questions = await Question.aggregate([
                {
                    $match: {
                        ...params,
                    },
                },
                {
                    $lookup: {
                        from: 'tests',
                        localField: '_id',
                        foreignField: 'questions',
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
        } else questions = await Question.find(params, fields);
        if (!questions) return res.status(404).send('Questions not found');

        return res.status(200).json(questions);
    } catch (e) {
        return res.status(500).send('Error: ' + e.message);
    }
};
const getQuestionsOfTest = async (req, res) => {
    try {
        const Test = req.Test;
        const fields = req.params.fields;
        const testId = req.params.id;
        const test = await Test.findOne({ _id: testId, active: true }).populate(
            { path: 'questions', select: fields }
        );
        const questions = test.questions;
        if (!questions) return res.status(404).send('Questions not found');

        return res.status(200).json(questions);
    } catch (e) {
        return res.status(500).send('Error: ' + e.message);
    }
};
const getQuestionsOfPack = async (req, res) => {
    try {
        const Pack = req.Pack;
        const fields = req.params.fields;
        const packId = req.params.id;
        const pack = await Pack.findOne({ _id: packId, active: true }).populate(
            { path: 'questions', select: fields }
        );
        const questions = pack.questions;
        if (!questions) return res.status(404).send('Questions not found');

        return res.status(200).json(questions);
    } catch (e) {
        return res.status(500).send('Error: ' + e.message);
    }
};
module.exports = {
    getQuestion,
    getQuestions,
    getQuestionsOfTest,
    getQuestionsOfPack,
};
