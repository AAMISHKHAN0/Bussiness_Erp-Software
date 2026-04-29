import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ errorInfo });
        console.error('[ErrorBoundary] Caught rendering error:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-[400px] flex flex-col items-center justify-center p-8">
                    <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center space-y-4">
                        <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto">
                            <AlertTriangle size={28} />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Something went wrong</h2>
                        <p className="text-sm text-gray-500">
                            An unexpected error occurred while rendering this page. This has been logged for investigation.
                        </p>
                        {this.state.error && (
                            <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-left">
                                <p className="text-xs text-red-600 font-mono break-all">
                                    {this.state.error.toString()}
                                </p>
                            </div>
                        )}
                        <div className="flex gap-3 justify-center pt-2">
                            <button
                                onClick={this.handleReset}
                                className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors flex items-center gap-2"
                            >
                                <RefreshCw size={14} />
                                Try Again
                            </button>
                            <button
                                onClick={() => window.location.href = '/dashboard'}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                            >
                                Go to Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
