import React from 'react';
import PropTypes from 'prop-types';

const Html = props => (
  <html
    lang="en"
    style={{
      margin: 0,
      padding: 0,
      minHeight: '100%',
      height: '100%',
    }}
  >
    <head>
      <title>{props.title}</title>
      <link rel="icon" href="static/favicon.ico" />
      <link href="https://fonts.googleapis.com/css?family=Roboto" rel="stylesheet" />
    </head>
    <body style={{ margin: 0, padding: 0, height: '100%' }}>
      <div id="app" style={{ margin: 0, padding: 0, height: '100%' }} />
      <script src={props.bundleUrl} />
    </body>
  </html>
);

Html.propTypes = {
  bundleUrl: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
};

export default Html;
