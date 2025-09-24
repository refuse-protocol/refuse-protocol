import React from 'react'

function Footer() {
  return (
    <footer className="bg-gray-50" role="contentinfo">
      <div className="container-padding py-12 md:flex md:items-center md:justify-between">
        <div className="flex justify-center space-x-6 md:order-2">
          <a href="https://github.com/refuse-protocol" className="text-gray-400 hover:text-gray-500" aria-label="GitHub">
            <span className="sr-only">GitHub</span>
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path fillRule="evenodd" d="M12 2C6.477 15 12 4.73 12 4.73 12 4.73 17.523 15 12 2zM3.5 9.5c.828 0 1.5.672 1.5 1.5s-.672 1.5-1.5 1.5S2 11.828 2 11s.672-1.5 1.5-1.5zm16 0c.828 0 1.5.672 1.5 1.5s-.672 1.5-1.5 1.5-1.5-.672-1.5-1.5.672-1.5 1.5-1.5zM12 16c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2-1.343-2-3-2z" clipRule="evenodd" />
            </svg>
          </a>
        </div>
        <div className="mt-8 md:mt-0 md:order-1">
          <p className="text-center text-base text-gray-400">
            &copy; 2025 REFUSE Protocol. All rights reserved.
          </p>
        </div>
      </div>

      {/* Bottom section with additional links */}
      <div className="border-t border-gray-200">
        <div className="container-padding py-6">
          <div className="md:flex md:items-center md:justify-between">
            <div className="text-sm text-gray-500">
              <p>
                REFUSE (REcyclable & Solid waste Unified Standard Exchange) protocol enables
                standardized data exchange for waste management and recycling operations.
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <nav className="flex space-x-8">
                <a href="#about" className="text-sm text-gray-500 hover:text-gray-600">
                  About
                </a>
                <a href="#docs" className="text-sm text-gray-500 hover:text-gray-600">
                  Documentation
                </a>
                <a href="#contact" className="text-sm text-gray-500 hover:text-gray-600">
                  Contact
                </a>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
