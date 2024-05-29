const i18n = require('i18n');
const putPack = async (req, res) => {
    try {
        const Pack = req.Pack;
        const packInformation = req.body;
        const packId = req.params.id;

        const pack = await Pack.findOneAndUpdate(
            { _id: packId },
            packInformation
        );
        if (!pack)
            return res
                .status(500)
                .send(i18n.__('An unknown problem has occurred, please try again later'));

        res.status(204).send();
    } catch (e) {
        return res.status(500).send('Error: ' + e.message);
    }
};

module.exports = putPack;
