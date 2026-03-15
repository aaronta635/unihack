const path = require('path');
const envPath = path.join(__dirname, '.env');
require('dotenv').config({ path: envPath });
if (!process.env.FT_MODEL_BEST_FRIEND) {
  console.warn("[env] FT_MODEL_BEST_FRIEND is not set. Tutor chat will return 500. Loaded .env from:", envPath);
}

const logger = require('morgan');
const cors = require('cors');
const createError = require('http-errors');
const express = require('express');
const cookieParser = require('cookie-parser');
const uploadRouter = require('./routes/upload');
const tutorRouter = require('./routes/tutor');
const voiceRouter = require('./routes/voice');
const { requireAuth } = require('./middleware/requireAuth');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const authRouter = require('./routes/auth');
const scoresRouter = require('./routes/scores');
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(cors());
app.use(express.json());

app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', function (req, res) {
  res.json({ ok: true, message: 'API is up', timestamp: new Date().toISOString() });
});
// Mount API routes before catch-all index so /tutor/speech etc. are matched
app.use('/tutor', tutorRouter);
app.use('/users', usersRouter);
app.use('/auth', authRouter);
app.use('/upload', uploadRouter);
app.use('/api', scoresRouter);
app.use('/api/voice', voiceRouter);
app.use('/', indexRouter);

const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Unihack API',
      version: '1.0.0',
      description: 'API documentation for Unihack backend',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Local server',
      },
    ],
  },
  apis: ['./routes/*.js', './app.js'],
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/health',(req, res) => {
  res.json({ status: 'ok' });
});

// catch 404
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  console.error(err);

  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

module.exports = app;