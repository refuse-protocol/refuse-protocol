import React from 'react'
import Layout from './components/Layout'
import Navigation from './components/Navigation'
import Homepage from './components/Homepage'
import Footer from './components/Footer'

function App() {
  return (
    <Layout>
      <Navigation />
      <main id="main-content">
        <Homepage />
        {/* Future pages will be routed here */}
        {/* <About /> */}
        {/* <Documentation /> */}
        {/* <Contact /> */}
      </main>
      <Footer />
    </Layout>
  )
}

export default App
