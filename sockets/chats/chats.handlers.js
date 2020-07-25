const User = require('../../entities/User.entity');
const Chat = require('../../entities/Chat.entity');
const JwtDriver = require('../../entities/JwtDriver.entity');

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

const newParticipant = ({ nsp, socket }) => async ({ invite }) => {
    try {
        // decode invite token
        const decoded = JwtDriver.verifyToken(invite);

        const { from, to: chatId } = decoded;

        const { _id: userId } = socket.handshake.query;
        //load chat
        const chat = await Chat.findById(chatId);

        const { participants } = chat;

        if (!participants.includes(userId)) {
            const user = await User.findById(userId);
            const inviter = await User.findById(from);

            const { name: inviterName, surname: inviterSurname } = inviter;

            const { name, surname, icon } = user;

            // get new participant info
            const participant = {
                _id: userId,
                name,
                surname,
                icon
            };

            // system message about new participant
            const message = {
                date: Date.now(),
                isSystem: true,
                text: `${inviterName} ${inviterSurname} invited ${name} ${surname}`
            }

            // add chat to user
            user.addChat(chatId);
            await user.save();

            // add system message and user to chat
            chat.addMessage(message);
            chat.addParticipant(userId);
            await chat.save();

            // send new participant info and system message
            nsp.in(chatId).emit(chatsEvents.NEW_PARTICIPANT, { to: chatId, participant });
            nsp.in(chatId).emit(chatsEvents.NEW_MESSAGE, { to: chatId, message });
        }
    } catch (e) {
        const { name } = e;

        switch (name) {
            // token expired
            case 'TokenExpiredError':
                socket.emit(chatsEvents.ADD_PARTICIPANT_ERROR, { message: 'Invite token expired. Please get new invite url' });
                break;
            // invalid token
            case 'JsonWebTokenError':
                socket.emit(chatsEvents.ADD_PARTICIPANT_ERROR, { message: 'Invalid invite token' });
                break;

            default:
                socket.emit(chatsEvents.ADD_PARTICIPANT_ERROR, { message: 'Something went wrong. Please try again or get new invite url' });
                break;
        }
    }
};

module.exports = {
    loadChats,
    createChat,
    sendMessage,
    disconnect,
    newParticipant
};