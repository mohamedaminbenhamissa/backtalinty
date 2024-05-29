const Candidate = require('../../models/schemas/candidateSchema');
// calculates the similarity score between two candidate objects.
function similarityScore(obj1, obj2) {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    const m = keys1.length;
    const n = keys2.length;
    const d = [];

    for (let i = 0; i <= m; i++) {
        d[i] = [i];
    }

    for (let j = 0; j <= n; j++) {
        d[0][j] = j;
    }

    for (let j = 1; j <= n; j++) {
        for (let i = 1; i <= m; i++) {
            if (
                keys1[i - 1] === keys2[j - 1] &&
                obj1[keys1[i - 1]] === obj2[keys2[j - 1]]
            ) {
                d[i][j] = d[i - 1][j - 1];
            } else {
                d[i][j] = Math.min(
                    d[i - 1][j] + 1,
                    d[i][j - 1] + 1,
                    d[i - 1][j - 1] + 1
                );
            }
        }
    }
    const maxDistance = Math.max(m, n);
    const distance = d[m][n];
    const similarity = ((maxDistance - distance) / maxDistance) * 100;
    return similarity.toFixed(2);
}
// flattens nested objects into a single-level object.
function flattenObject(obj) {
    const flattened = {};

    function recurse(currentObj, currentKey) {
        for (let key in currentObj) {
            const value = currentObj[key];
            const newKey = currentKey ? `${currentKey}.${key}` : key;
            if (typeof value === 'object' && value !== null) {
                recurse(value, newKey);
            } else {
                flattened[newKey] = value;
            }
        }
    }
    recurse(obj);

    return flattened;
}
// find a candidate's duplicates than update duplicate fi3eld in the candidate documents by adding duplicates IDs for all candidates found to be duplicates.
async function findDuplicates(candidateId) {
    try {
        const selectFields =
            '_id firstName lastName phoneNumbers dateOfBirth email';

        const filteredCandidates = await Candidate.find(
            { _id: { $ne: candidateId } },
            selectFields
        ).lean();

        const candidate = await Candidate.findOne(
            { _id: candidateId },
            selectFields
        ).lean();
        const promises = [];
        for (let i = 0; i < filteredCandidates.length; i++) {
            const candidate1 = flattenObject(filteredCandidates[i]);
            const candidate2 = flattenObject(candidate);
            const score = similarityScore(candidate1, candidate2);
            if (score >= 80) {
                const duplicateCandidateId = candidate2._id;
                const promise1 = Candidate.findByIdAndUpdate(
                    candidate1[i]._id,
                    {
                        $push: { duplicate: duplicateCandidateId },
                    },
                    { new: true }
                );
                const promise2 = Candidate.findByIdAndUpdate(
                    duplicateCandidateId,
                    {
                        $push: { duplicate: candidate1[i]._id },
                    },
                    { new: true }
                );
                promises.push(promise1, promise2);
            }
        }
        await Promise.all(promises);
    } catch (error) {
        console.log('Error: ' + error.message);
    }
}

module.exports = { findDuplicates, flattenObject, similarityScore };
