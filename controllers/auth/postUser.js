const bcrypt = require('bcrypt');
const crypto = require('crypto');
const mongoose = require('mongoose');
const i18n = require('i18n');
const { sendHtmlEmail } = require('../../utils/mailer');
const postUser = async (req, res) => {
    try {
        const User = req.User;
        const Role = req.Role;
        const Token = req.Token;
        const { userInformation } = req.body;
        const userExists = await User.exists({
            email: userInformation.email.toLowerCase(),
        });

        if (userExists)
            return res.status(409).send(i18n.__("User already exists"));

        const roleExist = await Role.exists({ _id: userInformation.role });
        if (!roleExist) return res.status(400).send(i18n.__('Role does not exist'));

        const phoneExist = await User.exists({ phone: userInformation.phone });
        if (phoneExist) return res.status(409).send(i18n.__('The phone number is already used'));

        userInformation.email = userInformation.email.toLowerCase();

        //generate a random avatar for the user
        if (!userInformation.avatar)
            userInformation.avatar = `64_${
                Math.floor(Math.random() * 15) + 1
            }.png`;

        const userCreated = await User.create({
            ...userInformation,
        });

        if (!userCreated)
            return res
                .status(500)
                .send(i18n.__('An unknown error has occurred, please try again later.'));

        const token = await Token.findOne({ user: userCreated._id });
        if (token) await token.deleteOne();

        let resetToken = crypto.randomBytes(32).toString('hex');
        const hash = await bcrypt.hash(
            resetToken,
            Number(process.env.BCRYPT_SALT)
        );
        const tokenCreated = await Token.create({
            user: userCreated._id,
            token: hash,
            publicToken: resetToken,
            createdAt: Date.now(),
        });
console.log('eeeeeeeeeeee')
        if (!tokenCreated)
            return res
                .status(500)
                .send(i18n.__('An unknown error has occurred, please try again later.'));
        const Email = req.Email;
        const templateEmail = await Email.findOne({ _id: mongoose.Types.ObjectId('65d36bd46909bdf869d21bd2') });
        const replaceableObject = {
            '${password_reset_link}': `${process.env.BO_URL}authentication/password-reset/${resetToken}`,
        };
        let newContent = templateEmail.html;
        Object.keys(replaceableObject).forEach((key) => {
            newContent = newContent.replaceAll(key, replaceableObject[key]);
        });
        await sendHtmlEmail(
            userInformation.email,
            templateEmail.subject,
            newContent
        );
        res.status(201).send('Created');
    } catch (e) {
        return res.status(500).send('Error45: ' + e.message);
    }
};

module.exports = postUser;
