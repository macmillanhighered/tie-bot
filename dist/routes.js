'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _utils = require('./utils');

var _reports = require('./modules/reports');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const router = new _express2.default.Router();

router.post('/slack/command/report', async (req, res) => {
  try {
    const slackReqObj = req.body;
    const response = {
      response_type: 'in_channel',
      channel: slackReqObj.channel_id,
      text: 'Hello :slightly_smiling_face:',
      attachments: [{
        text: 'What report would you like to get?',
        fallback: 'What report would you like to get?',
        color: '#2c963f',
        attachment_type: 'default',
        callback_id: 'report_selection',
        actions: [{
          name: 'game',
          text: 'Chess',
          type: 'button',
          value: 'chess'
        }, {
          name: 'game',
          text: '',
          type: 'button',
          value: 'maze'
        }]
      }]
    };
    return res.json(response);
  } catch (err) {
    _utils.log.error(err);
    return res.status(500).send('Something blew up. We\'re looking into it.');
  }
});

router.post('/slack/command/deploy', async (req, res) => {
  console.log('req', req.body.text);
  const { body: { text } } = req;
  const split = text.split('-');
  const [env, stack, service] = split;
  console.log('env, stack, service', env, stack, service);
  const url = `http://jenkins.mldev.cloud/job/TIE/job/${service}%20deploy/build?delay=300sec`;
  try {
    const slackReqObj = req.body;
    const response = {
      response_type: 'in_channel',
      channel: slackReqObj.channel_id,
      text: 'Hello :slightly_smiling_face:',
      attachments: [{
        text: `Deploy ${service} :: ${url} in 5 min`,
        fallback: `Deploy ${env}-${stack}-${service}`,
        color: '#2c963f',
        attachment_type: 'default',
        callback_id: 'report_selection',
        actions: [{
          name: 'option',
          text: 'Build',
          type: 'button',
          value: 'build'
        }, {
          name: 'option',
          text: 'Announce',
          type: 'button',
          value: 'announce'
        }, {
          name: 'game',
          text: 'Thermonuclear War',
          style: 'danger',
          type: 'button',
          value: 'war',
          confirm: {
            title: 'Are you sure?',
            text: 'Wouldn\'t you prefer a good game of chess?',
            ok_text: 'Yes',
            dismiss_text: 'No'
          }
        }]
      }]
    };
    return res.json(response);
  } catch (err) {
    _utils.log.error(err);
    return res.status(500).send('Something blew up. We\'re looking into it.');
  }
});

router.post('/slack/actions', async (req, res) => {
  try {
    const slackReqObj = JSON.parse(req.body.payload);
    let response;
    if (slackReqObj.callback_id === 'report_selection') {
      response = await (0, _reports.generateReport)({ slackReqObj });
    }
    return res.json(response);
  } catch (err) {
    _utils.log.error(err);
    return res.status(500).send('Something blew up. We\'re looking into it.');
  }
});

exports.default = router;