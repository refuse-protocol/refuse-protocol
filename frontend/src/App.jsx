import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Navigation from './components/Navigation'
import Homepage from './components/Homepage'
import About from './components/About'
import Documentation from './components/Documentation'
import Contact from './components/Contact'
import Footer from './components/Footer'

function App() {
  return (
    <Router>
      <Layout>
        <Navigation />
        <main id="main-content">
          <Routes>
            <Route path="/" element={<Homepage />} />
            <Route path="/about" element={<About />} />
            <Route path="/docs" element={<Documentation />} />
            <Route path="/contact" element={<Contact />} />
          </Routes>
        </main>
        <Footer />
      </Layout>
    </Router>
  )
}

export default App
