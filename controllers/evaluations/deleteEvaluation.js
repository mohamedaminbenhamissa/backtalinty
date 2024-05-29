const i18n = require('i18n');
const deleteEvaluation = async (req, res) => {
    try {
        const Evaluation = req.Evaluation;
        const evaluationId = req.params.id;

        const evaluation = await Evaluation.findOneAndUpdate(
            { _id: evaluationId },
            { active: false }
        );
        if (!evaluation)
            return res
                .status(500)
                .send(i18n.__('An unknown problem has occurred, please try again later'));

        res.status(204).send();
    } catch (e) {
        return res.status(500).send('Error: ' + e.message);
    }
};

module.exports = { deleteEvaluation };
