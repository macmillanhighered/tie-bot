'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

require('babel-polyfill');

var _config = require('config');

var _config2 = _interopRequireDefault(_config);

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _http = require('http');

var _http2 = _interopRequireDefault(_http);

var _bootstrap = require('./bootstrap');

var _bootstrap2 = _interopRequireDefault(_bootstrap);

var _utils = require('./utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const app = (0, _express2.default)();
app.start = async () => {
  _utils.log.info('Starting Server...');
  const port = (0, _utils.normalizePort)(_config2.default.get('port'));
  app.set('port', port);
  (0, _bootstrap2.default)(app);
  const server = _http2.default.createServer(app);

  server.on('error', error => {
    if (error.syscall !== 'listen') throw error;
    _utils.log.error(`Failed to start server: ${error}`);
    process.exit(1);
  });

  server.on('listening', () => {
    const address = server.address();
    _utils.log.info(`Server listening ${address.address}:${address.port}`);
  });

  server.listen(port);
};

app.start().catch(err => {
  _utils.log.error(err);
});

exports.default = app;