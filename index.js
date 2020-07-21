require('dotenv').config();

const Server = require('./entities/Server');

const init = async () => {
    const server = Server.init();
    await server.connectToDb();
    await server.listen();
}

init();