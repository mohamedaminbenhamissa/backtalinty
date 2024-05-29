const bcrypt = require('bcrypt');
const verifyCaptcha = require('./verifyCaptcha');
const i18n = require('i18n');

const patchRecoverPassword = async (req, res) => {
    try {
        const User = req.User;
        const Token = req.Token;
        const { userInformation } = req.body;
        const userPublicToken = req.params.token;
        const password = userInformation.password;
        const recaptchaToken = userInformation.recaptchaToken;

        const secret = process.env.RECAPTCHA;
        const isCaptchaValid = await verifyCaptcha(recaptchaToken, secret);
        if (!isCaptchaValid) return res.status(401).send('Invalid Captcha');

        const token = await Token.findOne({ publicToken: userPublicToken });
        if (!token)
            return res
                .status(401)
                .send('Invalid or expired password reset token.');
        const isValid = await bcrypt.compare(userPublicToken, token.token);
        if (!isValid)
            return res
                .status(401)
                .send('Invalid or expired password reset token.');
        const hash = await bcrypt.hash(
            password,
            Number(process.env.BCRYPT_SALT)
        );
        const userUpdated = await User.updateOne(
            { _id: token.user },
            { $set: { password: hash } }
        );
        const tokenUpdated = await token.deleteOne();
        if (!tokenUpdated || !userUpdated)
            return res
                .status(500)
                .send(i18n.__('An unknown problem has occurred, please try again later'));

        res.sendStatus(200);
    } catch (e) {
        return res.status(500).send('Error: ' + e.message);
    }
};

module.exports = patchRecoverPassword;
