import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { DocumentProvider } from './contexts/DocumentContext';
import './styles.css';

const theme = createTheme({
  // You can customize the theme here
});

// Create a style element to remove any default margins and padding
const style = document.createElement('style');
style.textContent = `
  html, body, #root {
    margin: 0;
    padding: 0;
    height: 100%;
    width: 100%;
    overflow: hidden;
  }
`;
document.head.appendChild(style);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <DocumentProvider>
        <App />
      </DocumentProvider>
    </ThemeProvider>
  </React.StrictMode>
);
