const https = require('https');
const verifyCaptcha = async (token, secret) => {
    const postData = new URLSearchParams({
        secret,
        response: token,
    }).toString();

    const options = {
        hostname: 'www.google.com',
        port: 443,
        path: '/recaptcha/api/siteverify',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': postData.length,
        },
    };

    const response = await new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            const chunks = [];
            res.on('data', (chunk) => chunks.push(chunk));
            res.on('end', () => {
                const data = Buffer.concat(chunks);
                resolve(JSON.parse(data));
            });
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
    });

    return response.success;
};
module.exports = verifyCaptcha;
