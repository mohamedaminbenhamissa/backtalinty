const i18n = require('i18n');
const deletePack = async (req, res) => {
    try {
        const Pack = req.Pack;
        const packId = req.params.id;

        const pack = await Pack.updateOne({ _id: packId }, { active: false });
        if (!pack)
            return res
                .status(500)
                .send(i18n.__('An unknown problem has occurred, please try again later'));

        res.sendStatus(204);
    } catch (e) {
        return res.status(500).send('Error: ' + e.message);
    }
};

module.exports = deletePack;
