const getSettings = async (req, res) => {
    try {
        const Settings = req.Settings;
        const settings = await Settings.findOne();
        if (!settings) return res.status(404).send('Settings not found');

        return res.status(200).json(settings);
    } catch (e) {
        return res.status(500).send('Error: ' + e.message);
    }
};
module.exports = getSettings;
