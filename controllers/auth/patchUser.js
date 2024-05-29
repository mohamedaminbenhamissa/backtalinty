const i18n = require('i18n');
const patchUser = async (req, res) => {
    //TODO check if user is editing his own profile, he can't edit role or poste
    try {
        const User = req.User;
        const { userInformation } = req.body;
        const userId = req.params.id;
        const userExists = await User.exists({
            email: userInformation.email.toLowerCase(),
        });

        if (!userExists) return res.status(404).send('User not found');

        userInformation.email = userInformation.email.toLowerCase();

        const user = await User.updateOne({ _id: userId }, userInformation);
        if (!user)
            return res
                .status(500)
                .send(i18n.__('An unknown error has occurred, please try again later.'));

        return res.sendStatus(204);
    } catch (e) {
        return res.status(500).send('Error: ' + e.message);
    }
};

module.exports = patchUser;
