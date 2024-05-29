const Question = require('../../models/schemas/questionSchema');
const i18n = require('i18n');

const patchQuestion = async (req, res) => {
    try {
        const Question = req.Question;
        const questionInformation = req.body;
        const questionId = req.params.id;
        const question = await Question.updateOne(
            { _id: questionId },
            questionInformation
        );
        if (!question)
            return res
                .status(500)
                .send(i18n.__('An unknown problem has occurred, please try again later'));

        return res.sendStatus(204);
    } catch (e) {
        return res.status(500).send('Error: ' + e.message);
    }
};

module.exports = patchQuestion;
