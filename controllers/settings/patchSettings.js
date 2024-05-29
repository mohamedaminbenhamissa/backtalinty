const i18n = require('i18n');

const patchSettings = async (req, res) => {
    try {
        const Settings = req.Settings;
        const settingsInformation = req.body;

        const settings = await Settings.updateOne({}, settingsInformation);
        if (!settings)
            return res
                .status(500)
                .send(
                    i18n.__('An unknown problem has occurred, please try again later')
                );

        res.status(200).send(settings);
    } catch (e) {
        return res.status(500).send(i18n.__('Error: ' + e.message));
    }
};

module.exports = patchSettings;
