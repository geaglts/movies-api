const express = require('express');
const passport = require('passport');
const boom = require('@hapi/boom');
const jwt = require('jsonwebtoken');
const ApiKeyService = require('../services/apiKeys');
const UserService = require('../services/users');
const validationHandler = require('../utils/middleware/validationHandler');

const {
  createUserSchema,
  createProviderUserSchema,
} = require('../utils/schemas/users');

const { config } = require('../config');

// Basic strategy
require('../utils/auth/strategies/basic');

function authApi(app) {
  const router = express.Router();
  app.use('/api/auth', router);

  const apiKeyService = new ApiKeyService();
  const userService = new UserService();

  router.post('/sign-in', async function (req, res, next) {
    const { apiKeyToken } = req.body;
    if (!apiKeyToken) {
      next(boom.unauthorized(), 'apiKeyToken is required');
    }
    passport.authenticate('basic', function (error, user) {
      try {
        if (error || !user) {
          return next(boom.unauthorized());
        }
        req.login(user, { session: false }, async function (error) {
          if (error) {
            next(error);
          }
          const apiKey = await apiKeyService.getApiKey({ token: apiKeyToken });
          if (!apiKey) {
            next(boom.unauthorized());
          }
          const { _id: id, name, email } = user;
          const payload = {
            sub: id,
            name,
            email,
            scopes: apiKey.scopes,
          };
          const token = jwt.sign(payload, config.authJwtSecret, {
            expiresIn: '15m',
          });

          res.status(200).json({ token, user: { id, name, email } });
        });
      } catch (error) {
        next(error);
      }
    })(req, res, next);
  });

  router.post(
    '/sign-up',
    validationHandler(createUserSchema),
    async function (req, res, next) {
      const { body: user } = req;
      try {
        const createdUserId = await userService.createUser({ user });
        res.status(200).json({
          data: createdUserId,
          message: 'user created',
        });
      } catch (error) {
        next(error);
      }
    }
  );

  router.post(
    '/sign-provider',
    validationHandler(createProviderUserSchema),
    async function (req, res, next) {
      const { body } = req;
      const { apiKeyToken, ...user } = body;
      if (!apiKeyToken) {
        return next(boom.unauthorized('apiKeyToken is required'));
      }
      try {
        const queriedUser = await userService.getOrCreateUser({ user });
        const apiKey = await apiKeyService.getApiKey({ token: apiKeyToken });
        if (!apiKey) {
          return next(boom.unauthorized());
        }
        const { _id: id, email, name } = queriedUser;
        const payload = {
          sub: id,
          email,
          name,
          scopes: apiKey.scopes,
        };
        const token = jwt.sign(payload, config.authJwtSecret, {
          expiresIn: '15m',
        });
        res.status(200).json({
          token,
          user: { id, email, name },
        });
      } catch (error) {
        next(error);
      }
    }
  );
}

module.exports = authApi;
