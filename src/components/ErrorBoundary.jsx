import React, { Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '80vh', padding: '20px',
          color: '#94a3b8', textAlign: 'center', gap: '16px'
        }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#d4a44a" strokeWidth="1.5" width="48" height="48">
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
          </svg>
          <h2 style={{ color: '#f1f5f9', fontSize: '1.2rem' }}>Something went wrong</h2>
          <p style={{ fontSize: '0.9rem' }}>An unexpected error occurred. Please refresh the page.</p>
          <button
            onClick={() => { this.setState({ hasError: false }); window.location.hash = '#/'; window.location.reload() }}
            style={{
              marginTop: '8px', padding: '12px 28px',
              background: 'linear-gradient(135deg, #d4a44a, #a07830)',
              color: '#000', borderRadius: '10px', fontWeight: 700,
              border: 'none', cursor: 'pointer', fontSize: '0.9rem'
            }}
          >
            Reload App
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
