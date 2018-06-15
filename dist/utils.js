'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getReportFilesDir = exports.writeToCsv = exports.fileExists = exports.delay = exports.normalizePort = exports.log = undefined;

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _config = require('config');

var _config2 = _interopRequireDefault(_config);

var _csvWriteStream = require('csv-write-stream');

var _csvWriteStream2 = _interopRequireDefault(_csvWriteStream);

var _morgan = require('morgan');

var _morgan2 = _interopRequireDefault(_morgan);

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

var _tracer = require('tracer');

var _tracer2 = _interopRequireDefault(_tracer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const log = exports.log = (() => {
  const logger = _tracer2.default.colorConsole();
  logger.requestLogger = (0, _morgan2.default)('dev');
  return logger;
})();

const normalizePort = exports.normalizePort = val => {
  const port = parseInt(val, 10);
  if (Number.isNaN(port)) return val;
  if (port >= 0) return port;
  return false;
};

const delay = exports.delay = time => new Promise(resolve => {
  setTimeout(() => {
    resolve();
  }, time);
});

const fileExists = exports.fileExists = async filePath => {
  let exists = true;
  try {
    _fs2.default.accessSync(filePath);
  } catch (err) {
    if (err.code === 'ENOENT') {
      exists = false;
    } else {
      throw err;
    }
  }
  return exists;
};

const writeToCsv = exports.writeToCsv = ({ headers, records, filePath }) => {
  const writer = (0, _csvWriteStream2.default)({ headers });
  writer.pipe(_fs2.default.createWriteStream(filePath));
  records.forEach(r => writer.write(r));
  writer.end();
};

const getReportFilesDir = exports.getReportFilesDir = () => {
  let reportFilesDir;
  try {
    reportFilesDir = _path2.default.join(__dirname, `../${_config2.default.get('reportFilesDir')}`);
    _mkdirp2.default.sync(reportFilesDir);
    return reportFilesDir;
  } catch (err) {
    throw err;
  }
};