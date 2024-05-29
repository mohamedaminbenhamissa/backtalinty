const i18n = require('i18n');
const deleteUser = async (req, res) => {
    try {
        const User = req.User;
        const userId = req.params.id;
        const userExists = await User.exists({
            _id: userId,
        });
        if (!userExists) return res.status(404).send(i18n.__('User not found'));
        const user = await User.updateOne(
            { _id: userId },
            { $set: { active: false } }
        );
        if (!user)
            return res
                .status(500)
                .send(
                    i18n.__('An unknown problem has occurred, please try again later')
                );

        return res.sendStatus(204);
    } catch (e) {
        return res.status(500).send(i18n.__('Error: ' + e.message));
    }
};

module.exports = deleteUser;
