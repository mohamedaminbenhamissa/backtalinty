const crypto = require('crypto');
const path = require('path');

const saveScreenshot = async (req, res) => {
    try {
        const Evaluation = req.Evaluation;
        const screenshotInformation = req.body;
        let fileName = '';
        const allowedTypes = [
            'image/png',
            'image/jpeg',
            'image/gif',
            'image/bmp',
            'image/webp',
        ];
        console.log(req.files);
        if (!req.files || Object.keys(req.files).length === 0) {
            return res
                .status(400)
                .send({ data: 'Merci de joindre le visuel(image)' });
        }
        if (!allowedTypes.includes(req.files.screenshot.mimetype)) {
            return res
                .status(400)
                .send({ data: 'Merci de joindre le visuel(image) 2' });
        }

        let uploadedFile = req.files.screenshot;

        const fileNamePromise = new Promise((resolve, reject) => {
            crypto.randomBytes(16, (err, hash) => {
                if (err) return reject(err);

                const ext = path.extname(uploadedFile.name);
                fileName = `${hash.toString('hex')}${ext}`;

                uploadedFile.mv(`uploads/screenshots/${fileName}`, (err) => {
                    if (err) return reject(err);
                    resolve(fileName);
                });
            });
        });

        fileName = await fileNamePromise;
        console.log(fileName);
        return res.sendStatus(204);
    } catch (e) {
        return res.status(500).send('Error: ' + e.message);
    }
};
module.exports = { saveScreenshot };
