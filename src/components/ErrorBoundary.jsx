import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReload = () => window.location.reload();

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
          <div className="max-w-md w-full text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}>
              <span className="text-3xl">⚠️</span>
            </div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Nimadir xato ketdi
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Iltimos, sahifani qayta yuklang. Muammo davom etsa administratorga ayting.
            </p>
            {import.meta.env.DEV && this.state.error && (
              <pre className="text-xs text-left p-3 rounded-lg overflow-auto max-h-40" style={{ backgroundColor: 'var(--bg-tertiary)', color: '#EF4444' }}>
                {this.state.error.toString()}
              </pre>
            )}
            <button
              onClick={this.handleReload}
              className="px-6 py-2.5 rounded-xl text-white font-medium"
              style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}
            >
              Sahifani qayta yuklash
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
