const i18n = require('i18n');
const postPack = async (req, res) => {
    try {
        const Pack = req.Pack;
        const packInformation = req.body;
        const pack = await Pack.create(packInformation);
        if (!pack)
            return res
                .status(500)
                .send(i18n.__('An unknown problem has occurred, please try again later'));

        return res.status(201).send('Created');
    } catch (e) {
        return res.status(500).send('Error: ' + e.message);
    }
};
const duplicatePack = async (req, res) => {
    try {
        const Pack = req.Pack;
        const packId = req.params.id;
        const packInformation = req.body;
        packInformation.parent = packId;
        const duplicatedPack = await Pack.create(packInformation);
        if (!duplicatedPack)
            return res
                .status(500)
                .send(i18n.__('An unknown problem has occurred, please try again later'));

        return res.status(201).send('Created');
    } catch (e) {
        return res.status(500).send('Error: ' + e.message);
    }
};
module.exports = { postPack: postPack, duplicatePack };
