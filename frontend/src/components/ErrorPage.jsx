import React from 'react'

function ErrorPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="card">
          <div className="card-header text-center">
            <div className="mx-auto h-12 w-12 text-refuse-orange">
              <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="mt-4 text-2xl font-bold text-gray-900">
              Service Temporarily Unavailable
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              We&apos;re currently updating our site to serve you better. Please check back soon.
            </p>
            <div className="mt-6">
              <a href="/" className="btn">
                Return Home
              </a>
            </div>
            <div className="mt-4 text-xs text-gray-500">
              If you continue to experience issues, please contact our support team.
            </div>
          </div>
        </div>
      </div>

      {/* Additional help information */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-medium text-gray-900">Need immediate assistance?</h2>
            <div className="mt-4 space-y-3">
              <div className="flex items-center text-sm text-gray-600">
                <svg className="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                support@refuse-protocol.org
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <svg className="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Check our status page for updates
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ErrorPage
