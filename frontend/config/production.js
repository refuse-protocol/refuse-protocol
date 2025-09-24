// Production Configuration for REFUSE Protocol Website
export const config = {
  app: {
    name: "REFUSE Protocol",
    version: "1.0.0",
    description: "Standardized data exchange for waste management and recycling operations",
  },

  contact: {
    email: "support@refuse-protocol.org",
    githubUrl: "https://github.com/refuse-protocol",
  },

  features: {
    analytics: true,
    errorReporting: true,
    performanceMonitoring: true,
  },

  environment: {
    mode: "production",
    debug: false,
  },

  api: {
    baseUrl: "https://api.refuse-protocol.org",
    docsUrl: "https://docs.refuse-protocol.org",
  },

  analytics: {
    gaTrackingId: process.env.VITE_GA_TRACKING_ID || "GA-TRACKING-ID",
    gtmId: process.env.VITE_GTM_ID || "GTM-ID",
  },

  errorReporting: {
    sentryDsn: process.env.VITE_SENTRY_DSN || "",
    logRocketAppId: process.env.VITE_LOGROCKET_APP_ID || "",
  },
};
