'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.generateReport = exports.reportsList = undefined;

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _config = require('config');

var _config2 = _interopRequireDefault(_config);

var _utils = require('../../utils');

var _slack = require('../slack');

var _getUserActivity = require('./getUserActivity');

var _getUserActivity2 = _interopRequireDefault(_getUserActivity);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const slackConfig = _config2.default.get('slack');

// Reports


const REPORTS_CONFIG = {
  userActivity: {
    name: 'User Activity',
    namePrefix: 'userActivity',
    type: 'csv',
    func: _getUserActivity2.default
  }
};

const reportsList = exports.reportsList = Object.entries(REPORTS_CONFIG).map(([key, value]) => {
  const report = {
    text: value.name,
    value: key
  };
  return report;
});

const generateReportImplAsync = async (options, { slackReqObj }) => {
  const {
    reportName,
    reportTmpName,
    reportType,
    reportFilePath,
    reportFunc
  } = options;

  try {
    // Initiate report function
    await reportFunc();

    /*
      FIX ME::
      Delay hack to ensure previous fs call is done processing file
    */
    await (0, _utils.delay)(250);
    const reportExists = await (0, _utils.fileExists)(reportFilePath);

    if (reportExists === false) {
      const message = {
        responseUrl: slackReqObj.response_url,
        replaceOriginal: false,
        text: `There's currently no data for report *${reportName}*`,
        mrkdwn: true,
        mrkdwn_in: ['text']
      };
      return (0, _slack.postChatMessage)(message).catch(ex => {
        _utils.log.error(ex);
      });
    }

    /*
      FIX ME::
      Delay hack to ensure previous fs call is done processing file
    */
    await (0, _utils.delay)(250);
    const uploadedReport = await (0, _slack.uploadFile)({
      filePath: reportFilePath,
      fileTmpName: reportTmpName,
      fileName: reportName,
      fileType: reportType,
      channels: slackConfig.reporterBot.fileUploadChannel
    });
    const message = {
      responseUrl: slackReqObj.response_url,
      replaceOriginal: false,
      text: 'Your report is ready!',
      attachments: [{
        text: `<${uploadedReport.file.url_private}|${reportName}>`,
        color: '#2c963f',
        footer: 'Click report link to open menu with download option'
      }]
    };
    return (0, _slack.postChatMessage)(message).catch(err => {
      _utils.log.error(err);
    });
  } catch (err) {
    _utils.log.error(err);
    const message = {
      responseUrl: slackReqObj.response_url,
      replaceOriginal: false,
      text: `Well this is embarrassing :sweat: I couldn't successfully get the report *${reportName}*. Please try again later as I look into what went wrong.`,
      mrkdwn: true,
      mrkdwn_in: ['text']
    };
    return (0, _slack.postChatMessage)(message).catch(ex => {
      _utils.log.error(ex);
    });
  }
};

const generateReport = exports.generateReport = async options => {
  try {
    const { slackReqObj } = options;
    const reportKey = slackReqObj.actions[0].selected_options[0].value;
    const report = REPORTS_CONFIG[reportKey];

    if (report === undefined) {
      const slackReqObjString = JSON.stringify(slackReqObj);
      _utils.log.error(new Error(`reportKey: ${reportKey} did not match any reports. slackReqObj: ${slackReqObjString}`));
      const response = {
        response_type: 'in_channel',
        text: 'Hmmm :thinking_face: Seems like that report is not available. Please try again later as I look into what went wrong.'
      };
      return response;
    }

    const reportTmpName = `${report.namePrefix}_${Date.now()}.${report.type}`;
    const reportFilesDir = (0, _utils.getReportFilesDir)();
    const reportFilePath = _path2.default.join(reportFilesDir, reportTmpName);

    const reportParams = {
      reportName: report.name,
      reportTmpName,
      reportType: report.type,
      reportFilePath,
      reportFunc() {
        return report.func({ reportFilePath });
      }
    };

    // Begin async report generation
    generateReportImplAsync(reportParams, { slackReqObj });

    const response = {
      response_type: 'in_channel',
      text: `Got it :thumbsup: Generating requested report *${report.name}*\nPlease carry on, I'll notify you when I'm done.`,
      mrkdwn: true,
      mrkdwn_in: ['text']
    };
    return response;
  } catch (err) {
    throw err;
  }
};