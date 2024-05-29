const CryptoJS = require('crypto-js');
const encrypt = (content, password) =>
    CryptoJS.AES.encrypt(JSON.stringify({ content }), password).toString();
const decrypt = (crypted, password) =>
    JSON.parse(
        CryptoJS.AES.decrypt(crypted, password).toString(CryptoJS.enc.Utf8)
    ).content;
module.exports = { encrypt, decrypt };
