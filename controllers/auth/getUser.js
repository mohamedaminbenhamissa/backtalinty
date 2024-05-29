const getUser = async (req, res) => {
    try {
        const User = req.User;
        let user;
        const fields = req.params.fields;
        const userId = req.params.id;
        if (fields.includes('role'))
            user = await User.findOne({ _id: userId }, fields).populate({
                path: 'role',
                select: 'roleName _id',
            });
        else user = await User.findOne({ _id: userId }, fields);

        if (!user) return res.status(404).send('User not found');
        return res.status(200).json(user);
    } catch (e) {
        return res.status(500).send('Error: ' + e.message);
    }
};
const getUsers = async (req, res) => {
    try {
        const User = req.User;
        let users;
        const params = req.query.params;
        const fields = req.query.fields;
        if (fields.includes('role'))
            users = await User.find(params, fields)
                .populate({
                    path: 'role',
                    select: 'roleName -_id',
                })
                .sort({
                    firstName: 1,
                    lastName: 1,
                })
                .lean();
        else
            users = await User.find(params, fields)
                .sort({
                    firstName: 1,
                    lastName: 1,
                })
                .lean();

        if (!users) return res.status(404).send('Users not found');
        res.status(200).json(users);
    } catch (e) {
        return res.status(500).send('Error: ' + e.message);
    }
};
module.exports = { getUser, getUsers };
