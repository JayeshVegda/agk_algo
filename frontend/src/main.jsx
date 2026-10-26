import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

// Surface async / uncaught errors too — anything that used to die silently.
window.addEventListener('error', (e) => {
  if (import.meta.env.DEV) console.error('[akg] window error:', e.message, e.filename, e.lineno);
  window.__akgLastError = `${e.message} @ ${e.filename}:${e.lineno}`;
});
window.addEventListener('unhandledrejection', (e) => {
  if (import.meta.env.DEV) console.error('[akg] unhandled rejection:', e.reason);
  window.__akgLastError = `rejection: ${e.reason}`;
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
