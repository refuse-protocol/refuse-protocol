// Error Handling and Graceful Degradation Utilities
// Provides robust error handling for production environments
import React from 'react'
import PropTypes from 'prop-types'
import { logger } from './logger.js'

export class ErrorHandler {
  static handleError(error, errorInfo = {}) {
    logger.error('Application Error', {
      error: error.message,
      stack: error.stack,
      ...errorInfo
    }, error)

    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      this.logErrorToService(error, errorInfo)
    }

    // Return user-friendly error message
    return this.getUserFriendlyMessage(error)
  }

  static logErrorToService(error, errorInfo) {
    // In production, you would send this to services like Sentry, LogRocket, etc.
    const errorData = {
      message: error.message || error.toString(),
      stack: error.stack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      ...errorInfo
    }

    // Example: Send to console for now (replace with actual service)
    logger.info('Error logged to service', errorData)
  }

  static getUserFriendlyMessage(error) {
    // Return user-friendly error messages based on error type
    if (error.name === 'NetworkError' || error.message.includes('fetch')) {
      return 'Unable to connect to the server. Please check your internet connection and try again.'
    }

    if (error.name === 'TypeError') {
      return 'An unexpected error occurred. Please refresh the page and try again.'
    }

    if (error.message.includes('ChunkLoadError')) {
      return 'The application is updating. Please refresh the page.'
    }

    // Default message
    return 'Something went wrong. Please try again or contact support if the problem persists.'
  }
}

// React Error Boundary Component
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(_error) {
    return { hasError: true }
  }

  componentDidCatch(error, _errorInfo) {
    this.setState({
      error: error,
      errorInfo: _errorInfo
    })

    ErrorHandler.handleError(error, {
      componentStack: _errorInfo.componentStack,
      errorBoundary: true
    })
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
              <div className="text-center">
                <div className="mx-auto h-12 w-12 text-red-500">
                  <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h1 className="mt-4 text-xl font-semibold text-gray-900">
                  Oops! Something went wrong
                </h1>
                <p className="mt-2 text-sm text-gray-600">
                  {ErrorHandler.getUserFriendlyMessage(this.state.error)}
                </p>
                <div className="mt-6">
                  <button
                    onClick={this.handleRetry}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => window.location.href = '/'}
                    className="w-full flex justify-center py-2 px-4 mt-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Go Home
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired
}

// Network status monitoring
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine)

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}

// Graceful degradation utilities
export const GracefulDegradation = {
  // Disable features that might not work in older browsers
  checkBrowserSupport() {
    const features = {
      fetch: typeof fetch !== 'undefined',
      promises: typeof Promise !== 'undefined',
      intersectionObserver: typeof IntersectionObserver !== 'undefined',
      webp: this.supportsImageFormat('webp'),
      avif: this.supportsImageFormat('avif'),
    }

    return features
  },

  // Check if browser supports specific image formats
  supportsImageFormat(format) {
    const canvas = document.createElement('canvas')
    return canvas.toDataURL(`image/${format}`).indexOf(`data:image/${format}`) === 0
  },

  // Provide fallbacks for unsupported features
  getImageFallback(src, fallbackSrc) {
    const supportedFormats = this.checkBrowserSupport()

    if (supportedFormats.webp && src.endsWith('.webp')) {
      return src
    } else if (supportedFormats.avif && src.endsWith('.avif')) {
      return src
    }

    return fallbackSrc || src.replace(/\.(webp|avif)$/, '.png')
  },

  // Lazy loading fallback for older browsers
  lazyLoadImage(imgElement, src) {
    const supportedFormats = this.checkBrowserSupport()

    if (supportedFormats.intersectionObserver) {
      // Use modern IntersectionObserver
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.src = src
            observer.unobserve(entry.target)
          }
        })
      })
      observer.observe(imgElement)
    } else {
      // Fallback for older browsers
      imgElement.src = src
    }
  }
}

// Export React import for JSX in ErrorBoundary
