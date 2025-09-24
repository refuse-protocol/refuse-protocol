import React from 'react'
import { Link } from 'react-router-dom'

function About() {
  return (
    <div className="bg-white">
      <div className="section-padding">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
              About REFUSE Protocol
            </h1>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              The REcyclable & Solid waste Unified Standard Exchange protocol bridges the gap
              between legacy waste management systems and modern applications.
            </p>
          </div>

          <div className="mt-16">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
              <div>
                <h2 className="text-3xl font-extrabold text-gray-900">What is REFUSE?</h2>
                <p className="mt-4 text-lg text-gray-600">
                  REFUSE Protocol is an open source standard for waste management data exchange.
                  It provides a unified interface for connecting diverse systems used in
                  recycling, waste collection, environmental compliance, and facility management.
                </p>
                <p className="mt-4 text-lg text-gray-600">
                  Our protocol addresses the fundamental challenge of data silos in waste
                  management by providing RESTful APIs with semantic clarity and backward compatibility.
                  <strong className="text-gray-700"> We're building this standard collaboratively with the waste industry.</strong>
                </p>
              </div>

              <div>
                <h2 className="text-3xl font-extrabold text-gray-900">Core Principles</h2>
                <div className="mt-4 space-y-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-refuse-blue text-white text-sm font-medium">
                        1
                      </div>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-medium text-gray-900">RESTful API-First</h3>
                      <p className="mt-1 text-gray-600">
                        All operations accessible via standardized HTTP methods
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
                      <h3 className="text-lg font-medium text-gray-900">JSON-Native</h3>
                      <p className="mt-1 text-gray-600">
                        Human-readable data structures with optional XML support
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
                      <h3 className="text-lg font-medium text-gray-900">Semantic Clarity</h3>
                      <p className="mt-1 text-gray-600">
                        Descriptive field names using consistent domain terminology
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-16">
            <h2 className="text-3xl font-extrabold text-gray-900 text-center">Industry Applications</h2>
            <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="card">
                <div className="card-header text-center">
                  <div className="mx-auto h-12 w-12 text-refuse-blue">
                    <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">Waste Management Systems</h3>
                  <p className="mt-2 text-gray-600">
                    Connect recycling centers, transfer stations, and processing facilities with standardized data exchange
                  </p>
                </div>
              </div>

              <div className="card">
                <div className="card-header text-center">
                  <div className="mx-auto h-12 w-12 text-refuse-green">
                    <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">Environmental Compliance</h3>
                  <p className="mt-2 text-gray-600">
                    Automated reporting for regulatory requirements and environmental standards across the industry
                  </p>
                </div>
              </div>

              <div className="card">
                <div className="card-header text-center">
                  <div className="mx-auto h-12 w-12 text-refuse-orange">
                    <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">Software Vendor Integration</h3>
                  <p className="mt-2 text-gray-600">
                    Join other vendors in building compatible software solutions using the REFUSE standard
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-16 text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">Ready to Join the Standard?</h2>
            <p className="mt-4 text-lg text-gray-600">
              Whether you're a waste management company, software vendor, or developer,
              we invite you to collaborate with us in building the future of waste industry standards.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/docs" className="btn">
                View Documentation
              </Link>
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

export default About
