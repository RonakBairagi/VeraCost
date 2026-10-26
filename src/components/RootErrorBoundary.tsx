import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class RootErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[VeraCost Error Boundary Caught]', error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.removeItem('veracost_active_project');
    } catch {}
    window.location.reload();
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#030712',
          color: '#f9fafb',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          padding: '24px',
          boxSizing: 'border-box',
        }}>
          <div style={{
            maxWidth: '540px',
            width: '100%',
            background: 'rgba(17, 24, 39, 0.95)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            textAlign: 'center',
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              color: '#ef4444',
            }}>
              <AlertCircle size={32} />
            </div>

            <h1 style={{ fontSize: '22px', fontWeight: '700', margin: '0 0 10px', color: '#fff' }}>
              VeraCost Encountered an Issue
            </h1>
            <p style={{ fontSize: '14px', color: '#9ca3af', lineHeight: 1.6, margin: '0 0 24px' }}>
              A client runtime issue occurred. Your data can be preserved or safely restored. Click below to reload.
            </p>

            {this.state.error && (
              <div style={{
                background: 'rgba(0, 0, 0, 0.4)',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '12px',
                color: '#f87171',
                textAlign: 'left',
                overflowX: 'auto',
                marginBottom: '24px',
                fontFamily: 'monospace',
                border: '1px solid rgba(239, 68, 68, 0.15)',
              }}>
                {this.state.error.message || 'Unknown error'}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={this.handleReload}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#3b82f6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '10px 20px',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                <RefreshCw size={16} /> Reload Application
              </button>
              <button
                onClick={this.handleReset}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  color: '#d1d5db',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '10px',
                  padding: '10px 16px',
                  fontWeight: '500',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                <Home size={16} /> Reset State
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
