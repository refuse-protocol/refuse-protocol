import React from 'react'
import PropTypes from 'prop-types'
import Navigation from './Navigation'
import Footer from './Footer'

function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col" data-testid="layout-root">
      {/* Skip to main content for screen readers */}
      <a
        href="#main-content"
        className="skip-to-main"
        onFocus={(e) => e.target.style.position = 'fixed'}
        onBlur={(e) => e.target.style.position = 'absolute'}
      >
        Skip to main content
      </a>
      <Navigation />
      <main id="main-content" className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  )
}

Layout.propTypes = {
  children: PropTypes.node.isRequired
}

export default Layout
