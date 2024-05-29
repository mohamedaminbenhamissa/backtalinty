const mongoose = require('mongoose');

const getEmail = async (req, res) => {
    try {
        const Email = req.Email;
        const { fields } = JSON.parse(req.query.payload);
        const emailId = req.params.id;
        const email = await Email.findOne({ _id: emailId }, fields);
        if (!email) return res.status(404).send('Email not found');
        return res.status(200).json(email);
    } catch (e) {
        return res.status(500).send('Error: ' + e.message);
    }
};
const getEmails = async (req, res) => {
    try {
        const Email = req.Email;
        const { params, fields } = req.query;
        const emails = await Email.find(params, fields).sort([['subject', 1]]);
        if (!emails) return res.status(404).send('Emails not found');

        return res.status(200).json(emails);
    } catch (e) {
        return res.status(500).send('Error: ' + e.message);
    }
};

module.exports = {
    getEmail,
    getEmails,
};
