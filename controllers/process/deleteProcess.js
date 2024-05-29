const i18n = require('i18n');
const deleteProcess = async (req, res) => {
    try {
        const Process = req.Process;
        const processId = req.params.id;
        const process = await Process.findOneAndUpdate(
            { _id: processId },
            { active: false }
        );
        if (!process)
            return res
                .status(500)
                .send(i18n.__('An unknown problem has occurred, please try again later'));

        res.status(204).send();
    } catch (e) {
        return res.status(500).send('Error: ' + e.message);
    }
};

module.exports = deleteProcess;
