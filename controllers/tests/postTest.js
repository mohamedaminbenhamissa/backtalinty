const i18n = require('i18n');
const postTest = async (req, res) => {
    try {
        const Test = req.Test;
        const testInformation = req.body;
        const test = await Test.create(testInformation);
        if (!test)
            return res
                .status(500)
                .send(i18n.__('An unknown problem has occurred, please try again later'));

        return res.status(201).send('Created');
    } catch (e) {
        return res.status(500).send('Error: ' + e.message);
    }
};
const duplicateTest = async (req, res) => {
    try {
        const Test = req.Test;
        const testId = req.params.id;
        const testInformation = req.body;

        testInformation.parent = testId;
        const duplicatedTest = await Test.create(testInformation);
        if (!duplicatedTest)
            return res
                .status(500)
                .send(i18n.__('An unknown problem has occurred, please try again later'));

        return res.status(201).send('Created');
    } catch (e) {
        return res.status(500).send('Error: ' + e.message);
    }
};
module.exports = { postTest, duplicateTest };
