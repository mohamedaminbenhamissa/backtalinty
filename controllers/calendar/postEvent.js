const axios = require('axios');
require('dotenv').config();
const cancelCalendarEvent = async (req, res) => {
    try {
        const accessToken = process.env.CALENDLY_ACCESS_TOKEN;
        const uuid = req.body.uuid;
        const reason = req.body.reason;
        const CanceleventsUrl = `${uuid}/cancellation`;
        const cancelation = await axios.post(
            CanceleventsUrl,
            { reason: reason },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        return res.status(204).send();
    } catch (error) {
        return res.status(500).send('Error: ' + error.message);
    }
};
module.exports = cancelCalendarEvent;
