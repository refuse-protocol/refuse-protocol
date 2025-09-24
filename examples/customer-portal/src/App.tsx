import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { CustomerProvider } from './contexts/CustomerContext'
import { ServiceProvider } from './contexts/ServiceContext'
import Layout from '@/components/Layout'
import Dashboard from '@/pages/Dashboard'
import Services from '@/pages/Services'
import Invoices from '@/pages/Invoices'
import ServiceRequests from '@/pages/ServiceRequests'
import EnvironmentalCompliance from '@/pages/EnvironmentalCompliance'
import './App.css'

function App() {
  return (
    <Router>
      <CustomerProvider>
        <ServiceProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/services" element={<Services />} />
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/requests" element={<ServiceRequests />} />
              <Route path="/compliance" element={<EnvironmentalCompliance />} />
            </Routes>
          </Layout>
        </ServiceProvider>
      </CustomerProvider>
    </Router>
  )
}

export default App
