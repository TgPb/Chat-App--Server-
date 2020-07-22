const User = require('../entities/User.entity');

const JwtDriver = require('../entities/JwtDriver.entity');
const { InternalServerError, InvalidAuthorizationError } = require('../entities/Errors.entities');

const authControllers = {
    signUp: async (req, res) => {
        try {
            const { name, surname, email, password, icon } = req.body;

            await User.signUp({
                name,
                surname,
                email,
                password,
                icon
            });

            return res.status(201).json({
                message: 'User was created'
            });
        } catch (e) {
            const { name } = e;

            switch (name) {
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

            const token = JwtDriver.signToken(
                {
                    id: user.id,
                },
                {
                    expiresIn: '30 days'
                }
            );

            const { id, name, surname, icon } = user;

            return res.json({
                user: {
                    id,
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

            const { id } = decoded;

            const user = await User.findById(id);

            const { name, surname, icon } = user;

            res.json({
                user: {
                    id,
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