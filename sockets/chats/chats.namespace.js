const chatsEvents = require('./chats.events');
const chatsHandlers = require('./chats.handlers');

const chatsNamespace = async (nsp, socket) => {
    const { _id, invite } = socket.handshake.query;
    // set user online
    socket.emit(chatsEvents.PARTICIPANT_ONLINE, { _id });

    if (invite) {
        await chatsHandlers.newParticipant({ nsp, socket })({ invite });
    }
    // send chats info
    socket.on(chatsEvents.CHATS_FETCH_START, chatsHandlers.loadChats({ nsp, socket, _id }));
    // create chat
    socket.on(chatsEvents.CREATE_CHAT_START, chatsHandlers.createChat({ nsp, socket }));
    // send message
    socket.on(chatsEvents.SEND_MESSAGE, chatsHandlers.sendMessage({ nsp, socket }));
    // notify about disconnection
    socket.on('disconnecting', chatsHandlers.disconnect({ nsp, socket }));
}

module.exports = chatsNamespace;