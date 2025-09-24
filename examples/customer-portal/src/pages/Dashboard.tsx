import React from 'react'
import { useCustomer } from '@/contexts/CustomerContext'
import { useService } from '@/contexts/ServiceContext'
import { format } from 'date-fns'

const Dashboard: React.FC = () => {
  const { customer, services, invoices, loading, error } = useCustomer()
  const { serviceRequests, serviceSchedules, containers } = useService()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading dashboard...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-800">Error: {error}</div>
      </div>
    )
  }

  const upcomingServices = serviceSchedules
    .filter(schedule => schedule.status === 'scheduled' && schedule.scheduledDate > new Date())
    .slice(0, 5)

  const recentRequests = serviceRequests
    .filter(request => request.status !== 'completed')
    .slice(0, 3)

  const pendingInvoices = invoices
    .filter(invoice => invoice.status === 'sent' || invoice.status === 'overdue')
    .slice(0, 3)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Welcome back! Here's an overview of your waste management services.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-2xl">🚛</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Services</p>
              <p className="text-2xl font-bold text-gray-900">{services.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-2xl">📦</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Containers</p>
              <p className="text-2xl font-bold text-gray-900">{containers.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <span className="text-2xl">📋</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Open Requests</p>
              <p className="text-2xl font-bold text-gray-900">{recentRequests.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <span className="text-2xl">💰</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Invoices</p>
              <p className="text-2xl font-bold text-gray-900">{pendingInvoices.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Services */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Upcoming Services</h2>
          </div>
          <div className="p-6">
            {upcomingServices.length === 0 ? (
              <p className="text-gray-500">No upcoming services scheduled</p>
            ) : (
              <div className="space-y-4">
                {upcomingServices.map((schedule) => {
                  const service = services.find(s => s.id === schedule.serviceId)
                  return (
                    <div key={schedule.serviceId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {service?.name || 'Unknown Service'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {format(schedule.scheduledDate, 'PPP')}
                        </p>
                        {schedule.notes && (
                          <p className="text-xs text-gray-500 mt-1">{schedule.notes}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          schedule.status === 'scheduled'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {schedule.status}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recent Requests */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Recent Requests</h2>
          </div>
          <div className="p-6">
            {recentRequests.length === 0 ? (
              <p className="text-gray-500">No recent requests</p>
            ) : (
              <div className="space-y-4">
                {recentRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {request.type.replace('_', ' ').toUpperCase()}
                      </h3>
                      <p className="text-sm text-gray-600 truncate max-w-xs">
                        {request.description}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {format(request.createdAt, 'PPP')}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        request.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : request.status === 'in_review'
                          ? 'bg-blue-100 text-blue-800'
                          : request.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {request.status}
                      </span>
                      {request.estimatedCost && (
                        <p className="text-xs text-gray-500 mt-1">
                          ${request.estimatedCost}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Customer Information */}
      {customer && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Account Information</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900">{customer.name}</h3>
                <p className="text-sm text-gray-600 capitalize">{customer.type} Customer</p>
                <p className="text-sm text-gray-600">Service Area: {customer.serviceArea}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Contact Information</h4>
                <p className="text-sm text-gray-600">{customer.contactInfo.email}</p>
                <p className="text-sm text-gray-600">{customer.contactInfo.primaryPhone}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {customer.contactInfo.address.street}<br />
                  {customer.contactInfo.address.city}, {customer.contactInfo.address.state} {customer.contactInfo.address.zipCode}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
