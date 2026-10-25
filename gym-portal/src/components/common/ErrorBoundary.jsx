import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary captured error:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.hash = '#/';
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#F8F8F6',
          padding: '24px',
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
        }}>
          <div style={{
            maxWidth: '480px',
            width: '100%',
            background: '#FFFFFF',
            border: '1px solid #E8E5DC',
            borderRadius: '16px',
            padding: '32px',
            textAlign: 'center',
            boxShadow: '0 8px 30px rgba(0,0,0,0.06)'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              background: '#FAF6ED',
              color: '#A67C00',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto',
              fontSize: '1.6rem'
            }}>
              ⚠️
            </div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#242424', margin: '0 0 8px 0' }}>
              Gym Portal Notice
            </h2>
            <p style={{ fontSize: '0.86rem', color: '#707070', margin: '0 0 24px 0', lineHeight: 1.5 }}>
              A temporary display error occurred while rendering this page. Your account and records are safe.
            </p>
            {this.state.error?.message && (
              <div style={{
                padding: '10px 14px',
                borderRadius: '8px',
                background: '#FEEBEA',
                border: '1px solid #FFA39E',
                color: '#CF1322',
                fontSize: '0.78rem',
                marginBottom: '24px',
                wordBreak: 'break-word',
                textAlign: 'left'
              }}>
                <strong>Details:</strong> {this.state.error.message}
              </div>
            )}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  background: '#C9A227',
                  color: '#FFFFFF',
                  fontWeight: '700',
                  fontSize: '0.86rem',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Reload Dashboard
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  background: '#FFFFFF',
                  color: '#242424',
                  fontWeight: '600',
                  fontSize: '0.86rem',
                  border: '1px solid #E8E5DC',
                  cursor: 'pointer'
                }}
              >
                Go to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
