const JwtDriver = require('../entities/JwtDriver.entity');
const { InternalServerError, InvalidFileTypeError } = require('../entities/Errors.entities');

const rootDir = require('../utils/rootDir');

const chatsControllers = {
    create: async (req, res) => {
        try {
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

            return res.status(200).json({
                message: 'Icon was uploaded',
                icon: fileSrc
            });
        } catch (e) {
            const { name } = e;

            switch (name) {
                case 'InvalidFileTypeError':
                    return res.status(400).json(e);

                default:
                    return res.status(500).json(new InternalServerError);
            }
        }
    },

    generateInvite: async (req, res) => {
        const { _id } = req;
        const { chatId } = req.body;

        const data = {
            to: chatId,
            from: _id
        };

        const inviteToken = await JwtDriver.signToken(data, { expiresIn: '24h' });

        res.status(201).json({
            invite: inviteToken
        });
    }
}

module.exports = chatsControllers;