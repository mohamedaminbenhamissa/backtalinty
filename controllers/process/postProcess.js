const i18n = require('i18n');
const postProcess = async (req, res) => {
    try {
        const Process = req.Process;
        const processInformation = req.body;
        const process = await Process.create(processInformation);
        if (!process)
            return res
                .status(500)
                .send(i18n.__('An unknown problem has occurred, please try again later'));

        res.status(201).send(process);
    } catch (e) {
        return res.status(500).send('Error: ' + e.message);
    }
};

module.exports = postProcess;
