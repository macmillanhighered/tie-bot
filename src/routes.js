/* eslint-disable camelcase */
import express from 'express';
import request from 'request';
import React from 'react';
import Chance from 'chance';
import ReactDOMServer from 'react-dom/server';
import github from 'octonode';

import Html from './Html';
import { log } from './index';

const { version } = '../package.json';

const getSubdomain = url => url.match(/(?:http[s]*:\/\/)*(.*?)\.(?=[^/]*\..{2,5})/i)[1];
const chance = new Chance();

const buildDelay = 10;
const slackmoji = [
  ':yodawg:',
  ':sea_otter:',
  ':easy:',
  ':ewok:',
  ':doge:',
  ':badass:',
  ':crossed_fingers:',
  ':c3po:',
  ':pink-unicorn:',
  ':gir2:',
  ':linuxterm:',
  ':porg:',
  ':r2d2:',
  ':jenkins:',
  ':zorak:',
];

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
    try {
      const parsed = JSON.parse(body) || {};
      const { status = 'UP', service_name, component_status } = parsed;
      resolve({
        status,
        service_name,
        component_status,
        url,
      });
    } catch (error) {
      console.error('error', error);
      resolve({
        status: 'DOWN',
        error,
        service_name: url,
        url,
      });
    }
  });
});
// const triggerBuild = url => new Promise((resolve, reject) => {
//   console.log('url', url);
//   request.post({ url }, (err, response) => {
//     if (err) reject(err);
//     resolve(response);
//   });
// });
// Check IAM Status
const checkIAM = async () => {
  const iamUrls = [
    'https://prod-green-iam.prod-mml.cloud/status',
    'https://prod-green-courseware.prod-mml.cloud/status',
    'https://prod-green-plat.prod-mml.cloud/status',
    'https://prod-green-reading.prod-mml.cloud/status',
    'https://services-live.macmillantech.com/status',
    'https://int-achieve-iam.mldev.cloud/status',
    'https://int-achieve-plat.mldev.cloud/status',
    'https://int-achieve-courseware.mldev.cloud/status',
    'https://dev-achieve-courseware.mldev.cloud/status',
    'https://dev-achieve-iam.mldev.cloud/status',
    'https://dev-achieve-plat.mldev.cloud/status',
    'https://dev-tie-iam.mldev.cloud/status',
    'https://dev-tie-plat.mldev.cloud/status',
    'https://dev-tie-courseware.mldev.cloud/status',
  ];
  const promises = await iamUrls.map(async url => checkStatus(url));
  const allPromises = await Promise.all(promises);
  return allPromises;
};

// Router
const router = new express.Router();

router.get('/status', (req, res) => res.status(200).send('okay'));

router.get('/github/:repo', (req, res) => {
  const { repo } = req.params;
  const ghclient = github.client(process.env.GITHUB_TOKEN);
  ghclient.get(`/repos/macmillanhighered/${repo}/pulls`, {}, (err, status, body) => {
    if (err) console.error('err', err);
    res.status(status).send(JSON.stringify(body, null, 2));
  });
});

router.get('/github/prs', async (req, res) => {
  const ghclient = github.client(process.env.GITHUB_TOKEN);
  ghclient.get('/repos/macmillanhighered/ml-iam/pulls', {}, async (err, status, iam) => {
    await ghclient.get('/repos/macmillanhighered/plat-services/pulls', {}, (perr, stat, plat) => {
      if (err) console.error('err', err);
      res.status(status).send({ iam, plat });
    });
  });
});

router.post('/slack/command/gh/pulls', async (req, res) => {
  const { body: { text } } = req;
  try {
    const ghclient = github.client(process.env.GITHUB_TOKEN);
    return ghclient.get(`/repos/macmillanhighered/${text}/pulls`, {}, (err, status, prarray) => {
      if (err) console.error('err', err);
      const messageString = prarray.map(({
        title,
        url,
        requested_reviewers,
      }) => {
        const reviewersString = requested_reviewers.map(({ login }) => `*${login}*`).join(', ');
        const prString = `${title}: ${reviewersString}\n${url}`;
        return prString;
      }).join('\n');
      // res.status(status).send(prarray);
      const slackReqObj = req.body;
      const response = {
        response_type: 'in_channel',
        channel: slackReqObj.channel_id,
        text: `:octocat: *Open ${text} PRs*`,
        attachments: [{
          text: messageString,
          fallback: messageString,
          mrkdwn_in: ['text'],
          color: '#2c963f',
          attachment_type: 'default',
        }],
      };
      return res.json(response);
    });
  } catch (err) {
    log.error(err);
    return res.status(500).send('Something blew up. We\'re looking into it.');
  }
});

router.get('/jenkins/build/:arg', (req, res) => {
  const { params: { arg } } = req;
  const split = arg.split('-');
  const [, stack, service] = split;

  const rootUrl = `http://jenkins.mldev.cloud/job/TIE/job/${service}%20deploy/`;
  const buildUrl = `${rootUrl}buildWithParameters?delay=300sec&ENV_NAME=${stack}&BRANCH=master`;
  // const buildResult = await triggerBuild(buildUrl);
  // console.log('buildResult', env, buildResult);
  res.redirect(buildUrl);
});

router.post('/slack/command/deploy', async (req, res) => {
  const { body: { text } } = req;
  const branch = text.split(':')[1] || null;
  const split = text.split(':')[0].split('-');
  const [env, stack, service] = split;
  let rootUrl = `http://jenkins.mldev.cloud/job/TIE/job/${service}%20deploy/`;
  if (!['plat', 'iam', 'courseware'].includes(stack)) {
    rootUrl = 'http://jenkins.mldev.cloud/job/SRE/job/Unified_Deploy_Pipeline/';
  }
  const buildUrl = `${rootUrl}build?delay=${buildDelay}sec`;
  // it is potentially possible to pass the build params and
  // start the build automagically but requires a post command
  // `${rootUrl}buildWithParameters?delay=300sec&ENV_NAME=${stack}&BRANCH=${branch}`;
  try {
    const slackReqObj = req.body;
    const response = {
      response_type: 'ephemeral',
      channel: slackReqObj.channel_id,
      text: `Deploy *${env}-${stack}-${service}*${branch ? ` from branch _${branch}_` : ''} :toaster:`,
      attachments: [{
        text: `Deploy ${env}-${stack}-${service} in ${buildDelay} minutes`,
        fallback: `Deploy ${env}-${stack}-${service}`,
        title_link: buildUrl,
        color: '#2c963f',
        attachment_type: 'default',
        callback_id: 'deploy_msg',
        actions: [
          {
            name: 'build',
            text: 'Open Deploy Link',
            type: 'button',
            value: 'build',
            url: buildUrl,
          },
          {
            name: 'announce',
            text: 'Announce Deploy',
            style: 'primary',
            type: 'button',
            value: JSON.stringify({
              env,
              stack,
              service,
              branch,
              user_id: slackReqObj.user_id,
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

router.get('/reports/stack', async (req, res) => {
  const data = await checkIAM();
  res.json(data);
});

router.post('/slack/command/iam-status', async (req, res) => {
  const iam = await checkIAM();
  const messageText = iam.map(({ status, url }) => `${status === 'UP' ? ':green:' : ':broken_heart:'} *${getSubdomain(url)}* is ${status}${status !== 'UP' ? `\n${url}` : ''}`).join('\n');
  try {
    const slackReqObj = req.body;
    const response = {
      response_type: 'in_channel',
      channel: slackReqObj.channel_id,
      text: ':linuxterm: *Stack Status*',
      attachments: [{
        text: messageText,
        fallback: messageText,
        mrkdwn_in: ['text'],
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
      branch,
      user_id,
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
      text: `*TIE-bot Deploy Notification* ${chance.pick(slackmoji)} *${env}-${stack}-${service}*${branch ? ` from branch _${branch}_` : ''} [started by <@${user_id}>]`,
      attachments: [{
        text: `*${env}-${stack}-${service}* will build and deploy in ${buildDelay} minutes\n${url}`,
        fallback: `*${env}-${stack}-${service}* will build and deploy in ${buildDelay} minutes\n${url}`,
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


router.post('/slack/command/bot', async (req, res) => {
  const { body: { text } } = req;
  console.log('text', text);
  let helpText = '*/tie-deploy [env]-[stack]-[service]:[branch]* - e.g. `/tie-deploy int-achieve-iam:master`\n';
  helpText += 'Displays links to delayed build and automated announcement message. *NOTE: Does not start the build for you*\n';
  helpText += '*/stack-status* - Display list of Achieve server status';
  try {
    const slackReqObj = req.body;
    const response = {
      response_type: 'ephemeral',
      channel: slackReqObj.channel_id,
      text: `TIE-bot Help :: v${version}`,
      attachments: [{
        text: helpText,
        mrkdwn: true,
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


// client

export const pages = {
  '/': 'TIE-bot',
};

const pagesArray = Object.keys(pages);

router.get(pagesArray, async (req, res) => {
  const htmlProps = {
    title: pages[req.path] || '404',
    bundleUrl: '/static/bundle.js',
  };
  res.send(ReactDOMServer.renderToStaticMarkup(<Html {...htmlProps} />));
});

export default router;
