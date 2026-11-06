import React from 'react';

/* Global crash guard: renders a visible retry card instead of a blank
   screen when rendering or a window-level error kills the tree. */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) console.error('[akg] render crash:', error, info);
    this.props.onCrash?.(error);
  }

  handleReset = () => {
    this.setState({ error: null });
    window.location.replace(`${window.location.pathname}${window.location.search}`);
  };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-akg-bg px-6 text-center font-sans text-akg-text">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/30">
          <svg viewBox="0 0 24 24" className="h-6 w-6 text-akg-accent" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="font-display text-xl font-bold text-akg-text">The terminal lost connection to this session</h1>
        <p className="max-w-[44ch] text-sm leading-relaxed text-akg-muted">
          Your account data is safe on the server. Reload the page to restore the desk.
        </p>
        <button
          onClick={this.handleReset}
          className="mt-1 rounded-lg bg-akg-cta px-6 py-2.5 text-sm font-semibold text-akg-cta-text transition-opacity hover:opacity-90 cursor-pointer shadow-sm"
        >
          Reload the desk
        </button>
        <p className="max-w-[60ch] font-mono text-[10px] leading-relaxed text-akg-muted/70">
          If it keeps happening, copy everything below and send it to desk@akgalgo.in
        </p>
        <pre className="max-w-[80vw] overflow-auto rounded-lg border border-akg-hairline bg-akg-raised px-4 py-3 text-left font-mono text-[10px] text-akg-muted">
          {String(this.state.error?.message || this.state.error)}
          {'\n\n'}
          {String(this.state.error?.stack || '').split('\n').slice(0, 6).join('\n')}
        </pre>
      </div>
    );
  }
}
