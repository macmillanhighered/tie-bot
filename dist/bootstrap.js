'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (app) {
  app.use(_bodyParser2.default.json());
  app.use(_bodyParser2.default.urlencoded({ extended: true }));

  // Routes
  app.use(_routes2.default);

  // 404
  app.use((req, res) => {
    res.status(404).send({
      status: 404,
      message: 'The requested resource was not found'
    });
  });

  // 5xx
  app.use((err, req, res) => {
    _utils.log.error(err.stack);
    const message = process.env.NODE_ENV === 'production' ? 'Something went wrong, we\'re looking into it...' : err.stack;
    res.status(500).send({
      status: 500,
      message
    });
  });
};

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _utils = require('./utils');

var _routes = require('./routes');

var _routes2 = _interopRequireDefault(_routes);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }