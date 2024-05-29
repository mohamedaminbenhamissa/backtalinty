const crypto = require('crypto');
const path = require('path');

const postVideo = async (req, res) => {
    try {
        const allowedTypes = ['video/mp4', 'video/ogg'];
        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).send('Merci de joindre une vidéo.');
        }

        if (!allowedTypes.includes(req.files.video.mimetype)) {
            return res.status(400).send('Merci de joindre une vidéo.');
        }

        let uploadedFile = req.files.video;

        crypto.randomBytes(16, (err, hash) => {
            if (err) return res.status(500).send(err);

            const ext = path.extname(uploadedFile.name);
            const fileName = `${hash.toString('hex')}${ext}`;

            uploadedFile.mv(`uploads/${fileName}`, (err) => {
                if (err) return res.status(500).send(err);
            });
            const responsePath =
                req.protocol + '://' + req.get('Host') + '/uploads/' + fileName;

            return res.status(200).send(responsePath);
        });
        return res.status(500);
    } catch (e) {
        return res.status(500).send('Error: ' + e.message);
    }
};
module.exports = { postVideo };
