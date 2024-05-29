const crypto = require('crypto');
const path = require('path');
const i18n = require('i18n');
const putSettings = async (req, res) => {
    try {
        const Settings = req.Settings;
        let settings = {};
        const settingsInformation = req.body;
        let fileName = '';
        const allowedTypes = [
            'image/png',
            'image/jpeg',
            'image/gif',
            'image/bmp',
            'image/webp',
        ];
        if (req.files && Object.keys(req.files).length > 0) {
            if (!allowedTypes.includes(req.files.logo.mimetype)) {
                return res
                    .status(400)
                    .send({ data: 'Merci de joindre le logo(image)' });
            }
            let uploadedFile = req.files.logo;
            const fileNamePromise = new Promise((resolve, reject) => {
                crypto.randomBytes(16, (err, hash) => {
                    if (err) return reject(err);

                    const ext = path.extname(uploadedFile.name);
                    fileName = `${hash.toString('hex')}${ext}`;

                    uploadedFile.mv(`uploads/logo/${fileName}`, (err) => {
                        if (err) return reject(err);
                        resolve(fileName);
                    });
                });
            });
            fileName = await fileNamePromise;
            settingsInformation.logo =
                req.protocol +
                '://' +
                req.headers.host +
                '/uploads/logo/' +
                fileName;
        }
        const currentSettings = await Settings.find({});
        if (currentSettings.length > 0)
            settings = await Settings.findOneAndUpdate({}, settingsInformation)
                .select('-__v -_id -redactedContent')
                .lean();
        else settings = await Settings.create(settingsInformation);
        if (!settings)
            return res
                .status(500)
                .send(i18n.__('An unknown problem has occurred, please try again later'));

        res.status(200).send(settings);
    } catch (e) {
        return res.status(500).send('Error: ' + e.message);
    }
};

module.exports = putSettings;
