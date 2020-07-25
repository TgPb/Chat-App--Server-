const JwtDriver = require('../entities/JwtDriver.entity');
const {
    InvalidAuthorizationError,
    InternalServerError,
} = require('../entities/Errors.entities');

const authMiddlewares = {
    checkAuth: async (req, res, next) => {
        try {
            const { authorization } = req.headers;

            if (!authorization) throw new InvalidAuthorizationError();

            const token = authorization.split(' ')[1];

            if (!token) throw new InvalidAuthorizationError();

            const decoded = await JwtDriver.verifyToken(token);

            const { _id } = decoded;

            req._id = _id;

            next();
        } catch (e) {
            const { name } = e;

            switch (name) {
                case 'InvalidAuthorizationError':
                    return res.status(400).json(e);

                case 'TokenExpiredError':
                    return res.status(400).json(e);

                case 'JsonWebTokenError':
                    return res.status(400).json(e);

                default:
                    return res.status(500).json(new InternalServerError);
            }
        }
    }
};

module.exports = authMiddlewares;