/**
 * Security Middleware - Endpoint Usage Examples
 * Real-world examples of how to apply validators to API endpoints
 * 
 * Date: January 4, 2026
 * Purpose: Show best practices for endpoint security
 */

import express from 'express';
import {
  validateEmail,
  validatePassword,
  validateUUID,
  validateUrl,
  validateString,
  validateNumber,
  validateDateRange,
  handleValidationErrors,
} from './server.js';
import { body, param, query } from 'express-validator';

const app = express();

// ============================================================================
// EXAMPLE 1: LOGIN ENDPOINT - Email & Password Validation
// ============================================================================

/**
 * POST /api/auth/login
 * Validates user credentials with strong rules
 */
app.post('/api/auth/login',
  // Rate limiting already applied in server.js
  [
    validateEmail,                              // Email format
    validatePassword,                           // Password strength
    handleValidationErrors,                     // Error handler
  ],
  async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // At this point, email and password are validated and sanitized
      // Email is lowercased and normalized
      // Password meets complexity requirements
      
      // TODO: Authenticate with database
      res.json({ 
        success: true, 
        message: 'Login successful',
        token: 'jwt-token-here' 
      });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// ============================================================================
// EXAMPLE 2: GET SINGLE RESULT - UUID Parameter Validation
// ============================================================================

/**
 * GET /api/results/:id
 * Validates UUID format in URL parameter
 */
app.get('/api/results/:id',
  authenticateToken,                          // User must be logged in
  [
    validateUUID,                              // Validate UUID format
    handleValidationErrors,                    // Error handler
  ],
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      // At this point:
      // - User is authenticated
      // - ID is validated as UUID format
      // - ID is properly escaped
      
      // TODO: Fetch result by ID
      // TODO: Verify user has access to this result
      
      res.json({ 
        success: true, 
        data: { id, value: 'result data' } 
      });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// ============================================================================
// EXAMPLE 3: FEEDBACK ENDPOINT - Multiple Field Validation
// ============================================================================

/**
 * POST /api/feedback
 * Validates feedback text and rating
 */
app.post('/api/feedback',
  authenticateToken,                          // User must be logged in
  [
    validateString('comment', 1, 500),        // Comment 1-500 chars
    validateNumber('rating', 1, 5),           // Rating 1-5
    handleValidationErrors,                    // Error handler
  ],
  async (req, res) => {
    try {
      const { comment, rating } = req.body;
      const userId = req.user.id;
      
      // At this point:
      // - User is authenticated
      // - Comment is length-validated and escaped
      // - Rating is validated as integer 1-5
      // - NoSQL injection prevented by mongo-sanitize
      // - XSS prevented by xss-clean
      
      // TODO: Save feedback to database
      
      res.json({ 
        success: true, 
        message: 'Feedback saved',
        feedback: { id: 'feedback-uuid', comment, rating }
      });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// ============================================================================
// EXAMPLE 4: SETTINGS ENDPOINT - Update with Optional Fields
// ============================================================================

/**
 * PUT /api/settings
 * Validates settings update with optional fields
 */
app.put('/api/settings',
  authenticateToken,                          // User must be logged in
  [
    // Email is optional, but if present must be valid
    body('email')
      .optional()
      .trim()
      .isEmail()
      .normalizeEmail()
      .escape(),
    
    // Phone is optional, but if present must be valid
    body('phone')
      .optional()
      .trim()
      .isMobilePhone()
      .escape(),
    
    // Theme is required number 0-5
    validateNumber('theme', 0, 5),
    
    // Timezone is optional string
    validateString('timezone', 1, 50).optional(),
    
    // Portfolio URL is optional but must be valid
    body('portfolio_url')
      .optional()
      .trim()
      .isURL()
      .escape(),
    
    handleValidationErrors,                    // Error handler
  ],
  async (req, res) => {
    try {
      const { email, phone, theme, timezone, portfolio_url } = req.body;
      const userId = req.user.id;
      
      // At this point:
      // - All present fields are validated
      // - Optional fields were checked only if provided
      // - All strings are escaped
      
      // TODO: Update user settings in database
      
      res.json({ 
        success: true, 
        message: 'Settings updated',
        settings: { email, phone, theme, timezone, portfolio_url }
      });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// ============================================================================
// EXAMPLE 5: HISTORY ENDPOINT - Date Range Validation with Query
// ============================================================================

/**
 * GET /api/history
 * Validates date range query parameters
 */
app.get('/api/history',
  authenticateToken,                          // User must be logged in
  [
    // Start date required, ISO8601 format
    query('start_date')
      .isISO8601()
      .toDate(),
    
    // End date required, ISO8601 format, must be after start date
    query('end_date')
      .isISO8601()
      .toDate()
      .custom((value, { req }) => {
        if (value < req.query.start_date) {
          throw new Error('End date must be after start date');
        }
      }),
    
    // Limit results (optional, default 20)
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .toInt(),
    
    handleValidationErrors,                    // Error handler
  ],
  async (req, res) => {
    try {
      const { start_date, end_date, limit = 20 } = req.query;
      const userId = req.user.id;
      
      // At this point:
      // - start_date is valid Date object
      // - end_date is valid Date object after start_date
      // - limit is integer 1-100
      
      // TODO: Fetch history records within date range
      
      res.json({ 
        success: true, 
        data: {
          start_date,
          end_date,
          limit,
          records: []
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// ============================================================================
// EXAMPLE 6: SEARCH ENDPOINT - Query Validation
// ============================================================================

/**
 * GET /api/search
 * Validates search query with optional filters
 */
app.get('/api/search',
  authenticateToken,                          // User must be logged in
  [
    // Search term required
    query('q')
      .trim()
      .isLength({ min: 1, max: 100 })
      .escape(),
    
    // Category filter optional
    query('category')
      .optional()
      .trim()
      .isIn(['hobby', 'business', 'gaming', 'technology', 'other']),
    
    // Price range optional
    query('min_price')
      .optional()
      .isInt({ min: 0, max: 1000000 })
      .toInt(),
    
    query('max_price')
      .optional()
      .isInt({ min: 0, max: 1000000 })
      .toInt(),
    
    // Sorting optional
    query('sort')
      .optional()
      .isIn(['relevance', 'price_asc', 'price_desc', 'rating', 'date']),
    
    handleValidationErrors,                    // Error handler
  ],
  async (req, res) => {
    try {
      const { q, category, min_price, max_price, sort } = req.query;
      const userId = req.user.id;
      
      // At this point:
      // - q is 1-100 chars and escaped
      // - category is one of allowed values
      // - price range is validated integers
      // - sort is one of allowed values
      
      // TODO: Search database with validated filters
      
      res.json({ 
        success: true, 
        data: {
          query: q,
          filters: { category, min_price, max_price },
          sort,
          results: []
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// ============================================================================
// EXAMPLE 7: CREATE PLAN - Complete Validation Example
// ============================================================================

/**
 * POST /api/plans
 * Creates a new plan with comprehensive validation
 * Admin only endpoint
 */
app.post('/api/plans',
  authenticateToken,                          // User must be logged in
  [
    // Plan name: 5-100 chars
    validateString('name', 5, 100),
    
    // Plan description: 10-500 chars
    validateString('description', 10, 500),
    
    // Price: number 0.01 to 999.99
    body('price')
      .isDecimal({ decimal_digits: '1,2' })
      .isFloat({ min: 0.01, max: 999.99 })
      .toFloat(),
    
    // Currency: ISO code
    body('currency')
      .trim()
      .isIn(['USD', 'EUR', 'GBP', 'CAD', 'AUD']),
    
    // Duration: number 1-365 days
    validateNumber('duration_days', 1, 365),
    
    // Features: array of strings
    body('features')
      .isArray()
      .custom((features) => {
        return features.every(f => typeof f === 'string' && f.length > 0);
      }),
    
    // Marketing URL: valid URL
    body('landing_page_url')
      .trim()
      .isURL()
      .escape(),
    
    handleValidationErrors,                    // Error handler
  ],
  async (req, res) => {
    try {
      // Check admin role
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Only admins can create plans' });
      }
      
      const { name, description, price, currency, duration_days, features, landing_page_url } = req.body;
      
      // At this point:
      // - All fields validated
      // - Strings escaped
      // - Numbers in correct range
      // - URL is valid format
      
      // TODO: Create plan in database
      
      res.json({ 
        success: true, 
        message: 'Plan created',
        plan: { id: 'plan-uuid', name, price, currency, duration_days }
      });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// ============================================================================
// EXAMPLE 8: DELETE ENDPOINT - Permission & UUID Validation
// ============================================================================

/**
 * DELETE /api/results/:id
 * Deletes a result with permission check
 */
app.delete('/api/results/:id',
  authenticateToken,                          // User must be logged in
  [
    validateUUID,                              // Validate UUID in URL
    handleValidationErrors,                    // Error handler
  ],
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      // TODO: Check if user owns this result
      // TODO: Delete the result
      
      res.json({ 
        success: true, 
        message: 'Result deleted',
        id
      });
    } catch (error) {
      if (error.message === 'Not found') {
        return res.status(404).json({ error: 'Result not found' });
      }
      if (error.message === 'Unauthorized') {
        return res.status(403).json({ error: 'You cannot delete this result' });
      }
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// ============================================================================
// EXAMPLE 9: BULK OPERATION - Array Validation
// ============================================================================

/**
 * POST /api/bulk-delete
 * Deletes multiple results at once
 */
app.post('/api/bulk-delete',
  authenticateToken,                          // User must be logged in
  [
    // IDs: array of UUIDs
    body('ids')
      .isArray({ min: 1, max: 100 })
      .custom((ids) => {
        return ids.every(id => typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));
      }),
    
    handleValidationErrors,                    // Error handler
  ],
  async (req, res) => {
    try {
      const { ids } = req.body;
      const userId = req.user.id;
      
      // At this point:
      // - ids is array with 1-100 items
      // - All items are valid UUIDs
      
      // TODO: Delete multiple results
      
      res.json({ 
        success: true, 
        message: `${ids.length} results deleted`,
        deleted_count: ids.length
      });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// ============================================================================
// EXAMPLE 10: REGISTER - Complete User Creation with Validation
// ============================================================================

/**
 * POST /api/auth/register
 * Creates new user account with comprehensive validation
 */
app.post('/api/auth/register',
  [
    // Email: valid format, normalized
    validateEmail,
    
    // Password: strong requirements
    validatePassword,
    
    // Name: 2-100 chars
    validateString('name', 2, 100),
    
    // Company: optional, 2-100 chars if provided
    validateString('company', 2, 100).optional(),
    
    // Website: optional URL
    body('website')
      .optional()
      .trim()
      .isURL()
      .escape(),
    
    // Terms accepted: must be true
    body('terms_accepted')
      .isBoolean()
      .custom((value) => {
        if (!value) throw new Error('Must accept terms and conditions');
      }),
    
    handleValidationErrors,                    // Error handler
  ],
  async (req, res) => {
    try {
      const { email, password, name, company, website, terms_accepted } = req.body;
      
      // Check if user already exists
      // TODO: Query database for existing user
      
      // At this point:
      // - Email is valid and normalized
      // - Password is strong
      // - Name is 2-100 chars
      // - Company is optional or 2-100 chars
      // - Website is valid URL if provided
      // - Terms accepted is true
      
      // TODO: Hash password
      // TODO: Create user in database
      // TODO: Send verification email
      
      res.json({ 
        success: true, 
        message: 'Registration successful',
        user: { id: 'user-uuid', email, name }
      });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// ============================================================================
// MIDDLEWARE: Placeholder for authenticateToken
// ============================================================================

function authenticateToken(req, res, next) {
  // This is already implemented in server.js
  // Just a placeholder for example clarity
  next();
}

// ============================================================================
// EXPORT
// ============================================================================

export default app;

/**
 * USAGE NOTES:
 * 
 * 1. All validators are already defined in server.js
 * 2. Import them at the top of your route file
 * 3. Add validators array between route path and handler
 * 4. Always include handleValidationErrors in validators array
 * 5. At handler level, inputs are already validated and escaped
 * 
 * VALIDATOR FUNCTIONS AVAILABLE:
 * - validateEmail: Validates email format, normalizes
 * - validatePassword: Requires 8+ chars, uppercase, lowercase, number
 * - validateUUID: Validates UUID v4 format
 * - validateUrl: Validates HTTP/HTTPS URLs
 * - validateString(field, minLen, maxLen): String with length limits
 * - validateNumber(field, min, max): Integer within range
 * - validateDateRange(startField, endField): ISO8601 dates with range
 * - handleValidationErrors: Middleware to handle validation errors
 * 
 * EXPRESS-VALIDATOR BUILDING BLOCKS:
 * - body(field): Validate request body field
 * - param(field): Validate URL parameter
 * - query(field): Validate query string parameter
 * - .trim(): Remove whitespace
 * - .escape(): Escape HTML characters
 * - .isEmail(): Check email format
 * - .isLength({min, max}): Check string length
 * - .isInt(): Check integer
 * - .isUUID(): Check UUID format
 * - .isURL(): Check URL format
 * - .custom(fn): Custom validation function
 * - .optional(): Make field optional
 * - .if(condition): Conditional validation
 * 
 * COMMON PATTERNS:
 * 
 * // Only validate if field is present
 * body('optional_field').optional().isEmail()
 * 
 * // Validate one of multiple values
 * body('status').isIn(['active', 'inactive', 'pending'])
 * 
 * // Custom validation
 * body('age').custom(val => {
 *   if (val < 18) throw new Error('Must be 18+');
 * })
 * 
 * // Conditional based on other field
 * body('password2').custom((val, {req}) => {
 *   if (val !== req.body.password) {
 *     throw new Error('Passwords do not match');
 *   }
 * })
 */
