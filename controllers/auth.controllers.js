const User = require('../entities/User.entity');

const JwtDriver = require('../entities/JwtDriver.entity');
const { InternalServerError, InvalidAuthorizationError, InvalidFileTypeError } = require('../entities/Errors.entities');

const rootDir = require('../utils/rootDir');

const authControllers = {
    signUp: async (req, res) => {
        try {
            const { email, password, name, surname } = req.body;

            let fileSrc;

            if (req.files && Object.values(req.files).length) {
                const { icon } = req.files;
                const { mv, name, mimetype } = icon;
                const imageTypes = ['image/jpeg'];

                if (!imageTypes.includes(mimetype)) throw new InvalidFileTypeError();

                const fullPath = `${rootDir}/icons/${Date.now()}${name}`;
                fileSrc = `/icons/${Date.now()}${name}`;

                await mv(fullPath);
            }

            await User.create({ email, name, surname, password, icon: fileSrc });

            return res.status(201).json({
                message: 'User was created'
            });
        } catch (e) {
            const { name } = e;

            switch (name) {
                case 'InvalidFileTypeError':
                    return res.status(400).json(e);

                case 'UserUniquenessError':
                    return res.status(400).json(e);

                default:
                    return res.status(500).json(new InternalServerError);
            }
        }
    },

    signIn: async (req, res) => {
        try {
            const { email, password } = req.body;

            const user = await User.signIn({ email, password });

            const { _id, name, surname, icon } = user;

            const token = JwtDriver.signToken(
                {
                    _id,
                },
                {
                    expiresIn: '30 days'
                }
            );


            return res.json({
                user: {
                    _id,
                    name,
                    surname,
                    icon
                },
                token
            });
        } catch (e) {
            const { name } = e;

            switch (name) {
                case 'InvalidEmailOrPasswordError':
                    return res.status(400).json(e);

                default:
                    return res.status(500).json(new InternalServerError);
            }
        }
    },

    signInWithToken: async (req, res) => {
        try {
            const { authorization } = req.headers;

            if (!authorization) throw new InvalidAuthorizationError();

            const token = authorization.split(' ')[1];

            if (!token) throw new InvalidAuthorizationError();

            const decoded = JwtDriver.verifyToken(token);

            const { _id } = decoded;

            const user = await User.findById(_id);

            const { name, surname, icon } = user;

            res.json({
                user: {
                    _id,
                    name,
                    surname,
                    icon
                }
            })

        } catch (e) {
            const { name } = e;

            switch (name) {
                case 'InvalidAuthorizationError':
                    return res.status(400).json(e);

                case 'TokenExpiredError':
                    return res.status(400).json(e);

                case 'JsonWebTokenError':
                    return res.status(400).json(e);

                case 'NotFoundError':
                    return res.status(404).json(e);

                default:
                    return res.status(500).json(new InternalServerError);
            }
        }
    }
}

module.exports = authControllers;