const { Router } = require('express');

const chatsControllers = require('../../controllers/chats.controllers');

const chatsRouter = Router();

chatsRouter.post('/create', chatsControllers.create);

module.exports = chatsRouter;