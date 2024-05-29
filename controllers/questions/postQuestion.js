const Question = require('../../models/schemas/questionSchema');
const i18n = require('i18n');

const postQuestion = async (req, res) => {
    try {
        const Question = req.Question;
        const questionInformation = req.body;

        const question = await Question.create(questionInformation);
        if (!question)
            return res
                .status(500)
                .send(i18n.__('An unknown problem has occurred, please try again later'));

        res.status(201).send('Created');
    } catch (e) {
        return res.status(500).send('Error: ' + e.message);
    }
};

module.exports = postQuestion;
