const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const mongoose = require('mongoose');
const { join } = require('path');
const fileUpload = require('express-fileupload');

const rootDir = require('../utils/rootDir');

class Server {
    constructor() {
        this._app = express();
        this._httpServer = http.createServer(this._app);
        this._app.use(express.json());
        this._app.use(express.urlencoded({ extended: true }));
        this._app.use(express.static(join(rootDir, 'public')));
        this._app.use('/icons', express.static(join(rootDir, 'icons')));
        this._app.use(fileUpload({
            useTempFiles: true,
            tempFileDir : '/tmp/'
        }));
    }

    static init() {
        return new Server();
    }

    connectRoutes(routes) {
        routes.forEach(
            route => {
                const { url, router } = route;
                this._app.use(url || '', router);
            }
        );
    }

    initSocketServer(options = {}) {
        this._io = socketIO(this._httpServer, options);
    }

    async connectToDb(url, options = {}) {
        await mongoose.connect(
            url || process.env.DB_URL,
            {
                ...options,
                useNewUrlParser: true,
                useUnifiedTopology: true
            }
        );
        console.log('Connected to db');
    }

    setPort(port) {
        this._app.set('port', port);
    }

    setHostname(hostname) {
        this._app.set('hostname', hostname);
    }

    async listen() {
        const port = this._app.get('port') || process.env.PORT || 5000;
        const hostname = this._app.get('hostname') || process.env.HOSTNAME || 'localhost'

        await this._httpServer.listen(
            port,
            hostname
        );
        console.log(`Server is listening on: ${hostname}:${port}`);
    }
}

module.exports = Server;