const getCustomFields = async (req, res) => {
    try {
        const CustomFields = req.CustomFields;
        const { params, fields } = req.query;
        const customFields = await CustomFields.find(params, fields);
        if (!customFields)
            return res.status(404).send('CustomFields not found');

        return res.status(200).json(customFields);
    } catch (e) {
        return res.status(500).send('Error: ' + e.message);
    }
};

module.exports = {
    getCustomFields,
};
