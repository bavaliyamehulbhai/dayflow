import React from 'react';

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        console.error('[ErrorBoundary] Caught error:', error, info);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.href = '/';
    };

    render() {
        if (!this.state.hasError) return this.props.children;

        return (
            <div className="error-boundary-page">
                <div className="error-boundary-card">
                    <div className="error-boundary-icon">⚡</div>
                    <h1 className="error-boundary-title">Something went wrong</h1>
                    <p className="error-boundary-desc">
                        An unexpected error occurred. Your data is safe — this is a display issue only.
                    </p>
                    {process.env.NODE_ENV === 'development' && this.state.error && (
                        <pre className="error-boundary-detail">
                            {this.state.error.toString()}
                        </pre>
                    )}
                    <button className="btn btn-primary" onClick={this.handleReset} style={{ marginTop: 24 }}>
                        ↩ Back to Dashboard
                    </button>
                </div>
                <style>{`
          .error-boundary-page {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--bg);
            padding: 20px;
          }
          .error-boundary-card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 20px;
            padding: 48px 40px;
            max-width: 480px;
            width: 100%;
            text-align: center;
            animation: scaleIn 0.3s ease;
            box-shadow: 0 0 80px rgba(255, 107, 107, 0.06);
          }
          .error-boundary-icon {
            font-size: 48px;
            margin-bottom: 20px;
            filter: grayscale(0.3);
          }
          .error-boundary-title {
            font-family: 'Syne', sans-serif;
            font-size: 24px;
            font-weight: 800;
            color: var(--text);
            margin-bottom: 12px;
          }
          .error-boundary-desc {
            font-size: 14px;
            color: var(--muted);
            line-height: 1.6;
          }
          .error-boundary-detail {
            background: var(--surface2);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 12px;
            margin-top: 16px;
            font-size: 11px;
            color: var(--red);
            text-align: left;
            overflow: auto;
            max-height: 120px;
          }
        `}</style>
            </div>
        );
    }
}
