const i18n = require('i18n');
const postRole = async (req, res) => {
    try {
        const Role = req.Role;
        const { roleName, permissions } = req.body;

        const roleExists = await Role.exists({
            roleName: roleName.toUpperCase(),
            active: true,
        });

        if (roleExists) return res.status(409).send('Le rôle existe déjà.');

        const role = await Role.create({
            roleName: roleName.toUpperCase(),
            permissions: permissions,
        });
        if (!role)
            return res
                .status(500)
                .send(i18n.__('An unknown problem has occurred, please try again later'));

        res.status(201).send('Created');
    } catch (e) {
        return res.status(500).send('Error: ' + e.message);
    }
};

module.exports = postRole;
