/**
 * API Response Utilities
 * Standardized response format for all API endpoints
 */

export const ApiResponse = {
  /**
   * Success response
   */
  success: (data, message = 'Success', statusCode = 200) => {
    return {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * Error response
   */
  error: (message, statusCode = 400, error = null) => {
    return {
      success: false,
      message,
      error: error?.message || error,
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === 'development' && { stack: error?.stack }),
    };
  },

  /**
   * Paginated response
   */
  paginated: (data, pagination, message = 'Success') => {
    return {
      success: true,
      message,
      data,
      pagination: {
        page: pagination.page || 1,
        limit: pagination.limit || 10,
        total: pagination.total || 0,
        pages: Math.ceil((pagination.total || 0) / (pagination.limit || 10)),
      },
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * Not found response
   */
  notFound: (resource = 'Resource') => {
    return {
      success: false,
      message: `${resource} not found`,
      statusCode: 404,
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * Unauthorized response
   */
  unauthorized: (message = 'Unauthorized') => {
    return {
      success: false,
      message,
      statusCode: 401,
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * Validation error response
   */
  validationError: (errors) => {
    return {
      success: false,
      message: 'Validation error',
      errors: Array.isArray(errors) ? errors : [errors],
      statusCode: 422,
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * Server error response
   */
  serverError: (message = 'Internal server error', error = null) => {
    return {
      success: false,
      message,
      error: error?.message || error,
      statusCode: 500,
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === 'development' && { stack: error?.stack }),
    };
  },
};

export default ApiResponse;
