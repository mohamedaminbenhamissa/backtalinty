const patchProcess = async (req, res) => {
    try {
        const Process = req.Process;
        const processInformation = req.body.data;
        const promises = [];
        for (const element of processInformation) {
            promises.push(
                Process.updateOne(
                    { _id: element.id },
                    { position: element.position }
                )
            );
        }
        Promise.all(promises)
            .then(() => {
                return res.sendStatus(204);
            })
            .catch((e) => {
                return res.status(500).send('Error: ' + e.message);
            });
    } catch (e) {
        return res.status(500).send('Error: ' + e.message);
    }
};

module.exports = patchProcess;
