const mongoose = require('mongoose');

const CustomFieldsSchema = mongoose.Schema({
    label: { type: String, required: true, unique: true },
});

const CustomFieldsModel = mongoose.model('customFields', CustomFieldsSchema);
module.exports = CustomFieldsSchema;
