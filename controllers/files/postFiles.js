const crypto = require('crypto');
const path = require('path');
const generateDateString = require('../../utils/utils');
const postImage = async (req, res) => {
    try {
        const allowedTypes = [
            'image/png',
            'image/jpeg',
            'image/gif',
            'image/bmp',
            'image/webp',
        ];

        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).send('Merci de joindre un fichier.');
        }
        if (!allowedTypes.includes(req.files.file.mimetype)) {
            return res.status(400).send('Merci de joindre une fichier.');
        }

        let uploadedFile = req.files.file;

        crypto.randomBytes(32, (err, hash) => {
            if (err) return res.status(500).send(err);

            const ext = path.extname(uploadedFile.name);
            const date = generateDateString.generateDateString();
            const fileName = `${date}_${hash.toString('hex')}${ext}`;
            uploadedFile.mv(`uploads/images/${fileName}`, (err) => {
                if (err) return res.status(500).send(err);
            });

            const responsePath =
                req.protocol +
                '://' +
                req.get('Host') +
                '/uploads/images/' +
                fileName;
            return res.status(200).send(responsePath);
        });
        return res.status(500);
    } catch (e) {
        return res.status(500).send('Error: ' + e.message);
    }
};
module.exports = { postImage };
