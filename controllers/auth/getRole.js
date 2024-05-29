const getRole = async (req, res) => {
    try {
        const Role = req.Role;
        const User = req.User;
        const fields = req.params.fields;
        const roleId = req.params.id;
        //if we want tne number of users in this role
        if (fields.includes('usersInRole')) {
            const count = await User.countDocuments({ role: roleId });
            return res.status(200).json(count);
        }
        const role = await Role.findOne({ _id: roleId }, ['-_id']);
        if (!role) return res.status(404).send('Role not found');
        return res.status(200).json(role);
    } catch (e) {
        return res.status(500).send('Error: ' + e.message);
    }
};
const getRoles = async (req, res) => {
    try {
        const Role = req.Role;
        const params = req.query.params;
        const fields = req.query.fields;
        let roles;
        //if we want tne number of users in this role
        if (fields.includes('usersInRole')) {
            delete fields.usersInRole;
            //We just change the fields we want to get in a format mongo can deal with it
            //EX INPUT const fields = ['name'];
            //EX OUTPUT const fieldsObject = {
            //     name: true,
            // };
            const fieldsObject = fields.reduce(
                (a, v) => ({ ...a, [v]: true }),
                {}
            );

            roles = await Role.aggregate([
                {
                    $match: {
                        active: true,
                    },
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: '_id',
                        foreignField: 'role',
                        as: 'users',
                    },
                },

                {
                    $addFields: {
                        usersInRole: {
                            $size: '$users',
                        },
                    },
                },
                {
                    $project: fieldsObject,
                },
                {
                    $unset: 'users',
                },
            ]);
        } else roles = await Role.find(params, fields);
        if (!roles) return res.status(404).send('Roles not found');
        return res.status(200).json(roles);
    } catch (e) {
        return res.status(500).send('Error: ' + e.message);
    }
};
module.exports = { getRole, getRoles };
