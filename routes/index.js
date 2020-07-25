const authRouter = require('./auth/auth.route');
const chatsRouter = require('./chats/chats.route');

module.exports = [
    {
        url: '/auth',
        router: authRouter
    },
    {
        url: '/chats',
        router: chatsRouter
    }
];