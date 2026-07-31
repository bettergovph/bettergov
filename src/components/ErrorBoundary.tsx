import { Component, ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className='min-h-screen flex items-center justify-center bg-gray-50'>
          <div className='text-center p-8'>
            <h1 className='text-2xl font-bold text-gray-900 mb-4'>
              Something went wrong
            </h1>
            <p className='text-gray-600 mb-6'>
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <Link
              to='/'
              className='inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700'
              onClick={() => this.setState({ hasError: false })}
            >
              Go to Homepage
            </Link>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
