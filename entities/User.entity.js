const HashDriver = require('./HashDriver.entity');

const UserModel = require('../dbModels/User.model');

const {
    UserExistsError,
    InternalServerError,
    InvalidEmailOrPasswordError,
    NotFoundError
} = require('./Errors.entities');

class User {
    constructor({ id, name, surname, email, password, salt, icon }) {
        this.id = id;
        this.name = name;
        this.surname = surname;
        this.email = email;
        this.password = password;
        this.salt = salt;
        this.icon = icon
    }

    async verifyPassword(password) {
        const hashedPassword = await HashDriver.hash(password, this.salt);
        return hashedPassword === this.password;
    }

    static async hashPassword(password) {
        return await HashDriver.hashPassword(password);
    }

    static async signUp(credentials) {
        const { name, surname, email, password, icon } = credentials;

        let user;

        try {
            user = await UserModel.findOne({ email });
        } catch (e) {
            throw new InternalServerError();
        }

        if (user) throw new UserExistsError();

        const { hashedPassword, salt } = await User.hashPassword(password);

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

        const { _id: id } = user;

        return new User({
            id,
            name,
            surname,
            email,
            hashedPassword,
            salt,
            icon
        });
    }

    static async signIn(credentials) {
        const { email, password } = credentials;

        let user;

        try {
            user = await UserModel.findOne({ email });
        } catch (e) {
            throw new InternalServerError();
        }

        if (!user) throw new InvalidEmailOrPasswordError();

        const { _id: id, name, surname, password: hashedPassword, salt, icon } = user;

        user = new User({
            id,
            name,
            surname,
            email,
            password: hashedPassword,
            salt,
            icon
        });

        const success = await user.verifyPassword(password);

        if (!success) throw new InvalidEmailOrPasswordError();

        return user;
    }

    static async findById(id) {
        let user;
        try {
            user = await UserModel.findById(id);
        } catch (e) {
            throw new InternalServerError();
        }

        if (!user) throw new NotFoundError('User not found');

        const { name, surname, icon } = user;

        user = new User({ id, name, surname, icon });

        return user;
    }
}

module.exports = User;