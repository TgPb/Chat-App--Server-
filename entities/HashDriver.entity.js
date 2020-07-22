const bcrypt = require('bcrypt');

class HashDriver {
    static async hashPassword(password) {
        const salt = await this.genSalt(12);
        const hashedPassword = await this.hash(password, salt);

        return {
            hashedPassword,
            salt
        };
    }

    static async genSalt(rounds) {
        return await bcrypt.genSalt(rounds);
    }

    static async hash(data, salt) {
        return await bcrypt.hash(data, salt);
    }
}

module.exports = HashDriver;