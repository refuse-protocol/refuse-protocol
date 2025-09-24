import React from 'react'

const EnvironmentalCompliance: React.FC = () => {
  // Mock environmental compliance data
  const complianceData = {
    leedPoints: 45,
    totalPossible: 110,
    carbonReduction: 25.5,
    wasteDiversion: 68.3,
    complianceScore: 92,
    certificates: [
      {
        id: 'CERT-001',
        type: 'LEED Materials & Resources',
        status: 'verified',
        issuedDate: '2024-01-15',
        expiryDate: '2025-01-15',
        points: 12
      },
      {
        id: 'CERT-002',
        type: 'Carbon Credit Certificate',
        status: 'verified',
        issuedDate: '2024-03-01',
        expiryDate: '2025-03-01',
        points: 18
      }
    ],
    environmentalBenefits: [
      {
        type: 'Carbon Reduction',
        amount: 25.5,
        unit: 'tons CO2',
        description: 'Annual carbon emissions reduced through recycling programs'
      },
      {
        type: 'Waste Diversion',
        amount: 68.3,
        unit: '%',
        description: 'Percentage of waste diverted from landfills'
      },
      {
        type: 'Energy Savings',
        amount: 15.2,
        unit: 'MWh',
        description: 'Energy saved through material reuse and recycling'
      }
    ]
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Environmental Compliance</h1>
        <p className="text-gray-600 mt-1">
          Track your environmental impact and sustainability achievements.
        </p>
      </div>

      {/* Compliance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-2xl">🌱</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">LEED Points</p>
              <p className="text-2xl font-bold text-gray-900">
                {complianceData.leedPoints}/{complianceData.totalPossible}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-2xl">💨</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Carbon Reduction</p>
              <p className="text-2xl font-bold text-gray-900">
                {complianceData.carbonReduction}t CO2
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <span className="text-2xl">♻️</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Waste Diversion</p>
              <p className="text-2xl font-bold text-gray-900">
                {complianceData.wasteDiversion}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <span className="text-2xl">📊</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Compliance Score</p>
              <p className="text-2xl font-bold text-gray-900">
                {complianceData.complianceScore}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Certificates */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Environmental Certificates</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {complianceData.certificates.map((cert) => (
              <div key={cert.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">{cert.type}</h3>
                  <p className="text-sm text-gray-600">
                    Issued: {new Date(cert.issuedDate).toLocaleDateString()} •
                    Expires: {new Date(cert.expiryDate).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Certificate ID: {cert.id}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    cert.status === 'verified'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {cert.status}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">{cert.points} points</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Environmental Benefits */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Environmental Impact</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {complianceData.environmentalBenefits.map((benefit, index) => (
              <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-3xl mb-2">
                  {benefit.type === 'Carbon Reduction' ? '💨' :
                   benefit.type === 'Waste Diversion' ? '♻️' : '⚡'}
                </div>
                <h3 className="font-medium text-gray-900 mb-2">{benefit.type}</h3>
                <p className="text-2xl font-bold text-green-600 mb-1">
                  {benefit.amount}{benefit.unit}
                </p>
                <p className="text-sm text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* LEED Progress */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">LEED Certification Progress</h2>
        </div>
        <div className="p-6">
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Progress</span>
              <span>{complianceData.leedPoints}/{complianceData.totalPossible} points</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full"
                style={{ width: `${(complianceData.leedPoints / complianceData.totalPossible) * 100}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Current Achievement</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">LEED Points Earned:</span>
                  <span className="font-medium">{complianceData.leedPoints}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Certification Level:</span>
                  <span className="font-medium text-green-600">Certified</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Points to Next Level:</span>
                  <span className="font-medium">15</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-3">Environmental Impact</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Annual CO2 Reduction:</span>
                  <span className="font-medium">{complianceData.carbonReduction} tons</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Waste Diversion Rate:</span>
                  <span className="font-medium">{complianceData.wasteDiversion}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Energy Saved:</span>
                  <span className="font-medium">15.2 MWh</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EnvironmentalCompliance
