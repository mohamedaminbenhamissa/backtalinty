const bcrypt = require('bcrypt');
const crypto = require('crypto');
const mongoose = require('mongoose');
const verifyCaptcha = require('./verifyCaptcha');
const { sendHtmlEmail } = require('../../utils/mailer');

const patchRequestPassword = async (req, res) => {
    try {
        const User = req.User;
        const Email = req.Email;
        const Token = req.Token;
        const { email, recaptchaToken } = req.body;
        const templateEmail = await Email.findOne({ _id: mongoose.Types.ObjectId('65d36bd46909bdf869d21bd2') });
        const secret = process.env.RECAPTCHA;
        const isCaptchaValid = await verifyCaptcha(recaptchaToken, secret);
        if (!isCaptchaValid) return res.status(401).send('Invalid Captcha');

        const user = await User.findOne({ email: email.toLowerCase() }, [
            '_id',
        ]);
        if (!user) return res.status(200).send('User not found');
        const token = await Token.findOne({ user: user._id });
        if (token) await token.deleteOne();

        let resetToken = crypto.randomBytes(32).toString('hex');
        const hash = await bcrypt.hash(
            resetToken,
            Number(process.env.BCRYPT_SALT)
        );
        const tokenCreated = await Token.create({
            user: user._id,
            token: hash,
            publicToken: resetToken,
            createdAt: Date.now(),
        });

        const replaceableObject = {
            '${password_reset_link}': `${process.env.BO_URL}authentication/password-reset/${resetToken}`,
        };
        let newContent = templateEmail.html;
        Object.keys(replaceableObject).forEach((key) => {
            newContent = newContent.replaceAll(key, replaceableObject[key]);
        });
        await sendHtmlEmail(
            email,
            templateEmail.subject,
            newContent
        );
        if (!tokenCreated)
            return res
                .status(500)
                .send('Un problème est survenu avevc la Base de donnée');
        res.status(200).send(resetToken);
    } catch (e) {
        return res.status(500).send('Error: ' + e.message);
    }
};

module.exports = patchRequestPassword;
