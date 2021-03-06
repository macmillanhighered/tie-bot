import React, { Component } from 'react';
import PropTypes from 'prop-types';
import tinytime from 'tinytime';
import styled from 'styled-components';

import Widget from '../../widget';

const TimeItem = styled.div`
  font-size: 4em;
  text-align: center;
`;

const DateItem = styled.div`
  font-size: 1.5em;
  text-align: center;
`;

export default class DateTime extends Component {
  static propTypes = {
    interval: PropTypes.number,
  }
  static defaultProps = {
    interval: 1000 * 10,
  }

  state = {
    date: new Date(),
  }

  componentDidMount() {
    const { interval } = this.props;
    this.timeout = setTimeout(() => this.setState({ date: new Date() }), interval);
  }

  componentWillUnmount() {
    clearTimeout(this.timeout);
  }

  render() {
    const { date } = this.state;
    return (
      <Widget>
        <TimeItem>{tinytime('{h}:{mm} {a}').render(date)}</TimeItem>
        <DateItem>{tinytime('{Mo}.{DD}.{YYYY}').render(date)}</DateItem>
      </Widget>
    );
  }
}
