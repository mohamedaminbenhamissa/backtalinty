const getProcess = async (req, res) => {
    try {
        const Process = req.Process;
        const fields = req.params.fields;
        const processId = req.params.id;
        const process = await Process.findOne(
            { _id: processId, active: true },
            fields
        );
        if (!process) return res.status(404).send('Process not found');

        return res.status(200).json(process);
    } catch (e) {
        return res.status(500).send('Error: ' + e.message);
    }
};
const getProcesses = async (req, res) => {
    try {
        const Process = req.Process;
        const { params, fields } = req.query;
        const processes = await Process.find(params, fields, {
            sort: { position: 1 },
        });
        if (!processes) return res.status(404).send('Processes not found');

        return res.status(200).json(processes);
    } catch (e) {
        return res.status(500).send('Error: ' + e.message);
    }
};

module.exports = {
    getProcess,
    getProcesses,
};
