const i18n = require('i18n');
const deleteEmail = async (req, res) => {
    try {
        const Email = req.Email;
        const emailId = req.params.id;
        const email = await Email.findOneAndUpdate(
            { _id: emailId },
            { active: false }
        );
        if (!email)
            return res
                .status(500)
                .send(i18n.__('An unknown problem has occurred, please try again later'));

        res.status(204).send();
    } catch (e) {
        return res.status(500).send('Error: ' + e.message);
    }
};

module.exports = deleteEmail;
