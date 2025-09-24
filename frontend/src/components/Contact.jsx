import React, { useState } from 'react'

function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: '',
    inquiryType: 'general'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false)
      setIsSubmitted(true)
    }, 1000)
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="bg-white">
      <div className="section-padding">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
              Contact Us
            </h1>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Get in touch with our team for support, partnerships, or questions about
              implementing REFUSE protocol.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-12 lg:grid-cols-2">
            {/* Contact Information */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Get in Touch</h2>
              <p className="mt-4 text-lg text-gray-600">
                We're here to help you integrate REFUSE protocol into your waste management systems.
              </p>

              <div className="mt-8 space-y-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-refuse-blue text-white">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-gray-900">Email Support</h3>
                    <p className="mt-1 text-gray-600">support@refuse-protocol.org</p>
                    <p className="mt-1 text-sm text-gray-500">Response within 24 hours</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-refuse-green text-white">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    </div>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-gray-900">Community</h3>
                    <p className="mt-1 text-gray-600">Join our developer community</p>
                    <a href="https://github.com/refuse-protocol" className="mt-1 text-sm text-refuse-blue hover:text-blue-700">
                      GitHub Repository →
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-xl font-semibold text-gray-900">Send us a Message</h2>

                {isSubmitted ? (
                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-green-800">
                          Message sent successfully!
                        </p>
                        <p className="mt-1 text-sm text-green-700">
                          We'll get back to you within 24 hours.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                    <div>
                      <label htmlFor="inquiryType" className="block text-sm font-medium text-gray-700">
                        Inquiry Type
                      </label>
                      <select
                        id="inquiryType"
                        name="inquiryType"
                        value={formData.inquiryType}
                        onChange={handleChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-refuse-blue focus:border-refuse-blue sm:text-sm"
                        required
                      >
                        <option value="general">General Question</option>
                        <option value="technical">Technical Support</option>
                        <option value="partnership">Partnership</option>
                        <option value="integration">Integration Help</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                          Name *
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-refuse-blue focus:border-refuse-blue sm:text-sm"
                        />
                      </div>

                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                          Email *
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-refuse-blue focus:border-refuse-blue sm:text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                        Company/Organization
                      </label>
                      <input
                        type="text"
                        id="company"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-refuse-blue focus:border-refuse-blue sm:text-sm"
                      />
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                        Message *
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        rows={4}
                        value={formData.message}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-refuse-blue focus:border-refuse-blue sm:text-sm"
                      />
                    </div>

                    <div>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn w-full disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? 'Sending...' : 'Send Message'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Contact
