import React, { Component } from 'react';
import styled from 'styled-components';

const Wrap = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #f8f8ff;
  font-family: 'Roboto', sans-serif;
  img {
    border-radius: 50%;
    width: 128px;
    height: 128px;
  }
`;

export default class App extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <Wrap>
        <img src="/static/tie-bot-icon.png" />
        <h2>TIE-bot</h2>
      </Wrap>
    );
  }
}
