import React from 'react'

function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col" data-testid="layout-root">
      {children}
    </div>
  )
}

export default Layout
