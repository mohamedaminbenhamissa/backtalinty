const i18n = require('i18n');
const deleteQuestion = async (req, res) => {
    try {
        const Question = req.Question;
        const questionId = req.params.id;

        const question = await Question.findOneAndUpdate(
            { _id: questionId },
            { active: false }
        );
        if (!question)
            return res
                .status(500)
                .send(i18n.__('An unknown problem has occurred, please try again later'));

        res.status(204).send();
    } catch (e) {
        return res.status(500).send('Error: ' + e.message);
    }
};

module.exports = deleteQuestion;
