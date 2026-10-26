import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { RootErrorBoundary } from './components/RootErrorBoundary';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/print.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </React.StrictMode>
);

