const mongoose = require('mongoose');

const mergeCandidate = async (req, res) => {
    try {
        const { Candidate } = req;
        const candidateId = req.params.id;
        const { payload } = req.body;
        const { duplicateIds, ...valuesToKeep } = payload;

        const candidate = await Candidate.findById(candidateId);
        if (!candidate) {
            return res.status(404).send('Candidate not found');
        }

        await Candidate.findByIdAndUpdate(
            candidateId,
            {
                ...valuesToKeep,
                duplicate: candidate.duplicate.filter(
                    (id) => !duplicateIds.includes(id.toString())
                ),
            },
            { new: true }
        );

        await Candidate.deleteMany({
            _id: { $in: duplicateIds.map((id) => mongoose.Types.ObjectId(id)) },
        });

        return res.sendStatus(204);
    } catch (e) {
        return res.status(500).send('Error: ' + e.message);
    }
};
const notDuplicate = async (req, res) => {
    try {
        const { Candidate } = req;
        const candidateId = req.params.id;
        const { payload } = req.body;

        await Candidate.updateMany(
            { _id: { $in: payload } },
            { $pull: { duplicate: candidateId } }
        );

        await Candidate.updateOne(
            { _id: candidateId },
            { $pull: { duplicate: { $in: payload } } }
        );

        return res.sendStatus(204);
    } catch (e) {
        return res.status(500).send('Error: ' + e.message);
    }
};

module.exports = { mergeCandidate, notDuplicate };
