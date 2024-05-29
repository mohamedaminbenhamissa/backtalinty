const userSchema = require('../../models/schemas/userSchema');
const roleSchema = require('../../models/schemas/roleSchema');
const verifyCaptcha = require('./verifyCaptcha');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const postLogin = async (req, res) => {
    const connection = req.connection;
    const User = connection.model('user', userSchema);
    connection.model('role', roleSchema);
    console.log('--------------------------', req);

    try {
        const { email, password, token } = req.body;
        const secret = process.env.RECAPTCHA;
        const isCaptchaValid = await verifyCaptcha(token, secret);

        if (!isCaptchaValid) return res.status(401).send('Invalid Captcha');
        const user = await User.findOne({
            email: email.toLowerCase(),
        }).populate({ path: 'role', select: 'permissions roleName -_id' });

        if (!user)
            return res
                .status(401)
                .send('The informations you provided are incorrect.');
        if (!(await bcrypt.compare(password, user.password)))
            return res
                .status(401)
                .send('The informations you provided is incorrect.');

        const jwtToken = jwt.sign(
            {
                userId: user._id,
                email: user.email,
                phone: user.phone,
                job: user.job,
                role: user.role,
                firstName: user.firstName,
                lastName: user.lastName,
                avatar: user.avatar,
                notificationPreferences: user.notificationPreferences,
            },
            process.env.TOKEN_KEY,
            {
                expiresIn: '24hours',
            }
        );
        await User.updateOne(
            { _id: user._id },
            { $set: { lastConnection: new Date() } }
        );
        //user.role.permissions= encrypt(user.role.permissions,  process.env.ENC_KEY);
        return res.status(200).json({
            email: user.email,
            token: jwtToken,
            phone: user.phone,
            job: user.job,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName,
            avatar: user.avatar,
            notificationPreferences: user.notificationPreferences,
        });
    } catch (e) {
        return res.status(500).send('Error: ' + e.message);
    }
};

module.exports = postLogin;
