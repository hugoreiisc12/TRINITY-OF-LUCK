/**
 * Helper Utilities
 */

/**
 * Sleep function for delays
 */
export const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Validate email format
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate URL format
 */
export const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Get client IP address
 */
export const getClientIp = (req) => {
  return (
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.headers['x-client-ip'] ||
    req.connection.remoteAddress ||
    '0.0.0.0'
  ).trim();
};

/**
 * Check if request is authorized
 */
export const isAuthorized = (req) => {
  const authHeader = req.headers['authorization'];
  const apiKey = req.headers['x-api-key'];

  if (apiKey) {
    return apiKey === process.env.API_SECRET_KEY;
  }

  if (authHeader && authHeader.startsWith('Bearer ')) {
    // Token validation would go here
    return true;
  }

  return false;
};

/**
 * Sanitize object (remove null/undefined values)
 */
export const sanitize = (obj) => {
  return Object.entries(obj)
    .filter(([_, v]) => v != null)
    .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});
};

/**
 * Format error message
 */
export const formatErrorMessage = (error) => {
  if (typeof error === 'string') {
    return error;
  }

  if (error?.message) {
    return error.message;
  }

  if (error?.error_description) {
    return error.error_description;
  }

  return 'An unexpected error occurred';
};

/**
 * Generate request ID
 */
export const generateRequestId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Validate request body required fields
 */
export const validateRequired = (body, fields) => {
  const missing = fields.filter(field => !body[field]);
  return {
    isValid: missing.length === 0,
    missingFields: missing,
  };
};

/**
 * Parse pagination params
 */
export const parsePagination = (query, defaults = {}) => {
  const page = Math.max(1, parseInt(query.page || defaults.page || 1, 10));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit || defaults.limit || 10, 10)));

  return { page, limit, offset: (page - 1) * limit };
};

export default {
  sleep,
  isValidEmail,
  isValidUrl,
  getClientIp,
  isAuthorized,
  sanitize,
  formatErrorMessage,
  generateRequestId,
  validateRequired,
  parsePagination,
};
