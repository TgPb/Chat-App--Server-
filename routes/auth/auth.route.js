const { Router } = require('express');

const authControllers = require('../../controllers/auth.controllers');

const authRouter = Router();

authRouter.post('/signup', authControllers.signUp);

authRouter.post('/signin', authControllers.signIn);

authRouter.post('/signin/token', authControllers.signInWithToken);

module.exports = authRouter;