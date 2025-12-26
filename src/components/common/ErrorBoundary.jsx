import React from 'react';
import { AlertOctagon } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    height: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f8fafc',
                    color: '#1e293b',
                    fontFamily: 'Inter, sans-serif'
                }}>
                    <AlertOctagon size={48} color="#ef4444" style={{ marginBottom: '24px' }} />
                    <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '12px' }}>Something went wrong</h1>
                    <p style={{ color: '#64748b', marginBottom: '24px' }}>
                        We're sorry, but the application encountered an unexpected error.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            padding: '10px 24px',
                            backgroundColor: '#2563eb',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500'
                        }}
                    >
                        Reload Application
                    </button>
                    {process.env.NODE_ENV === 'development' && (
                        <pre style={{
                            marginTop: '40px',
                            padding: '20px',
                            backgroundColor: '#e2e8f0',
                            borderRadius: '8px',
                            maxWidth: '800px',
                            overflow: 'auto',
                            fontSize: '12px'
                        }}>
                            {this.state.error && this.state.error.toString()}
                        </pre>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
