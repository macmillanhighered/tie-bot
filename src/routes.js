/* eslint-disable camelcase */
import express from 'express';
import request from 'request';
import React from 'react';
import Chance from 'chance';
import ReactDOMServer from 'react-dom/server';
import github from 'octonode';
import moment from 'moment';

import Html from './Html';
import { log } from './index';
import { filterStackArray, stackUrlHash } from './utils';

const { version: packageVersion } = './package.json';

const getSubdomain = url => url.match(/(?:http[s]*:\/\/)*(.*?)\.(?=[^/]*\..{2,5})/i)[1];
const chance = new Chance();

const buildDelay = 10;
const slackmoji = {
  ':yodawg:': 1,
  ':sea_otter:': 1,
  ':easy:': 1,
  ':ewok:': 1,
  ':doge:': 1,
  ':badass:': 1,
  ':crossed_fingers:': 1,
  ':c3po:': 1,
  ':pink-unicorn:': 1,
  ':gir2:': 1,
  ':linuxterm:': 1,
  ':porg:': 1,
  ':r2d2:': 1,
  ':jenkins:': 8,
  ':zorak:': 1,
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
    try {
      const parsed = JSON.parse(body) || {};
      const {
        status = 'UP',
        service_name,
        component_status,
        install_datetime,
        version: serviceVersion,
      } = parsed;
      resolve({
        status,
        service_name,
        component_status,
        url,
        version: serviceVersion || parsed.service_version || parsed.engineering_version || null,
        install_datetime,
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

const checkStack = async (text) => {
  const filteredUrlArray = filterStackArray(Object.values(stackUrlHash), text);
  const statusUrls = filteredUrlArray;
  const promises = await statusUrls.map(async url => checkStatus(url));
  const allPromises = await Promise.all(promises);
  return allPromises;
};

// Router
const router = new express.Router();
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
  const [env, stack, ...serviceSplitArray] = split;
  const service = serviceSplitArray.join('');
  let rootUrl = `http://jenkins.mldev.cloud/job/TIE/job/${service}%20deploy/`;
  if (!['plat', 'iam', 'courseware'].includes(stack)) {
    rootUrl = 'http://jenkins.mldev.cloud/job/SRE_Supported/job/Unified_Deploy_Pipeline/';
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
  try {
    const data = await checkStack();
    res.json(data);
  } catch (e) {
    res.body({error: `unexpected error: ${e}`});
    res.status(500)
  }
});

router.post('/slack/command/iam-status', async (req, res) => {
  try {
    const { body: { text } } = req;
    const iam = await checkStack(text);
    const messageText = iam.map(({
      status,
      url,
      version,
      install_datetime,
    }) => {
      const statusMoji = status === 'UP' ? ':green:' : ':broken_heart:';
      const isUp = `*${getSubdomain(url)}* is ${status}`;
      const thang = `${status !== 'UP' ? `\n${url}` : ''}${version ? ` :: \`${version}\`` : ''}`;
      const deployed = install_datetime ? `[deployed ${moment(install_datetime).fromNow()}]` : '';
      return `${statusMoji} ${isUp}${thang} ${deployed}`;
    }).join('\n');
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

const checkLastDeploy = url => new Promise((resolve, reject) => {
  request.get({ url }, (err, res, body) => {
    if (err) reject(err);
    try {
      const parsed = JSON.parse(body) || {};
      const {
        service_name,
        component_status,
        version: serviceVersion,
        install_datetime,
      } = parsed;
      resolve({
        service_name,
        install_datetime,
        component_status,
        url,
        version: serviceVersion || parsed.service_version || parsed.engineering_version || null,
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

router.post('/slack/days', async (req, res) => {
  try {
    console.log('payload', req.body);
    const {
      text,
      channel_id,
      // channel_name,
      // user_id,
      // user_name,
      service_name,
      response_url,
    } = req.body;

    // const split = text.split('-');
    // const [env, stack, product] = split;
    const statusURL = stackUrlHash[text] || 'https://iam.macmillanlearning.com/status';
    console.log('statusURL', statusURL);
    const { version, install_datetime } = await checkLastDeploy(statusURL);
    const diff = moment(install_datetime).fromNow();
    const response = {
      response_type: 'in_channel',
      channel: channel_id,
      text: `Getting last install for ${text}/${service_name}`,
    };

    const message = {
      responseUrl: response_url,
      replaceOriginal: true,
      text: `*TIE-bot Days Since Deploy* ${chance.weighted(Object.keys(slackmoji), Object.values(slackmoji))}: *${text}* _${version}_ deployed ${diff}`,
    };
    postChatMessage(message);
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
      text: `*TIE-bot Deploy Notification* ${chance.weighted(Object.keys(slackmoji), Object.values(slackmoji))} *${env}-${stack}-${service}*${branch ? ` from branch _${branch}_` : ''} [started by <@${user_id}>]`,
      attachments: [{
        text: `*${env}-${stack}-${service}* will build and deploy within ${buildDelay} minutes\n${url}`,
        fallback: `*${env}-${stack}-${service}* will build and deploy within ${buildDelay} minutes\n${url}`,
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

console.log('BODY', req.body)
  const { body: { text } } = req;
  console.log('TEXT: ', text)
  let helpText = '*/tie-deploy [env]-[stack]-[service]:[branch]*';
  helpText += '\n • e.g. `/tie-deploy int-achieve-iam:master`';
  helpText += '\n • Displays links to delayed build and automated announcement message.';
  helpText += '\n • _NOTE: Does not start the build for you_\n';
  helpText += '*/stack-status* - Display list of Achieve server status';
  helpText += '*/tie-bot help* - This documentation';
  try {
    const slackReqObj = req.body;
    if (text !== '' && text !== 'help') {
      return res.json({
        response_type: 'ephemeral',
        channel: slackReqObj.channel_id,
        mrkdwn: true,
        text: 'TIE-bot :: I didn\'t understand that command. Try `/tie-bot help`',
      });
    }
    return res.json({
      response_type: 'ephemeral',
      channel: slackReqObj.channel_id,
      text: `TIE-bot Help :: v${packageVersion}`,
      attachments: [{
        text: helpText,
        mrkdwn: true,
        color: '#2c963f',
        attachment_type: 'default',
      }],
    });
  } catch (err) {
    log.error(err);
    return res.status(500).send('Something blew up. We\'re looking into it.');
  }
});

export default router;
