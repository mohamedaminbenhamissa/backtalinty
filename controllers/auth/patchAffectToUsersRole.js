const i18n = require('i18n');
const patchAffectToUsersRole = async (req, res) => {
    try {
        const User = req.User;
        const Role = req.Role;
        const oldRole = req.params.oldRole;
        const newRole = req.params.newRole;

        const roleExists = await Role.exists({
            _id: newRole,
        });

        if (!roleExists) return res.status(404).send('Role not found');

        const usersUpdated = await User.updateMany(
            { role: oldRole },
            { role: newRole }
        );
        const roleUpdated = await Role.updateMany(
            { _id: oldRole },
            { active: false }
        );
        if (!usersUpdated || !roleUpdated)
            return res
                .status(500)
                .send(i18n.__('An unknown problem has occurred, please try again later'));

        res.sendStatus(204);
    } catch (e) {
        return res.status(500).send('Error: ' + e.message);
    }
};

module.exports = patchAffectToUsersRole;
