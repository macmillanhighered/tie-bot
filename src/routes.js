/* eslint-disable camelcase */
import express from 'express';
import request from 'request';

import { log } from './index';

const getSubdomain = (url) => {
  return url.match(/(?:http[s]*:\/\/)*(.*?)\.(?=[^/]*\..{2,5})/i)[1];
};

const postChatMessage = message => new Promise((resolve, reject) => {
  const {
    responseUrl,
    channel = null,
    text = null,
    attachments = null,
    replaceOriginal = null,
  } = message;

  const payload = {
    response_type: 'in_channel',
  };

  if (channel !== null) payload.channel = channel;
  if (text !== null) payload.text = text;
  if (attachments !== null) payload.attachments = attachments;
  if (replaceOriginal !== null) payload.replace_original = replaceOriginal;

  request.post({
    url: responseUrl,
    body: payload,
    json: true,
  }, (err, response, body) => {
    if (err) {
      reject(err);
    } else if (response.statusCode !== 200) {
      reject(body);
    } else if (body.ok !== true) {
      const bodyString = JSON.stringify(body);
      reject(new Error(`Got non ok response while posting chat message. Body -> ${bodyString}`));
    } else {
      resolve(body);
    }
  });
});


const checkStatus = url => new Promise((resolve, reject) => {
  request.get({ url }, (err, res, body) => {
    if (err) reject(err);
    const parsed = JSON.parse(body);
    const { status = 'UP', service_name, component_status } = parsed;
    resolve({
      status,
      service_name,
      component_status,
      url,
    });
  });
});
// Check IAM Status
const checkIAM = async () => {
  const iamUrls = [
    'https://dev-tie-iam.mldev.cloud/status',
    'https://dev-achieve-iam.mldev.cloud/status',
    'https://int-achieve-iam.mldev.cloud/status',
    'https://services-live.macmillantech.com/status',
    'https://dev-tie-courseware.mldev.cloud/status',
    'https://dev-achieve-courseware.mldev.cloud/status',
    'https://int-achieve-courseware.mldev.cloud/status',
    'https://dev-achieve-plat.mldev.cloud/status',
    'https://int-achieve-plat.mldev.cloud/status',
  ];
  const promises = await iamUrls.map(async url => checkStatus(url));
  const allPromises = await Promise.all(promises);
  return allPromises;
};

// Router
const router = new express.Router();


router.get('/', (req, res) => res.status(200).send('TIE ROBOT'));

router.get('/status', (req, res) => res.status(200).send('okay'));

router.post('/slack/command/deploy', async (req, res) => {
  const { body: { text } } = req;
  const split = text.split('-');
  const [env, stack, service] = split;
  const rootUrl = `http://jenkins.mldev.cloud/job/TIE/job/${service}%20deploy/`;
  const buildUrl = `${rootUrl}build?delay=300sec`;
  try {
    const slackReqObj = req.body;
    const response = {
      response_type: 'ephemeral',
      channel: slackReqObj.channel_id,
      text: `Deploy ${env}-${stack}-${service} :toaster:`,
      attachments: [{
        text: `Deploy ${env}-${stack}-${service} in 5 minutes`,
        fallback: `Deploy ${env}-${stack}-${service}`,
        title_link: buildUrl,
        color: '#2c963f',
        attachment_type: 'default',
        callback_id: 'deploy_msg',
        actions: [
          {
            name: 'build',
            text: 'Open Build Link',
            type: 'button',
            value: 'build',
            url: buildUrl,
          },
          {
            name: 'announce',
            text: 'Announce Build',
            style: 'primary',
            type: 'button',
            value: JSON.stringify({
              env,
              stack,
              service,
              url: rootUrl,
            }),
          },
        ],
      }],
    };
    return res.json(response);
  } catch (err) {
    log.error(err);
    return res.status(500).send('Something blew up. We\'re looking into it.');
  }
});

router.post('/slack/command/iam-status', async (req, res) => {
  const iam = await checkIAM();
  const messageText = iam.map(({ status, url }) => `${status === 'UP' ? ':green:' : ':red:'} *${getSubdomain(url)}* is ${status}`).join('\n');
  try {
    const slackReqObj = req.body;
    const response = {
      response_type: 'in_channel',
      channel: slackReqObj.channel_id,
      text: '*Stack Status* :linuxterm:',
      attachments: [{
        text: messageText,
        fallback: messageText,
        color: '#2c963f',
        attachment_type: 'default',
      }],
    };
    return res.json(response);
  } catch (err) {
    log.error(err);
    return res.status(500).send('Something blew up. We\'re looking into it.');
  }
});

router.post('/slack/actions', async (req, res) => {
  try {
    const slackReqObj = JSON.parse(req.body.payload);
    const { channel } = slackReqObj;
    const { actions: [action] } = slackReqObj;
    const {
      env,
      stack,
      service,
      url,
    } = JSON.parse(action.value);
    let response;
    if (slackReqObj.callback_id === 'deploy_msg') {
      response = {
        response_type: 'in_channel',
        channel: channel.id,
        text: `Announcing ${env}-${stack}-${service}`,
      };
    }

    const message = {
      responseUrl: slackReqObj.response_url,
      replaceOriginal: false,
      text: `*TIE Deploy Notification* :deathstar: *${env}-${stack}-${service}*`,
      attachments: [{
        text: `*${env}-${stack}-${service}* will build and deploy in 5 minutes\n${url}`,
        fallback: `*${env}-${stack}-${service}* will build and deploy in 5 minutes\n${url}`,
        color: '#2c963f',
        attachment_type: 'default',
      }],
    };
    postChatMessage(message);
    return res.json(response);
  } catch (err) {
    log.error(err);
    return res.status(500).send('Something blew up. We\'re looking into it.');
  }
});

export default router;
