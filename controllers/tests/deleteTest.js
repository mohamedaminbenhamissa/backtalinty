const i18n = require('i18n');
const deleteTest = async (req, res) => {
    try {
        const Test = req.Test;
        const testId = req.params.id;

        const test = await Test.updateOne({ _id: testId }, { active: false });
        if (!test)
            return res
                .status(500)
                .send(i18n.__('An unknown problem has occurred, please try again later'));

        res.sendStatus(204);
    } catch (e) {
        return res.status(500).send('Error: ' + e.message);
    }
};

module.exports = deleteTest;
