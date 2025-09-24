import React, { useState } from 'react'
import { useCustomer } from '@/contexts/CustomerContext'
import { format } from 'date-fns'

const Services: React.FC = () => {
  const { customer, services, loading, error } = useCustomer()
  const [selectedService, setSelectedService] = useState<string | null>(null)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading services...</div>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Services</h1>
        <p className="text-gray-600 mt-1">
          Manage your waste management services and view service history.
        </p>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {services.map((service) => (
          <div key={service.id} className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">{service.name}</h2>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  service.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : service.status === 'suspended'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {service.status}
                </span>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Service Details</h3>
                  <div className="mt-2 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Type</p>
                      <p className="font-medium capitalize">{service.type.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Frequency</p>
                      <p className="font-medium capitalize">{service.frequency}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Container</p>
                      <p className="font-medium">{service.requirements.containerTypes.join(', ')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Base Rate</p>
                      <p className="font-medium">${service.pricing.baseRate}/{service.pricing.rateUnit}</p>
                    </div>
                  </div>
                </div>

                {service.requirements.specialHandling && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Special Handling</h3>
                    <p className="mt-1 text-sm text-gray-900">{service.requirements.specialHandling}</p>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setSelectedService(selectedService === service.id ? null : service.id)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    {selectedService === service.id ? 'Hide Details' : 'View Details'}
                  </button>
                </div>

                {selectedService === service.id && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Service Timeline</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Created:</span>
                        <span className="font-medium">{format(service.createdAt, 'PPP')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Updated:</span>
                        <span className="font-medium">{format(service.updatedAt, 'PPP')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Version:</span>
                        <span className="font-medium">v{service.version}</span>
                      </div>
                    </div>

                    <h4 className="font-medium text-gray-900 mb-2 mt-4">Pricing Breakdown</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Base Rate:</span>
                        <span className="font-medium">${service.pricing.baseRate}/{service.pricing.rateUnit}</span>
                      </div>
                      {service.pricing.additionalCharges > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Additional Charges:</span>
                          <span className="font-medium">${service.pricing.additionalCharges}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {services.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🚛</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Services Found</h3>
          <p className="text-gray-600 mb-6">
            You don't have any active services. Contact us to set up waste management services.
          </p>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            Request New Service
          </button>
        </div>
      )}
    </div>
  )
}

export default Services
