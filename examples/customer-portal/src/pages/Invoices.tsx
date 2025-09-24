import React, { useState } from 'react'
import { useCustomer } from '@/contexts/CustomerContext'
import { format } from 'date-fns'

const Invoices: React.FC = () => {
  const { customer, invoices, loading, error } = useCustomer()
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading invoices...</div>
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
        <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
        <p className="text-gray-600 mt-1">
          View and manage your invoices and payment history.
        </p>
      </div>

      {/* Invoices List */}
      <div className="space-y-4">
        {invoices.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">💰</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Invoices Found</h3>
            <p className="text-gray-600">
              You don't have any invoices. Check back later or contact us if you expect to see invoices.
            </p>
          </div>
        ) : (
          invoices.map((invoice) => (
            <div key={invoice.id} className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-medium text-gray-900">
                      Invoice #{invoice.invoiceNumber}
                    </h2>
                    <p className="text-sm text-gray-600">
                      Due: {format(invoice.dueDate, 'PPP')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">
                      ${invoice.total.toFixed(2)}
                    </p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      invoice.status === 'paid'
                        ? 'bg-green-100 text-green-800'
                        : invoice.status === 'overdue'
                        ? 'bg-red-100 text-red-800'
                        : invoice.status === 'sent'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {invoice.status}
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Invoice Details</h3>
                    <div className="mt-2 grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Invoice Date</p>
                        <p className="font-medium">{format(invoice.invoiceDate, 'PPP')}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Due Date</p>
                        <p className="font-medium">{format(invoice.dueDate, 'PPP')}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Status</p>
                        <p className="font-medium capitalize">{invoice.status}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Amount Breakdown</h3>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal:</span>
                        <span className="font-medium">${invoice.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Taxes:</span>
                        <span className="font-medium">${invoice.taxes.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="font-medium text-gray-900">Total:</span>
                        <span className="font-bold text-gray-900">${invoice.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <button
                      onClick={() => setSelectedInvoice(selectedInvoice === invoice.id ? null : invoice.id)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      {selectedInvoice === invoice.id ? 'Hide Line Items' : 'View Line Items'}
                    </button>
                  </div>

                  {selectedInvoice === invoice.id && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-3">Line Items</h4>
                      <div className="space-y-3">
                        {invoice.lineItems.map((item, index) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-white rounded">
                            <div>
                              <p className="font-medium text-gray-900">{item.description}</p>
                              <p className="text-sm text-gray-600">Qty: {item.quantity} × ${item.unitPrice}</p>
                            </div>
                            <p className="font-medium text-gray-900">${item.amount.toFixed(2)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Invoices
