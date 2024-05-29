const i18n = require('i18n');
const deleteRole = async (req, res) => {
    try {
        const Role = req.Role;
        const roleId = req.params.id;
        const roleExists = await Role.exists({
            _id: roleId,
        });
        if (!roleExists) return res.status(404).send('Role not found');

        const role = await Role.updateOne({ _id: roleId }, { active: false });
        if (!role)
            return res
                .status(500)
                .send(i18n.__('An unknown problem has occurred, please try again later'));

        res.status(204).send();
    } catch (e) {
        return res.status(500).send('Error: ' + e.message);
    }
};

module.exports = deleteRole;
