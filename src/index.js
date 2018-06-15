import 'babel-polyfill';
import config from 'config';
import express from 'express';
import http from 'http';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import tracer from 'tracer';

import routes from './routes';

// utils
export const log = (() => {
  const logger = tracer.colorConsole();
  logger.requestLogger = morgan('dev');
  return logger;
})();

export const normalizePort = (val) => {
  const port = parseInt(val, 10);
  if (Number.isNaN(port)) return val;
  if (port >= 0) return port;
  return false;
};

const app = express();
app.start = async () => {
  log.info('Starting Server...');
  const port = normalizePort(config.get('port'));
  app.set('port', port);

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  // Routes
  app.use(routes);

  // 404
  app.use((req, res) => {
    res.status(404).send({
      status: 404,
      message: 'The requested resource was not found',
    });
  });

  // 5xx
  app.use((err, req, res) => {
    log.error(err.stack);
    const message = process.env.NODE_ENV === 'production'
      ? 'Something went wrong, we\'re looking into it...'
      : err.stack;
    res.status(500).send({
      status: 500,
      message,
    });
  });
  const server = http.createServer(app);

  server.on('error', (error) => {
    if (error.syscall !== 'listen') throw error;
    log.error(`Failed to start server: ${error}`);
    process.exit(1);
  });

  server.on('listening', () => {
    const address = server.address();
    log.info(`Server listening ${address.address}:${address.port}`);
  });

  server.listen(port);
};

app.start().catch((err) => {
  log.error(err);
});

export default app;
