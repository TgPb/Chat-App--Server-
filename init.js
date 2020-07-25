require('dotenv').config();

const Server = require('./entities/Server.entity');

const routes = require('./routes');
const namespaces = require('./sockets');

const init = async () => {
    const server = Server.init();

    server.useRoutes(routes);
    await server.initSocketServer();
    server.useSocketNamespaces(namespaces);
    await server.connectToDb();
    await server.listen();
}

module.exports = init;