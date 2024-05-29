const Joi = require('joi');
const JoiOID = require('joi-oid');
const {
    generateSmartAnalysis,
    parseResume,
    addCustomField,
} = require('./candidates/putCandidate');
const getListCandidates = require('./candidates/getCandidates');
const getDuplicate = require('./candidates/getDuplicate');
const { mergeCandidate, notDuplicate } = require('./candidates/patchCandidate');
const { parseErrors } = require('../utils/parseJoiErrors');
const getKanbanColumns = require('./candidates/getKanbanColumns'); /* kanban must be change it to the main repo*/

const getCandidateValidator = Joi.object({
    id: JoiOID.objectId().required(),
}).error((errors) => {
    return parseErrors(errors);
});
const getCandidatesValidator = Joi.object({
    params: Joi.object(),
    fields: Joi.array()
        .items(Joi.string())
        .unique((a, b) => a === b),
}).error((errors) => {
    return parseErrors(errors);
});
exports.controllers = {
    getCandidateValidator,
    getCandidatesValidator,
    generateSmartAnalysis,
    parseResume,
    addCustomField,
    getListCandidates,
    getDuplicate,
    mergeCandidate,
    notDuplicate,
    getKanbanColumns,
};
