const HashDriver = require('./HashDriver.entity');

const UserModel = require('../dbModels/User.model');
const ChatsModel = require('../dbModels/Chat.model');

const {
    UserExistsError,
    InternalServerError,
    InvalidEmailOrPasswordError,
    NotFoundError
} = require('./Errors.entities');

class User {
    constructor({ _id, name, surname, email, password, salt, icon, chats }) {
        this._id = _id;
        this.name = name;
        this.surname = surname;
        this.email = email;
        this.password = password;
        this.salt = salt;
        this.icon = icon;
        this.chats = chats;
    }

    static async create({ name, surname, email, password, icon }) {
        let user;

        try {
            user = await UserModel.findOne({ email });
        } catch (e) {
            throw new InternalServerError();
        }

        if (user) throw new UserExistsError();

        const { hashedPassword, salt } = await HashDriver.hashPassword(password);

        user = new UserModel({
            name,
            surname,
            email,
            password: hashedPassword,
            salt
        });

        if (icon) user.icon = icon;

        try {
            await user.save();
        } catch (e) {
            throw new InternalServerError();
        }
    }

    static async signIn({ email, password }) {
        let user;

        try {
            user = await UserModel.findOne({ email });
        } catch (e) {
            throw new InternalServerError();
        }

        if (!user) throw new InvalidEmailOrPasswordError();

        const { _id, name, surname, password: hashedPassword, salt, icon, chats } = user;

        user = new User({
            _id,
            name,
            surname,
            email,
            password: hashedPassword,
            salt,
            icon,
            chats
        });

        const match = await user.verifyPassword(password);

        if (!match) throw new InvalidEmailOrPasswordError();

        return user;
    }

    static async findById(_id) {
        let user;
        try {
            user = await UserModel.findById(_id);
        } catch (e) {
            throw new InternalServerError();
        }

        if (!user) throw new NotFoundError('User not found');

        const { name, surname, icon, chats, email, password, salt } = user;

        user = new User({ _id, name, surname, icon, chats, email, password, salt });

        return user;
    }

    async verifyPassword(password) {
        const hashedPassword = await HashDriver.hash(password, this.salt);
        return hashedPassword === this.password;
    }

    addChat(chatId) {
        this.chats.push(chatId);
    }

    async loadChatsInfo() {
        return await ChatsModel.find({ participants: this._id })
            .populate({
                path: 'participants',
                select: {
                    name: 1,
                    surname: 1,
                    _id: 1,
                    icon: 1
                }
            })
            .exec();
    }

    async save() {
        try {
            const { _id } = this;

            await UserModel.updateOne({ _id }, this);
        } catch (e) {
            throw new InternalServerError();
        }
    }
}

module.exports = User;