import React, { Component } from 'react';
import PropTypes from 'prop-types';
import fetch from 'isomorphic-unfetch';
import styled from 'styled-components';

import Widget from '../widget';

const getSubdomain = url => url.match(/(?:http[s]*:\/\/)*(.*?)\.(?=[^/]*\..{2,5})/i)[1];

const StackWrap = styled.div`
  a {
    color: #f8f8ff;
  }
  ul {
    list-style: none;
    display: table;

    -webkit-margin-before: 0;
    -webkit-margin-after: 0;
    -webkit-margin-start: 0px;
    -webkit-margin-end: 0px;
    -webkit-padding-start: 0px;
    li {
      display: flex;
      flex-direction: row;
    }
  }
`;

export default class StackStatus extends Component {
  static propTypes = {
    interval: PropTypes.number,
  }
  static defaultProps = {
    interval: 1000 * 30,
  }
  constructor(props) {
    super(props);
    this.state = {
      stacks: [],
    };
  }
  componentDidMount() {
    const { interval } = this.props;
    this.timeout = setTimeout(() => this.getAllStacks(), interval);
    this.getAllStacks();
  }

  componentWillUnmount() {
    clearTimeout(this.timeout);
  }

  getAllStacks = async () => {
    const all = await fetch('/reports/stack').then(r => r.json());
    console.log(':: Got All Stacks');
    this.setState({ stacks: all });
  }

  render() {
    const { stacks } = this.state;
    return (
      <Widget>
        <StackWrap>
          <ul>
            {
              stacks.map(({ status, service_name, url }) => (
                <li key={url}>
                  <span>{status === 'UP' ? '💚' : '💔'}</span>
                  <span>
                    <a alt={service_name} target="_new" href={url}>{getSubdomain(url)}</a>
                  </span>
                </li>
              ))
            }
          </ul>
        </StackWrap>
      </Widget>
    );
  }
}
