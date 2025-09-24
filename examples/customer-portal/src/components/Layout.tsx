import React, { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useCustomer } from '@/contexts/CustomerContext'

interface LayoutProps {
  children: ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation()
  const { customer, loading } = useCustomer()

  const navigation = [
    { name: 'Dashboard', href: '/', icon: '📊' },
    { name: 'Services', href: '/services', icon: '🚛' },
    { name: 'Invoices', href: '/invoices', icon: '💰' },
    { name: 'Requests', href: '/requests', icon: '📋' },
    { name: 'Compliance', href: '/compliance', icon: '🌱' },
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-gray-900">
                  REFUSE Protocol Portal
                </h1>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {loading ? (
                <div className="text-sm text-gray-500">Loading...</div>
              ) : customer ? (
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {customer.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {customer.type} • {customer.serviceArea}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500">No customer loaded</div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-64 bg-white shadow-sm min-h-[calc(100vh-4rem)]">
          <div className="px-4 py-6">
            <ul className="space-y-1">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive(item.href)
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <span className="mr-3 text-lg">{item.icon}</span>
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout
