const User = require('../../entities/User.entity');
const Chat = require('../../entities/Chat.entity');

const chatsEvents = require('./chats.events');

const getChatUsersOnline = ({ nsp, chatId }) => (
    Object.values(nsp.in(chatId).connected).map(socket => {
        const { _id } = socket.handshake.query;
        return _id;
    })
);

const loadChats = ({ nsp, socket, _id }) => async () => {
    try {
        // load user
        const user = await User.findById(_id);
        // load user chats
        const chats = await user.loadChatsInfo();
        // send chats data
        socket.emit(chatsEvents.CHATS_FETCH_SUCCESS, {chats});
        // update online users in all chats
        chats.forEach(chat => {
            const {_id: chatId} = chat;
            socket.join(chatId, () => {
                const participantsOnline = getChatUsersOnline({nsp, _id: chatId});

                participantsOnline.forEach(
                    userId => nsp.in(chatId).emit(chatsEvents.PARTICIPANT_ONLINE, {_id: userId})
                );
            });
        });
    } catch (e) {
        socket.emit(chatsEvents.CHATS_FETCH_ERROR);
    }
};

const createChat = ({ nsp, socket }) => async ({ name, description, icon }) => {
    try {
        // create chat
        const chat = await Chat.create({name, description, icon});

        const {_id: chatId, messages, icon: chatIcon} = chat;

        const {_id: userId} = socket.handshake.query;
        // find user
        const user = await User.findById(userId);

        const {name: userName, surname, icon: userIcon} = user;
        // add chat to user
        user.addChat(chatId);
        await user.save();
        // add participant to chat
        chat.addParticipant(userId);
        await chat.save();

        const participants = [
            {
                _id: userId,
                name: userName,
                surname,
                icon: userIcon
            }
        ];
        // send chat data
        socket.emit(chatsEvents.CREATE_CHAT_SUCCESS, {
            chat: {
                _id: chatId,
                name,
                participants,
                description,
                icon: chatIcon,
                messages
            }
        });

        const message = {
            isSystem: true,
            text: `${userName} ${surname} created ${name} chat`,
            date: Date.now()
        }

        chat.addMessage(message);
        await chat.save();

        socket.join(chatId, () => {
            const participantsOnline = getChatUsersOnline({nsp, chatId});
            // update users online
            participantsOnline.forEach(
                _id => nsp.in(chatId).emit(chatsEvents.PARTICIPANT_ONLINE, {_id})
            );
            // send system message about chat creation
            nsp.in(chatId).emit(chatsEvents.NEW_MESSAGE, {to: chatId, message});
        });
    } catch (e) {
        socket.emit(chatsEvents.CREATE_CHAT_ERROR);
    }
};

const sendMessage = ({ nsp, socket }) => async ({ to: chatId, text }) => {
    try {
        // load chat
        const chat = await Chat.findById(chatId);

        const {_id: userId} = socket.handshake.query;

        const message = {
            from: userId,
            text,
            date: Date.now()
        };
        // add message to chat
        chat.addMessage(message);
        await chat.save();
        // send message to participants
        nsp.in(chatId).emit(chatsEvents.NEW_MESSAGE, {to: chatId, message});
    } catch (e) {
        socket.emit(chatsEvents.SEND_MESSAGE_ERROR);
    }
};

const disconnect = ({ socket }) => () => {
    const { _id: userId } = socket.handshake.query;
    // get users chats
    const [_, ...userChats] = Object.values(socket.rooms);
    // notify all chats about user offline
    userChats.forEach(chatId => {
        socket.in(chatId).emit(chatsEvents.PARTICIPANT_OFFLINE, { _id: userId });
    });
};

module.exports = {
    loadChats,
    createChat,
    sendMessage,
    disconnect
};