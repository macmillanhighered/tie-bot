import React from 'react';
import styled from 'styled-components';

import Dashboard from './components/dashboard';
import DateTime from './components/widgets/datetime';
import Jenkins from './components/widgets/jenkins';
import Widget from './components/widget';
import StackStatus from './components/widgets/StackStatus';
import PageSpeedInsightsStats from './components/widgets/pagespeed-insights/stats';
import darkTheme from './styles/dark-theme';

const Wrap = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #f8f8ff;
  font-family: 'Roboto', sans-serif;
  main {
    height: 100%;
    min-height: 100%;
  }
  img.icon {
    border-radius: 50%;
    width: 128px;
    height: 128px;
  }
`;

const jenkCfg = {
  url: 'http://jenkins.mldev.cloud/job/TIE',
  authKey: 'jenkinsAuth',
  title: 'Jenkins TIE',
  jobs: [
    { label: 'IAM', path: 'iam deploy' },
    { label: 'Plat', path: 'plat deploy' },
    { label: 'Lof', path: 'lof deploy' },
  ],
};

const App = () => (
  <Wrap>
    <Dashboard theme={darkTheme}>
      <Widget title="TIE-bot">
        <img className="icon" alt="TIE-bot" src="/static/tie-bot-icon.png" />
        <br /><small>v1.0.1</small>
      </Widget>
      <Jenkins {...jenkCfg} />
      <StackStatus />
      <DateTime />
      <Widget title="AustinCam">
        <img style={{ maxWidth: '100%' }} alt="Austin Cam" src="https://media.kxan.com/nxs-kxantv-media-us-east-1/weather/wxcams/KXAN07.jpg" />
      </Widget>
      <PageSpeedInsightsStats title="dev-tie-iam" url="https://dev-tie-iam.mldev.cloud" />
    </Dashboard>
  </Wrap>
);

export default App;
