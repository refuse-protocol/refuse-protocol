import React from 'react'
import { Link } from 'react-router-dom'

function Documentation() {
  return (
    <div className="bg-white">
      <div className="section-padding">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
              Documentation
            </h1>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Implementation guides and API reference for software vendors and developers
              building with REFUSE protocol. Join us in creating industry standards.
            </p>
          </div>

          <div className="mt-16">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              {/* API Reference */}
              <div className="card">
                <div className="card-header">
                  <h2 className="text-2xl font-bold text-gray-900">API Reference</h2>
                  <p className="mt-2 text-gray-600">
                    Complete RESTful API documentation for vendors implementing REFUSE protocol
                  </p>
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-900">Core Endpoints</h3>
                    <div className="mt-4 space-y-3">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <code className="text-sm font-mono text-refuse-blue">GET /api/v1/facilities</code>
                        <p className="mt-1 text-sm text-gray-600">Retrieve facility information</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <code className="text-sm font-mono text-refuse-green">POST /api/v1/materials</code>
                        <p className="mt-1 text-sm text-gray-600">Record material processing</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <code className="text-sm font-mono text-refuse-orange">GET /api/v1/environmental-reports</code>
                        <p className="mt-1 text-sm text-gray-600">Access compliance reports</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Implementation Guide */}
              <div className="card">
                <div className="card-header">
                  <h2 className="text-2xl font-bold text-gray-900">Implementation Guide</h2>
                  <p className="mt-2 text-gray-600">
                    Step-by-step instructions for vendors adopting REFUSE protocol in their software
                  </p>
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-900">Quick Start</h3>
                    <div className="mt-4 space-y-4">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-refuse-blue text-white text-sm font-medium">
                            1
                          </div>
                        </div>
                        <div className="ml-3">
                          <h4 className="text-base font-medium text-gray-900">Authentication</h4>
                          <p className="mt-1 text-sm text-gray-600">
                            Set up API credentials and authentication methods
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-refuse-green text-white text-sm font-medium">
                            2
                          </div>
                        </div>
                        <div className="ml-3">
                          <h4 className="text-base font-medium text-gray-900">Data Mapping</h4>
                          <p className="mt-1 text-sm text-gray-600">
                            Map your existing data to REFUSE protocol schemas
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-refuse-orange text-white text-sm font-medium">
                            3
                          </div>
                        </div>
                        <div className="ml-3">
                          <h4 className="text-base font-medium text-gray-900">Integration</h4>
                          <p className="mt-1 text-sm text-gray-600">
                            Connect to REFUSE endpoints and handle responses
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-16">
            <h2 className="text-3xl font-extrabold text-gray-900 text-center">Code Examples</h2>
            <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900">JavaScript Example</h3>
                  <pre className="mt-4 bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`// Fetch facility information
const response = await fetch('/api/v1/facilities', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});

const facilities = await response.json();
console.log(facilities);`}
                  </pre>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900">Python Example</h3>
                  <pre className="mt-4 bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`import requests

# Get environmental compliance data
response = requests.get(
    '/api/v1/environmental-reports',
    headers={'Authorization': 'Bearer YOUR_API_KEY'}
)

reports = response.json()
print(reports)`}
                  </pre>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-16 text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">Ready to Contribute?</h2>
            <p className="mt-4 text-lg text-gray-600">
              Join our community of vendors and developers building the waste industry standard.
              We welcome contributions, feedback, and collaboration.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <a href="https://github.com/refuse-protocol" className="btn" target="_blank" rel="noopener noreferrer">
                View on GitHub
              </a>
              <a href="mailto:jed@edisoncode.com" className="btn-secondary">
                Contact Edison Code
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Documentation
