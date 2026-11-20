import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

// Surface async / uncaught errors too - anything that used to die silently.
window.addEventListener('error', (e) => {
  if (import.meta.env.DEV) console.error('[akg] window error:', e.message, e.filename, e.lineno);
  window.__akgLastError = `${e.message} @ ${e.filename}:${e.lineno}`;
});
window.addEventListener('unhandledrejection', (e) => {
  if (import.meta.env.DEV) console.error('[akg] unhandled rejection:', e.reason);
  window.__akgLastError = `rejection: ${e.reason}`;
});

function renderApp() {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
}

// Keep the pre-rendered introduction visible until the first route can render.
const path = window.location.pathname.replace(/\/+$/, '') || '/';
const entry = path === '/bots' ? import('./components/BotsTab')
  : path === '/pricing' ? import('./components/PricingTab')
  : null;
if (entry) entry.then(renderApp, renderApp);
else renderApp();
