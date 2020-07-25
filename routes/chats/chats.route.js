const { Router } = require('express');

const chatsControllers = require('../../controllers/chats.controllers');

const authMiddlewares = require('../../middlewares/auth.middlewares');

const chatsRouter = Router();

chatsRouter.use(authMiddlewares.checkAuth);

chatsRouter.post('/create', chatsControllers.create);

chatsRouter.post('/invite', chatsControllers.generateInvite);

module.exports = chatsRouter;