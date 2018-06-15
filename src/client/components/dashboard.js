import React from 'react';
import styled, { injectGlobal, ThemeProvider } from 'styled-components';
import { normalize } from 'polished';

injectGlobal`
  ${normalize()}

  html {
    font-family: 'Roboto', sans-serif;
  }
`;

const Container = styled.main`
  align-items: center;
  background-color: ${props => props.theme.palette.backgroundColor};
  color: ${props => props.theme.palette.textColor};
  display: flex;
  flex-flow: row wrap;
  justify-content: center;
  min-height: 100%;
  padding: 1em;
`;

export default ({ children, theme }) => (
  <ThemeProvider theme={theme}>
    <Container>
      {children}
    </Container>
  </ThemeProvider>
);
