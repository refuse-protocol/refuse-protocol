import React from 'react'
import PropTypes from 'prop-types'
import Navigation from './Navigation'
import Footer from './Footer'

function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col" data-testid="layout-root">
      <Navigation />
      <main className="flex-grow">
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
