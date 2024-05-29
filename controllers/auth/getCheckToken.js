// Function to validate a user-provided token by querying the Token model
const getCheckToken = async (req, res) => {
    try {
        const Token = req.Token;
        const userToken = req.params.token;
        const token = await Token.findOne({ publicToken: userToken });
        if (!token) return res.sendStatus(410);

        return res.sendStatus(200);
    } catch (e) {
        return res.status(500).send('Error: ' + e.message);
    }
};
module.exports = { getCheckToken };
