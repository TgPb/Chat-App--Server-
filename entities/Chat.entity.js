const ChatModel = require('../dbModels/Chat.model');
const {
    InternalServerError,
    NotFoundError
} = require('../entities/Errors.entities');

class Chat {
    constructor({ _id, name, description, participants, messages, icon }) {
        this._id = _id;
        this.name = name;
        this.description = description;
        this.participants = participants;
        this.messages = messages;
        this.icon = icon;
    }

    static async create({ name, description, icon }) {
        let chat = new ChatModel({
            name,
            description,
        });

        if (icon) chat.icon = icon;

        try {
            await chat.save();
        } catch (e) {
            throw new InternalServerError();
        }

        const { _id, icon: chatIcon, messages, participants } = chat;

        chat = new Chat({ _id, name, description, icon: chatIcon, participants, messages });

        return chat;
    }

    static async findById(_id) {
        let chat;
        try {
            chat = await ChatModel.findById(_id);
        } catch (e) {
            throw new InternalServerError();
        }

        if (!chat) throw new NotFoundError('Chat not found');

        const { name, description, messages, icon, participants } = chat;

        chat = new Chat({ _id, name, description, icon, messages, participants });

        return chat;
    }

    addParticipant(participant) {
        this.participants.push(participant);
    }

    addMessage(message) {
        this.messages.push(message);
    }

    async save() {
        try {
            const { _id } = this;

            await ChatModel.updateOne({ _id }, this);
        } catch (e) {
            throw new InternalServerError();
        }
    }
}

module.exports = Chat;