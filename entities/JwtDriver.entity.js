const jwt = require('jsonwebtoken');

const secretKey = process.env.JWT_KEY || 'secret key';

class JwtDriver {
    static signToken(data, options) {
        return jwt.sign(data, secretKey, options);
    }

    static verifyToken(token) {
        return jwt.verify(token, secretKey);
    }
}

module.exports = JwtDriver;