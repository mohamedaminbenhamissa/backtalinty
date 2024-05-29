const crypto = require('crypto');
const path = require('path');
const i18n = require('i18n');
const nodeHtmlToImage = require('node-html-to-image');
const patchEmail = async (req, res) => {
    try {
        const Email = req.Email;
        const emailInformation = req.body;
        const emailId = req.params.id;
        if(emailInformation.design === 'undefined'){
            return res
                .status(400)
                .send({ data:i18n.__('No changes has been made.') });
        }
        emailInformation.design = JSON.parse(emailInformation.design);
        let fileNames = [];
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        if (req.files && Object.keys(req.files).length > 0) {
            const uploadedFiles = Array.isArray(req.files.attachments)
                ? req.files.attachments
                : [req.files.attachments];
            for (let i = 0; i < uploadedFiles.length; i++) {
                const file = uploadedFiles[i];

                if (!allowedTypes.includes(file.mimetype)) {
                    return res.status(400).send({
                        data:
                            i18n.__('Please join the file') +
                            file.name +' '+
                            i18n.__('in word or pdf format'),
                    });
                }
                const fileNamesPromise = new Promise((resolve, reject) => {
                    crypto.randomBytes(16, (err, hash) => {
                        if (err) return reject(err);

                        const ext = path.extname(file.name);
                        const fileName = `${hash.toString('hex')}${ext}`;

                        file.mv(`uploads/attachments/${fileName}`, (err) => {
                            if (err) return reject(err);
                            resolve(fileName);
                        });
                    });
                });
                const fileName = await fileNamesPromise;
                fileNames.push(fileName);
            }
            emailInformation.attachments = fileNames;
        } else {
            delete emailInformation.attachments;
        }
        const email = await Email.updateOne({ _id: emailId }, emailInformation);
         nodeHtmlToImage({
            output: `uploads/emails/${emailId}.jpeg`,
            html: emailInformation.html,
             type: 'jpeg'
        })
        if (!email)
            return res
                .status(500)
                .send(i18n.__('An unknown problem has occurred, please try again later'));

        return res.sendStatus(204);
    } catch (e) {
        return res.status(500).send('Error: ' + e.message);
    }
};

module.exports = patchEmail;
