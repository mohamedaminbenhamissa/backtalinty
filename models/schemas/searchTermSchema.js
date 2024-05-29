const mongoose = require('mongoose');

const SearchTermSchema = mongoose.Schema({
    softSkillName: {
        type: [String],
        required: true,
    },
    hardSkillName: {
        type: [String],
        required: true,
    },
});
const SearchTermModel = mongoose.model('searchTerm', SearchTermSchema);
module.exports = SearchTermSchema;
