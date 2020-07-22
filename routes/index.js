const authRouter = require('./auth/auth.route');

module.exports = [
    {
        url: '/auth',
        router: authRouter
    }
]