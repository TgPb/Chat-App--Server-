require('dotenv').config();

const Server = require('./entities/Server.entity');

const routes = require('./routes');

const init = async () => {
    const server = Server.init();

    server.connectRoutes(routes);

    await server.connectToDb();
    await server.listen();
}

module.exports = init;