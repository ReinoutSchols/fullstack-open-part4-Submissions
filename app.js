/* eslint-disable import/order */
/* eslint-disable global-require */
// actual express app.
const express = require('express');
const config = require('./utils/config');

const app = express();
const cors = require('cors');
const logger = require('./utils/logger');
const mongoose = require('mongoose');

const blogsRouter = require('./controllers/blogs');
const usersRouter = require('./controllers/users');
const loginRouter = require('./controllers/login');

if (process.env.NODE_ENV === 'test') {
  const testingRouter = require('./controllers/testing');
  app.use('/api/testing', testingRouter);
}

const middleware = require('./utils/middleware');

mongoose.set('strictQuery', false);

logger.info('connecting to', config.MONGODB_URI);

mongoose.connect(config.MONGODB_URI, { autoIndex: false })
  .then(() => {
    logger.info('connected to MongoDB');
  })
  .catch((error) => {
    logger.error('error connecting to MongoDB:', error.message);
  });

app.use(cors());
// app.use(express.static('dist'));
app.use(express.json());
app.use(middleware.requestLogger);

app.use('/api/users', usersRouter);
app.use('/api/blogs', blogsRouter);
app.use('/api/login', loginRouter);

app.use(middleware.unknownEndpoint);
app.use(middleware.errorHandler);

module.exports = app;
