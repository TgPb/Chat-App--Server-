const chatsNamespaceHandler = require('./chats/chats.namespace');

module.exports = [
    {
        url: '/chats',
        handler: chatsNamespaceHandler
    }
];