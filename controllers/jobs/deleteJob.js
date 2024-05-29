const i18n = require('i18n');
const deleteJob = async (req, res) => {
    try {
        const Job = req.Job;
        const jobId = req.params.id;
        const job = await Job.findOneAndUpdate(
            { _id: jobId },
            { active: false }
        );
        if (!job)
            return res
                .status(500)
                .send(i18n.__('An unknown problem has occurred, please try again later'));

        res.status(204).send();
    } catch (e) {
        return res.status(500).send('Error: ' + e.message);
    }
};

module.exports = deleteJob;
