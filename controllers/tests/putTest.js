const i18n = require('i18n');
const putTest = async (req, res) => {
    try {
        const Test = req.Test;
        const testInformation = req.body;
        const testId = req.params.id;

        const test = await Test.findOneAndUpdate(
            { _id: testId },
            testInformation
        );
        if (!test)
            return res
                .status(500)
                .send(i18n.__('An unknown problem has occurred, please try again later'));

        res.status(204).send();
    } catch (e) {
        return res.status(500).send('Error: ' + e.message);
    }
};

module.exports = putTest;
