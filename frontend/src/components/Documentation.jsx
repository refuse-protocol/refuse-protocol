import React, { useState, useEffect } from 'react'

function Documentation() {
  console.log('Documentation component initializing')

  const [protocolData, setProtocolData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    console.log('Documentation useEffect running')
    loadProtocolDocumentation()
  }, [])

  const loadProtocolDocumentation = async () => {
    try {
      console.log('Starting to load protocol documentation')
      setLoading(true)

      // Load generated documentation data
      console.log('Fetching documentation files...')
      const [overviewRes, entitiesRes, guideRes, toolsRes] = await Promise.all([
        fetch('/data/protocol-overview.json'),
        fetch('/data/entities.json'),
        fetch('/data/implementation-guide.json'),
        fetch('/data/tool-reference.json')
      ])

      console.log('Fetch responses:', { overviewRes: overviewRes.ok, entitiesRes: entitiesRes.ok, guideRes: guideRes.ok, toolsRes: toolsRes.ok })

      if (!overviewRes.ok) {
        throw new Error('Protocol documentation not yet generated. Run: npm run build:protocol-docs')
      }

      const [overview, entities, guide, tools] = await Promise.all([
        overviewRes.json(),
        entitiesRes.json(),
        guideRes.json(),
        toolsRes.json()
      ])

      console.log('Data loaded successfully, setting state')
      setProtocolData({ overview, entities, guide, tools })
    } catch (err) {
      console.log('Error loading documentation:', err.message)
      setError(err.message)
    } finally {
      console.log('Loading state set to false')
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white section-padding">
        <div className="max-w-7xl mx-auto text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-refuse-blue mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading protocol documentation...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white section-padding">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
              Documentation
            </h1>
            <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Documentation Update Needed</h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>{error}</p>
                  </div>
                  <div className="mt-4">
                    <div className="-mx-2 -my-1.5 flex">
                      <button
                        type="button"
                        onClick={loadProtocolDocumentation}
                        className="bg-yellow-50 px-2 py-1.5 rounded-md text-sm font-medium text-yellow-800 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-yellow-50 focus:ring-yellow-600"
                      >
                        Try Again
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const { overview, entities, guide, tools } = protocolData

  return (
    <div className="bg-white">
      <div className="section-padding">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
              Documentation
            </h1>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Live documentation generated from the REFUSE Protocol implementation.
              Updated automatically when protocol changes are made.
            </p>
            <div className="mt-4 text-sm text-gray-500">
              Last updated: {new Date(overview.lastUpdated).toLocaleDateString()}
            </div>
          </div>

          <div className="mt-16">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              {/* Protocol Overview */}
              <div className="card">
                <div className="card-header">
                  <h2 className="text-2xl font-bold text-gray-900">Protocol Overview</h2>
                  <p className="mt-2 text-gray-600">
                    {overview.description} - {overview.entities} entities, {overview.implementations} implementations, {overview.tools} tools
                  </p>
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-900">Key Features</h3>
                    <ul className="mt-4 space-y-2">
                      {overview.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-refuse-blue" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-gray-600">{feature}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Core Principles */}
              <div className="card">
                <div className="card-header">
                  <h2 className="text-2xl font-bold text-gray-900">Core Principles</h2>
                  <p className="mt-2 text-gray-600">
                    The five foundational principles of REFUSE Protocol
                  </p>
                  <div className="mt-6">
                    <div className="space-y-4">
                      {overview.principles.map((principle, index) => (
                        <div key={index} className="flex items-start">
                          <div className="flex-shrink-0">
                            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-refuse-green text-white text-sm font-medium">
                              {index + 1}
                            </div>
                          </div>
                          <div className="ml-3">
                            <h4 className="text-base font-medium text-gray-900">{principle.name}</h4>
                            <p className="mt-1 text-sm text-gray-600">{principle.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Implementation Guide */}
          <div className="mt-16">
            <h2 className="text-3xl font-extrabold text-gray-900 text-center">Implementation Guide</h2>
            <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900">Available Implementations</h3>
                  <p className="mt-2 text-sm text-gray-600">
                    {guide.implementations.length} implementation modules covering all aspects of the protocol
                  </p>
                  <div className="mt-4 space-y-2">
                    {guide.implementations.slice(0, 5).map((impl, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm font-medium text-gray-900">{impl.name}</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          impl.complexity === 'High' ? 'bg-red-100 text-red-800' :
                          impl.complexity === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {impl.complexity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900">Tool Ecosystem</h3>
                  <p className="mt-2 text-sm text-gray-600">
                    {tools.tools?.length || 0} specialized tools for validation, compliance, and development
                  </p>
                  <div className="mt-4">
                    <div className="space-y-2">
                      {Object.entries(tools.categories || {}).map(([category, toolList], index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{category}</span>
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                            {toolList.length}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Getting Started */}
          <div className="mt-16">
            <h2 className="text-3xl font-extrabold text-gray-900 text-center">Getting Started</h2>
            <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="card">
                <div className="card-header text-center">
                  <div className="mx-auto h-12 w-12 text-refuse-blue">
                    <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">1. Review Protocol</h3>
                  <p className="mt-2 text-gray-600">
                    Study the {overview.entities} entities and core principles
                  </p>
                </div>
              </div>

              <div className="card">
                <div className="card-header text-center">
                  <div className="mx-auto h-12 w-12 text-refuse-green">
                    <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">2. Choose Implementation</h3>
                  <p className="mt-2 text-gray-600">
                    Select from {guide.implementations.length} ready-made implementations
                  </p>
                </div>
              </div>

              <div className="card">
                <div className="card-header text-center">
                  <div className="mx-auto h-12 w-12 text-refuse-orange">
                    <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">3. Integrate & Test</h3>
                  <p className="mt-2 text-gray-600">
                    Use our {tools.tools?.length || 0} tools for validation and compliance
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-16 text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">Ready to Build?</h2>
            <p className="mt-4 text-lg text-gray-600">
              Join our community of vendors and developers creating the waste industry's data exchange standard.
              We welcome contributions, feedback, and collaboration from all stakeholders.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <a href="https://github.com/refuse-protocol" className="btn" target="_blank" rel="noopener noreferrer">
                Contribute on GitHub
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