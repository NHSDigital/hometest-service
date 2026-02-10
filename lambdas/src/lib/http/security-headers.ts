export const securityHeaders = {
  strictTransportSecurity: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: false
  },
  contentTypeOptions: { action: 'nosniff' }
};
