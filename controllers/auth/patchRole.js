const i18n = require('i18n');
const patchRole = async (req, res) => {
    try {
        const Role = req.Role;
        const roleInformation = req.body;
        const roleId = req.params.id;
        const roleExists = await Role.exists({
            _id: roleId,
        });
        if (!roleExists) return res.status(404).send('Role not found');
        const nameExists = await Role.exists({
            roleName: roleInformation.roleName.toUpperCase(),
            _id: { $ne: roleId },
            active: true,
        });
        if (nameExists) return res.status(409).send('Le nom existe déjà.');

        const role = await Role.updateOne({ _id: roleId }, roleInformation);
        if (!role)
            return res
                .status(500)
                .send(i18n.__('An unknown problem has occurred, please try again later'));

        return res.sendStatus(204);
    } catch (e) {
        return res.status(500).send('Error: ' + e.message);
    }
};

module.exports = patchRole;
