const jwt = require('jsonwebtoken');
const { pathToSubject } = require('../utils/permissions');
const { methodToAction } = require('../utils/permissions');
const { buildAbilityFor } = require('../utils/permissions');

const tokenKey = process.env.TOKEN_KEY;

const checkCanAccessResource = async (req, res, next) => {
    // let token = req.body.token || req.query.token || req.headers['authorization'];
    let token = req.headers['authorization'];
    if (!token) return res.status(401).send('Token is required');
    try {
        token = token.replace(/^Bearer\s+/, '');
        req.user = jwt.verify(token, tokenKey);
    } catch (e) {
        return res.status(401).send('Invalid Token');
    }
    /*  console.log(req.user)*/
    const permissions = req.user.permissions;
    const method = req.method;
    const originalUrl = req.originalUrl;

    const allowedPermissions = buildAbilityFor(permissions);
    const isAllowed = allowedPermissions.can(
        methodToAction(method),
        pathToSubject(originalUrl)
    );
    /* console.log("originalUrl");
    console.log(methodToAction(method));
    console.log(pathToSubject(originalUrl));*/
    /*if (!isAllowed) {
        return res.status(403).send('User does not have access to this resource');
    }*/
    return next();
};
const verifySocketToken = (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
        return next(new Error('Token is required'));
    }
    try {
        socket.user = jwt.verify(token, tokenKey);
    } catch (e) {
        return next(new Error('Invalid Token'));
    }
    next();
};
module.exports = { checkCanAccessResource, verifySocketToken };
