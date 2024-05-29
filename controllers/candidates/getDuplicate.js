const selectFields =
    '_id firstName lastName phoneNumbers dateOfBirth email duplicate';

const getDuplicate = async (req, res) => {
    try {
        const { Candidate } = req;
        const candidateId = req.params.id;
        const candidate = await Candidate.findById(candidateId)
            .select(selectFields + ' id')
            .lean()
            .exec();
        if (!candidate) {
            return res.status(404).json('Candidate not found');
        }
        const duplicateIds = candidate.duplicate;

        const duplicates = await Candidate.find({ _id: { $in: duplicateIds } })
            .select(selectFields + ' id')
            .lean()
            .exec();

        // Map _id to id in the results array
        const results = [candidate, ...duplicates].map((result) => {
            return {
                ...result,
                id: result._id,
                // Remove the _id field from the result
                _id: undefined,
            };
        });

        return res.status(200).json(results);
    } catch (error) {
        return res.status(500).send('Error: ' + error.message);
    }
};

module.exports = getDuplicate;
