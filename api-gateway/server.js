import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { body, param, query, validationResult } from 'express-validator';
import mongoSanitize from 'mongo-sanitize';
import xss from 'xss-clean';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { Logger, Monitor } from './logging.js';
import { queueAnalysis, queueRetraining, queueReport, queueEmail, queueNotification, getJobStatus, getQueueStats, initializeQueues, cleanupQueues } from './queue.js';
import axios from 'axios';
import Stripe from 'stripe';
import multer from 'multer';
import csvParser from 'csv-parser';
import { Readable } from 'stream';
import { initializeDatabase, verifyDatabaseSchema, seedInitialData } from './database.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Export app for testing without starting HTTP server
export { app };

// ============================================================
// STRIPE CONFIGURATION
// ============================================================

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  console.warn('⚠️  Warning: STRIPE_SECRET_KEY not defined in .env');
}

export const stripe = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    })
  : null;

if (stripe) {
  console.log('✅ Stripe initialized');
}

// ============================================================
// SECURITY MIDDLEWARE
// ============================================================

// Helmet for security headers
app.use(helmet());

// Data sanitization against NoSQL injection
app.use(mongoSanitize());

// Data sanitization against XSS attacks
app.use(xss());

// Security middleware: Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.param,
        message: err.msg,
        value: err.value,
      })),
    });
  }
  next();
};

// Security middleware: Prevent parameter pollution
const preventParameterPollution = (req, res, next) => {
  // Check for duplicate parameters
  const queryKeys = Object.keys(req.query);
  const bodyKeys = Object.keys(req.body || {});
  
  const intersection = queryKeys.filter(key => bodyKeys.includes(key));
  if (intersection.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Parameter pollution detected',
      details: `Duplicate parameters: ${intersection.join(', ')}`,
    });
  }
  next();
};

app.use(preventParameterPollution);

// CORS Configuration
const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['http://localhost:8080', 'http://127.0.0.1:8080'];

const corsOptions = {
  origin: corsOrigins,
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  maxAge: 86400, // 24 hours
};

app.use(cors(corsOptions));

// ============================================================
// BODY PARSER MIDDLEWARE
// ============================================================

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ============================================================
// LOGGING MIDDLEWARE - ADVANCED
// ============================================================

// Initialize logger
let logger = null;
let monitor = null;

// Initialize logger after Supabase is ready
function initializeLogging(supabaseClient) {
  logger = new Logger(supabaseClient);
  monitor = new Monitor(logger);
  
  // Create custom Morgan tokens
  const tokens = Logger.createMorganTokens();
  Object.entries(tokens).forEach(([name, fn]) => {
    morgan.token(name, fn);
  });

  // Custom Morgan format with detailed information
  const morganFormat = NODE_ENV === 'production' 
    ? ':ipAddress ":method :url HTTP/:http-version" :status :res[content-length] :response-time ms ":user-agent"'
    : ':method :url :status :res[content-length] - :response-time ms [userId: :userId]';

  // Morgan middleware with custom callback
  app.use(morgan(morganFormat, {
    stream: {
      write: (message) => {
        // Log to our custom logger
        if (logger) {
          console.log(message.trim());
        }
      },
    },
    skip: (req, res) => NODE_ENV === 'test',
  }));

  // Request timing middleware
  app.use((req, res, next) => {
    req._startTime = Date.now();
    
    const originalSend = res.send;
    res.send = function(data) {
      const responseTime = Date.now() - req._startTime;
      
      if (logger) {
        logger.logRequest(req, res, responseTime);
      }
      
      return originalSend.call(this, data);
    };

    next();
  });

  console.log('✅ Advanced logging system initialized');
}

// Morgan logging (skip in test environment) - basic fallback
if (NODE_ENV !== 'test' && !logger) {
  const morganFormat = NODE_ENV === 'production' ? 'combined' : 'dev';
  app.use(morgan(morganFormat, {
    skip: (req, res) => res.statusCode < 400,
  }));
}

// ============================================================
// RATE LIMITING MIDDLEWARE
// ============================================================

// Global rate limiter: 100 requests per minute per IP
const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  message: {
    error: 'Muitas requisições deste IP, tente novamente mais tarde.',
    retryAfter: '60 segundos',
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  keyGenerator: (req) => {
    // Use X-Forwarded-For header if behind a proxy
    return req.ip || req.connection.remoteAddress;
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Rate limit exceeded',
      retryAfter: res.getHeader('Retry-After'),
    });
  },
});

// Apply global rate limiter to all API routes
app.use('/api/', globalLimiter);

// Stricter rate limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per 15 minutes
  message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
  skipSuccessfulRequests: true, // Don't count successful requests
});

// ============================================================
// MULTER FILE UPLOAD CONFIGURATION
// ============================================================

const upload = multer({
  storage: multer.memoryStorage(), // Store in memory
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['text/csv', 'application/json', 'application/vnd.ms-excel'];
    const allowedExtensions = ['csv', 'json'];
    
    const extension = file.originalname.split('.').pop().toLowerCase();
    
    if (allowedMimes.includes(file.mimetype) || allowedExtensions.includes(extension)) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and JSON files are allowed'));
    }
  },
});

// ============================================================
// SUPABASE CLIENT INITIALIZATION
// ============================================================

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_ANON_KEY must be defined in .env');
  process.exit(1);
}

// Public Supabase client (anon key - for client-side operations)
export const supabasePublic = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false,
    },
  }
);

// Service role Supabase client (for admin operations)
export const supabaseAdmin = SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

console.log('✅ Supabase clients initialized');

// Initialize logging system with Supabase public client
initializeLogging(supabasePublic);

// ============================================================
// DATABASE INITIALIZATION
// ============================================================

let databaseReady = false;

const initDB = async () => {
  try {
    const schemaInitialized = await initializeDatabase();
    if (schemaInitialized) {
      // Seed dados iniciais (plataformas, planos)
      await seedInitialData();
      databaseReady = true;
      console.log('✅ Database schema and seed data initialized');
    } else {
      console.warn('⚠️  Database initialization skipped - using existing schema');
      databaseReady = true;
    }
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    databaseReady = false;
  }
};

// Initialize database when server starts (skip in test)
if (process.env.NODE_ENV !== 'test') {
  initDB().catch(err => console.error('Database init error:', err));
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Call Python script to recalculate analysis
 * @param {Object} dados - Analysis data
 * @param {Object} contexto - Context information
 * @returns {Object|null} - Recalculated results or null
 */
const callPythonAnalysis = async (dados, contexto) => {
  try {
    // Prepare data for Python
    const pythonInput = {
      dados,
      contexto: contexto ? {
        titulo: contexto.titulo,
        descricao: contexto.descricao,
      } : null,
    };

    // Try to call Python API (if available)
    const pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:5000';
    
    const response = await axios.post(`${pythonApiUrl}/analyze`, pythonInput, {
      timeout: 30000, // 30 second timeout
    });

    if (response.data && response.data.success) {
      return {
        probabilidades: response.data.probabilidades || {},
        confianca: response.data.confianca || 0,
        explicacoes: response.data.explicacoes || [],
      };
    }

    return null;
  } catch (error) {
    console.warn('⚠️  Python analysis failed, returning cached data:', error.message);
    return null;
  }
};

/**
 * Trigger Python retraining endpoint
 * Sends feedback to Python API at localhost:8000/retrain
 * This is a fire-and-forget call (doesn't wait for response)
 */
const triggerPythonRetraining = async (analysisId, result) => {
  try {
    console.log(`🔄 Triggering Python retraining for ${analysisId}...`);

    const payload = {
      analysisId,
      result,
      timestamp: new Date().toISOString(),
    };

    // Call Python retraining endpoint with 30s timeout
    const response = await axios.post(
      'http://localhost:8000/retrain',
      payload,
      {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.PYTHON_API_KEY || 'trinity-api-key',
        },
      }
    );

    console.log(`✅ Python retraining accepted:`, response.data);
    return response.data;
  } catch (error) {
    console.warn('⚠️  Python retraining call failed (non-blocking):', error.message);
    // Don't throw - this is fire-and-forget
    return null;
  }
};

// ============================================================
// MIDDLEWARE UTILITIES
// ============================================================

// Custom middleware to track request/response times
app.use((req, res, next) => {
  req.startTime = Date.now();
  
  // Override res.json to include timing
  const originalJson = res.json.bind(res);
  res.json = function(data) {
    const duration = Date.now() - req.startTime;
    res.set('X-Response-Time', `${duration}ms`);
    return originalJson(data);
  };
  
  next();
});

// Request validation middleware
app.use((req, res, next) => {
  // Validate API key if provided
  const apiKey = req.headers['x-api-key'];
  if (apiKey && apiKey !== process.env.API_SECRET_KEY) {
    return res.status(401).json({
      success: false,
      error: 'Invalid API key',
    });
  }
  next();
});

// ============================================================
// JWT AUTHENTICATION MIDDLEWARE
// ============================================================

/**
 * Middleware to validate Supabase JWT token
 * Extracts user information from the token and attaches to req.user
 */
const authenticateToken = async (req, res, next) => {
  const token = req.headers.authorization?.split('Bearer ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'No authorization token provided',
    });
  }

  // Validate token format
  if (typeof token !== 'string' || token.length < 10) {
    return res.status(401).json({
      success: false,
      error: 'Invalid token format',
    });
  }

  try {
    // Verify the token with Supabase
    const { data: { user }, error } = await supabasePublic.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
        details: error?.message,
      });
    }

    // Validate user object
    if (!user.id || !user.email) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token: missing user information',
      });
    }

    // Attach user to request object (sanitized)
    req.user = {
      id: String(user.id).trim(),
      email: String(user.email).toLowerCase().trim(),
      user_metadata: user.user_metadata || {},
      app_metadata: user.app_metadata || {},
      created_at: user.created_at,
      updated_at: user.updated_at,
    };

    next();
  } catch (err) {
    console.error('Token validation error:', err);
    res.status(401).json({
      success: false,
      error: 'Token validation failed',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
};

/**
 * Optional authentication middleware
 * Attaches user to req.user if token is valid, but doesn't reject if missing
 */
const optionalAuth = async (req, res, next) => {
  const token = req.headers.authorization?.split('Bearer ')[1];

  if (token) {
    try {
      const { data: { user }, error } = await supabasePublic.auth.getUser(token);

      if (user && !error) {
        req.user = {
          id: String(user.id).trim(),
          email: String(user.email).toLowerCase().trim(),
          user_metadata: user.user_metadata || {},
          app_metadata: user.app_metadata || {},
          created_at: user.created_at,
          updated_at: user.updated_at,
        };
      }
    } catch (err) {
      console.warn('Optional auth warning:', err.message);
    }
  }

  next();
};

// ============================================================
// VALIDATION RULES (Express-Validator)
// ============================================================

// Common validators
const validateUUID = param('id')
  .trim()
  .isUUID()
  .withMessage('Invalid UUID format')
  .escape();

const validateEmail = body('email')
  .trim()
  .isEmail()
  .normalizeEmail()
  .withMessage('Invalid email address')
  .escape();

const validatePassword = body('password')
  .trim()
  .isLength({ min: 8 })
  .withMessage('Password must be at least 8 characters')
  .matches(/[A-Z]/)
  .withMessage('Password must contain at least one uppercase letter')
  .matches(/[a-z]/)
  .withMessage('Password must contain at least one lowercase letter')
  .matches(/[0-9]/)
  .withMessage('Password must contain at least one number');

const validateUrl = body('url')
  .trim()
  .isURL({ require_protocol: true })
  .withMessage('Invalid URL format')
  .escape();

const validateString = (field, minLength = 1, maxLength = 500) => 
  body(field)
    .trim()
    .isLength({ min: minLength, max: maxLength })
    .withMessage(`${field} must be between ${minLength} and ${maxLength} characters`)
    .escape();

const validateNumber = (field, min = 0, max = Number.MAX_SAFE_INTEGER) =>
  body(field)
    .isInt({ min, max })
    .withMessage(`${field} must be a number between ${min} and ${max}`);

const validateDateRange = (startField, endField) => [
  body(startField)
    .optional()
    .isISO8601()
    .withMessage(`${startField} must be a valid ISO 8601 date`),
  body(endField)
    .optional()
    .isISO8601()
    .withMessage(`${endField} must be a valid ISO 8601 date`),
  (req, res, next) => {
    if (req.body[startField] && req.body[endField]) {
      const start = new Date(req.body[startField]);
      const end = new Date(req.body[endField]);
      if (start > end) {
        return res.status(400).json({
          success: false,
          error: 'Invalid date range',
          details: `${startField} must be before ${endField}`,
        });
      }
    }
    next();
  }
];

// ============================================================
// ROUTES
// ============================================================

// Health check endpoint (no rate limit)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    uptime: process.uptime(),
    database: databaseReady ? 'ready' : 'initializing',
  });
});

// API health endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API Gateway is running',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    supabaseConnected: !!supabasePublic,
    databaseReady: databaseReady,
  });
});

// Test Supabase connection
app.get('/api/test-supabase', async (req, res) => {
  try {
    const { data, error } = await supabasePublic
      .from('usuarios')
      .select('count', { count: 'exact', head: true });

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Supabase connection failed',
        details: error.message,
      });
    }

    res.json({
      success: true,
      message: 'Supabase connection successful',
      usuariosCount: data?.count || 0,
      databaseReady: databaseReady,
    });
  } catch (err) {
    console.error('Supabase test error:', err);
    res.status(500).json({
      success: false,
      error: 'Supabase test failed',
      details: err.message,
    });
  }
});

// Database schema status endpoint
app.get('/api/database/schema', async (req, res) => {
  try {
    const schema = await verifyDatabaseSchema();

    res.json({
      success: true,
      message: 'Database schema status',
      schema: schema,
      databaseReady: databaseReady,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Schema check error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to check schema',
      details: err.message,
    });
  }
});

// Database tables endpoint
app.get('/api/database/tables', async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(503).json({
        success: false,
        error: 'Database admin client not available',
      });
    }

    const tables = [
      'usuarios',
      'contextos',
      'plataformas',
      'planos',
      'assinaturas',
      'analises',
      'feedbacks',
    ];

    const status = {};

    for (const table of tables) {
      const { count, error } = await supabaseAdmin
        .from(table)
        .select('count', { count: 'exact', head: true });

      status[table] = {
        exists: !error,
        records: count || 0,
        error: error?.message || null,
      };
    }

    res.json({
      success: true,
      message: 'Database tables status',
      tables: status,
      databaseReady: databaseReady,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Tables check error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to check tables',
      details: err.message,
    });
  }
});

// ============================================================
// PUBLIC ENDPOINTS (No Authentication Required)
// ============================================================

/**
 * Get platforms list with optional niche filter
 * Supports query parameter: ?niche=sports
 */
app.get('/api/platforms', async (req, res) => {
  try {
    const { niche } = req.query;

    console.log(`📱 Fetching platforms${niche ? ` for niche: ${niche}` : ''}`);

    // Build query
    let query = supabasePublic
      .from('plataformas')
      .select('*');

    // Apply niche filter if provided
    if (niche && typeof niche === 'string') {
      query = query.eq('nicho', niche.toLowerCase());
    }

    // Execute query
    const { data: platforms, error } = await query;

    if (error) {
      console.error('Failed to fetch platforms:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch platforms',
        details: error.message,
      });
    }

    // Check if no platforms found with filter
    if (!platforms || platforms.length === 0) {
      const message = niche 
        ? `No platforms found for niche: ${niche}`
        : 'No platforms available';
      
      return res.json({
        success: true,
        message: message,
        data: [],
        count: 0,
        filters: {
          niche: niche || null,
        },
      });
    }

    res.json({
      success: true,
      message: 'Platforms retrieved successfully',
      data: platforms,
      count: platforms.length,
      filters: {
        niche: niche || null,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Platforms endpoint error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch platforms',
      details: err.message,
    });
  }
});

// Get subscription plans
app.get('/api/plans', async (req, res) => {
  try {
    console.log('📋 Fetching subscription plans...');

    // Query plans table from Supabase
    const { data: plans, error: queryError } = await supabasePublic
      .from('planos')
      .select('*')
      .order('preco', { ascending: true });

    if (queryError) {
      console.error('❌ Failed to fetch plans:', queryError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch plans',
        details: queryError.message,
      });
    }

    console.log(`✅ Retrieved ${plans?.length || 0} plans`);

    res.json({
      success: true,
      message: 'Plans fetched successfully',
      data: plans || [],
      count: plans?.length || 0,
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error('❌ Plans endpoint error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve plans',
      details: err.message,
    });
  }
});

// Get analysis results by ID
app.get('/api/results/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { recalculate } = req.query;

    console.log(`📊 Fetching analysis results for ID: ${id}${recalculate ? ' (recalculating)' : ''}`);

    // Validate ID format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid analysis ID format',
        details: 'ID must be a valid UUID',
      });
    }

    // Fetch analysis from database
    const { data: analysis, error: fetchError } = await supabasePublic
      .from('analises')
      .select(`
        *,
        contextos:context_id(id, titulo, descricao),
        usuarios:user_id(id, email, nome)
      `)
      .eq('id', id)
      .single();

    if (fetchError || !analysis) {
      console.error('Analysis not found:', fetchError);
      return res.status(404).json({
        success: false,
        error: 'Analysis not found',
        details: `No analysis found with ID: ${id}`,
      });
    }

    // Check if recalculation is needed
    let result = {
      id: analysis.id,
      titulo: analysis.titulo,
      descricao: analysis.descricao,
      contexto: analysis.contextos,
      usuario: analysis.usuarios,
      status: analysis.status,
      criado_em: analysis.criado_em,
      atualizado_em: analysis.atualizado_em,
      dados: {},
      probabilidades: {},
      confianca: 0,
      explicacoes: [],
      recalculado: false,
    };

    // Parse existing data if available
    if (analysis.dados && typeof analysis.dados === 'string') {
      try {
        result.dados = JSON.parse(analysis.dados);
      } catch (e) {
        result.dados = analysis.dados;
      }
    } else if (analysis.dados) {
      result.dados = analysis.dados;
    }

    // Parse existing probabilidades if available
    if (analysis.probabilidades && typeof analysis.probabilidades === 'string') {
      try {
        result.probabilidades = JSON.parse(analysis.probabilidades);
      } catch (e) {
        result.probabilidades = analysis.probabilidades;
      }
    } else if (analysis.probabilidades) {
      result.probabilidades = analysis.probabilidades;
    }

    // Parse confianca if available
    if (analysis.confianca) {
      result.confianca = typeof analysis.confianca === 'string' 
        ? parseFloat(analysis.confianca) 
        : analysis.confianca;
    }

    // Parse explicações if available
    if (analysis.explicacoes) {
      if (typeof analysis.explicacoes === 'string') {
        try {
          result.explicacoes = JSON.parse(analysis.explicacoes);
        } catch (e) {
          result.explicacoes = [analysis.explicacoes];
        }
      } else if (Array.isArray(analysis.explicacoes)) {
        result.explicacoes = analysis.explicacoes;
      }
    }

    // Recalculate if requested
    if (recalculate === 'true' && result.dados && Object.keys(result.dados).length > 0) {
      console.log(`🔄 Recalculating analysis ${id}...`);
      
      try {
        // Call Python script for recalculation
        const pythonResult = await callPythonAnalysis(result.dados, result.contexto);
        
        if (pythonResult) {
          result.probabilidades = pythonResult.probabilidades || result.probabilidades;
          result.confianca = pythonResult.confianca || result.confianca;
          result.explicacoes = pythonResult.explicacoes || result.explicacoes;
          result.recalculado = true;

          // Update database with new results (optional)
          if (analysis.id) {
            await supabasePublic
              .from('analises')
              .update({
                probabilidades: JSON.stringify(result.probabilidades),
                confianca: result.confianca,
                explicacoes: JSON.stringify(result.explicacoes),
                atualizado_em: new Date().toISOString(),
              })
              .eq('id', analysis.id);
          }
        }
      } catch (pythonError) {
        console.error('Error recalculating analysis:', pythonError);
        // Don't fail the request, just log and return existing data
        result.recalculado = false;
        result.aviso = 'Recalculation failed, returning cached results';
      }
    }

    // Ensure all required fields are present
    const structuredResult = {
      success: true,
      message: 'Analysis retrieved successfully',
      data: {
        id: result.id,
        titulo: result.titulo,
        descricao: result.descricao,
        status: result.status,
        contexto: result.contexto,
        usuario: result.usuario,
        
        // Core results
        probabilidades: {
          vitoria: result.probabilidades.vitoria || 0,
          empate: result.probabilidades.empate || 0,
          derrota: result.probabilidades.derrota || 0,
          ...result.probabilidades,
        },
        confianca: result.confianca || 0,
        explicacoes: result.explicacoes || [],
        
        // Raw data for advanced users
        dados: result.dados || {},
        
        // Metadata
        recalculado: result.recalculado,
        timestamps: {
          criado_em: result.criado_em,
          atualizado_em: result.atualizado_em,
          consultado_em: new Date().toISOString(),
        },
      },
    };

    res.json(structuredResult);
  } catch (err) {
    console.error('Results endpoint error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analysis results',
      details: err.message,
    });
  }
});

// ============================================================
// PROTECTED ROUTES (Require Authentication)
// ============================================================

// Get user profile
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const { data: usuario, error } = await supabasePublic
      .from('usuarios')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      message: 'User profile retrieved',
      user: {
        ...req.user,
        ...usuario,
      },
    });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to get user profile',
      details: err.message,
    });
  }
});

// Update user profile
app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const { perfil } = req.body;

    if (!perfil) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: perfil',
      });
    }

    const { data, error } = await supabasePublic
      .from('usuarios')
      .update({
        perfil,
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.user.id)
      .select();

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update profile',
        details: error.message,
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: data[0],
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile',
      details: err.message,
    });
  }
});

// Update user settings
app.put('/api/settings', authenticateToken, async (req, res) => {
  try {
    console.log('⚙️ Updating settings for user:', req.user.id);

    const {
      perfil,
      notificacoes,
      privacidade,
      idioma,
      tema,
      notificacoes_email,
      notificacoes_push,
    } = req.body;

    // Build update object with only provided fields
    const updateData = {};
    if (perfil !== undefined) updateData.perfil = perfil;
    if (notificacoes !== undefined) updateData.notificacoes = notificacoes;
    if (privacidade !== undefined) updateData.privacidade = privacidade;
    if (idioma !== undefined) updateData.idioma = idioma;
    if (tema !== undefined) updateData.tema = tema;
    if (notificacoes_email !== undefined)
      updateData.notificacoes_email = notificacoes_email;
    if (notificacoes_push !== undefined)
      updateData.notificacoes_push = notificacoes_push;

    // Always update timestamp
    updateData.updated_at = new Date().toISOString();

    // If no fields to update, return error
    if (Object.keys(updateData).length === 1) {
      // Only timestamp
      return res.status(400).json({
        success: false,
        error: 'No settings provided to update',
      });
    }

    // Update user settings in Supabase
    const { data, error } = await supabasePublic
      .from('usuarios')
      .update(updateData)
      .eq('id', req.user.id)
      .select();

    if (error) {
      console.error('❌ Failed to update settings:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update settings',
        details: error.message,
      });
    }

    if (!data || data.length === 0) {
      console.error('❌ User not found:', req.user.id);
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    console.log('✅ Settings updated successfully for user:', req.user.id);

    res.json({
      success: true,
      message: 'Configurações atualizadas',
      data: {
        id: data[0].id,
        email: data[0].email,
        perfil: data[0].perfil,
        notificacoes: data[0].notificacoes,
        privacidade: data[0].privacidade,
        idioma: data[0].idioma,
        tema: data[0].tema,
        notificacoes_email: data[0].notificacoes_email,
        notificacoes_push: data[0].notificacoes_push,
        updated_at: data[0].updated_at,
      },
    });
  } catch (err) {
    console.error('❌ Update settings error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to update settings',
      details: err.message,
    });
  }
});

// Get current user subscription
app.get('/api/subscription', authenticateToken, async (req, res) => {
  try {
    console.log('📋 Fetching current subscription for user:', req.user.id);

    // Get active subscription for user
    const { data: subscriptions, error: subError } = await supabasePublic
      .from('assinaturas')
      .select('id, plan_id, status, data_inicio, data_fim, recursos:planos(id, nome, preco, recursos, descricao)')
      .eq('user_id', req.user.id)
      .eq('status', 'ativa')
      .order('data_inicio', { ascending: false })
      .limit(1);

    if (subError) {
      console.error('❌ Failed to fetch subscription:', subError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch subscription',
        details: subError.message,
      });
    }

    // No active subscription found
    if (!subscriptions || subscriptions.length === 0) {
      console.log('ℹ️  No active subscription found for user:', req.user.id);
      return res.status(404).json({
        success: false,
        error: 'No active subscription found',
        details: 'User does not have an active subscription',
      });
    }

    const subscription = subscriptions[0];
    const planDetails = Array.isArray(subscription.recursos) 
      ? subscription.recursos[0] 
      : subscription.recursos;

    // Build response with plan details
    const response = {
      success: true,
      message: 'Current subscription retrieved',
      data: {
        subscriptionId: subscription.id,
        planId: subscription.plan_id,
        planName: planDetails?.nome || 'Unknown Plan',
        planPrice: planDetails?.preco || 0,
        planDescription: planDetails?.descricao || null,
        status: subscription.status,
        startDate: subscription.data_inicio,
        endDate: subscription.data_fim,
        // Plan resources/features
        resources: planDetails?.recursos || {},
        // Calculate remaining days if end date exists
        daysRemaining: subscription.data_fim 
          ? Math.max(0, Math.ceil((new Date(subscription.data_fim) - new Date()) / (1000 * 60 * 60 * 24)))
          : null,
        // Status indicators
        isActive: subscription.status === 'ativa',
        isCancelled: subscription.status === 'cancelada',
      },
      timestamp: new Date().toISOString(),
    };

    console.log(`✅ Subscription retrieved: ${response.data.planName} (${response.data.status})`);

    res.json(response);

  } catch (err) {
    console.error('❌ Get subscription error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to get subscription',
      details: err.message,
    });
  }
});

// Get user subscriptions
app.get('/api/auth/subscriptions', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabasePublic
      .from('assinaturas')
      .select('*, planos(*)')
      .eq('user_id', req.user.id);

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch subscriptions',
        details: error.message,
      });
    }

    res.json({
      success: true,
      message: 'User subscriptions retrieved',
      subscriptions: data || [],
    });
  } catch (err) {
    console.error('Get subscriptions error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to get subscriptions',
      details: err.message,
    });
  }
});

// Get user analyses
app.get('/api/auth/analyses', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabasePublic
      .from('analises')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch analyses',
        details: error.message,
      });
    }

    res.json({
      success: true,
      message: 'User analyses retrieved',
      analyses: data || [],
      total: data?.length || 0,
    });
  } catch (err) {
    console.error('Get analyses error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to get analyses',
      details: err.message,
    });
  }
});

// Get user analysis history with optional filters
app.get('/api/history', authenticateToken, async (req, res) => {
  try {
    console.log('📊 Fetching analysis history for user:', req.user.id);

    const { data_inicio, data_fim, nicho, limit = 50, offset = 0 } = req.query;

    // Build query
    let query = supabasePublic
      .from('analises')
      .select('*', { count: 'exact' })
      .eq('user_id', req.user.id);

    // Apply date filter
    if (data_inicio) {
      query = query.gte('created_at', new Date(data_inicio).toISOString());
    }
    if (data_fim) {
      query = query.lte('created_at', new Date(data_fim).toISOString());
    }

    // Apply niche/market filter
    if (nicho) {
      query = query.ilike('nicho', `%${nicho}%`);
    }

    // Apply ordering, pagination
    query = query
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('❌ Failed to fetch history:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch analysis history',
        details: error.message,
      });
    }

    // Calculate learning metrics
    const metrics = {
      totalAnalyses: count || 0,
      analyzedNiches: [...new Set((data || []).map(a => a.nicho))].length,
      averageAccuracy: data && data.length > 0
        ? (data.reduce((sum, a) => sum + (a.acuracia || 0), 0) / data.length).toFixed(2)
        : 0,
      mostUsedMetric: data && data.length > 0
        ? findMostCommon(data.map(a => a.metrica_principal))
        : null,
      latestAnalysis: data && data.length > 0 ? data[0].created_at : null,
      totalThisMonth: data && data.length > 0
        ? data.filter(a => {
            const date = new Date(a.created_at);
            const now = new Date();
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
          }).length
        : 0,
    };

    console.log(`✅ History fetched: ${data?.length || 0} analyses, total: ${count}`);

    res.json({
      success: true,
      message: 'Analysis history retrieved',
      data: {
        analyses: data || [],
        pagination: {
          total: count || 0,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: (parseInt(offset) + parseInt(limit)) < (count || 0),
        },
        metrics,
        filters: {
          dataInicio: data_inicio || null,
          dataFim: data_fim || null,
          nicho: nicho || null,
        },
      },
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error('❌ Get history error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to get analysis history',
      details: err.message,
    });
  }
});

// Helper function: Find most common element in array
function findMostCommon(arr) {
  if (!arr || arr.length === 0) return null;
  const frequency = {};
  let maxCount = 0;
  let mostCommon = null;

  for (const item of arr) {
    frequency[item] = (frequency[item] || 0) + 1;
    if (frequency[item] > maxCount) {
      maxCount = frequency[item];
      mostCommon = item;
    }
  }

  return mostCommon;
}

// ============================================================
// STRIPE ROUTES
// ============================================================

// Create Stripe checkout session
app.post('/api/stripe/checkout', authenticateToken, async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({
        success: false,
        error: 'Stripe is not configured',
      });
    }

    const { planId } = req.body;
    const userId = req.user?.id;

    if (!planId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: planId',
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        details: 'User ID not found in token',
      });
    }

    console.log(`💳 Creating checkout session for user ${userId}, plan ${planId}`);

    // 1. Fetch plan details from Supabase
    const { data: plan, error: planError } = await supabasePublic
      .from('planos')
      .select('*')
      .eq('id', planId)
      .single();

    if (planError || !plan) {
      console.error('❌ Plan not found:', planError);
      return res.status(404).json({
        success: false,
        error: 'Plan not found',
        details: planError?.message || 'Plan does not exist',
      });
    }

    console.log(`✅ Found plan: ${plan.nome} - R$ ${plan.preco}`);

    // 2. Get user email from Supabase
    const { data: user, error: userError } = await supabasePublic
      .from('usuarios')
      .select('email, nome')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.error('❌ User not found:', userError);
      return res.status(404).json({
        success: false,
        error: 'User not found',
        details: userError?.message || 'User does not exist',
      });
    }

    // 3. Create Stripe checkout session
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: user.email,
      client_reference_id: userId,
      
      // Line items with plan details
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: plan.nome,
              description: plan.descricao || 'Trinity of Luck Plan',
              metadata: {
                planId: plan.id,
                planName: plan.nome,
              },
            },
            unit_amount: Math.round(plan.preco * 100), // Convert to cents
            recurring: {
              interval: plan.ciclo === 'yearly' ? 'year' : 'month',
              interval_count: 1,
            },
          },
          quantity: 1,
        },
      ],

      // Success and cancellation URLs
      success_url: `${baseUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/subscription/cancel`,

      // Metadata for webhook processing
      metadata: {
        userId,
        planId: plan.id,
        planName: plan.nome,
        planPrice: plan.preco,
      },

      // Customer data
      customer_creation: 'if_required',
    });

    console.log(`✅ Checkout session created: ${session.id}`);

    res.json({
      success: true,
      message: 'Checkout session created',
      data: {
        sessionId: session.id,
        url: session.url,
        planName: plan.nome,
        planPrice: plan.preco,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error('❌ Stripe checkout error:', err);
    res.status(500).json({
      success: false,
      error: 'Stripe checkout failed',
      details: err.message,
    });
  }
});

// ============================================================
// CONTEXT IMPORT ENDPOINT
// ============================================================

/**
 * Import context from external URL
 * Validates URL, fetches data, processes and stores in database
 */
app.post('/api/import-context', authenticateToken, async (req, res) => {
  try {
    const { url } = req.body;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid URL parameter',
      });
    }

    // Validate URL format and protocol
    let urlObj;
    try {
      urlObj = new URL(url);
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: 'Invalid URL format',
        details: 'URL must be a valid, properly formatted URL',
      });
    }

    // Verify HTTPS protocol
    if (urlObj.protocol !== 'https:') {
      return res.status(400).json({
        success: false,
        error: 'Invalid protocol',
        details: 'Only HTTPS URLs are allowed',
      });
    }

    // Allowed domains list
    const ALLOWED_DOMAINS = [
      'polymarket.com',
      'espn.com',
      'sports.espn.go.com',
      'weather.com',
      'news.ycombinator.com',
      'reddit.com',
      'twitter.com',
      'x.com',
      'wikipedia.org',
    ];

    // Check if domain is in allowed list
    const hostname = urlObj.hostname.toLowerCase();
    const isAllowedDomain = ALLOWED_DOMAINS.some(domain => 
      hostname === domain || hostname.endsWith('.' + domain)
    );

    if (!isAllowedDomain) {
      return res.status(403).json({
        success: false,
        error: 'Domain not allowed',
        details: `This domain is not in the allowed list. Allowed domains: ${ALLOWED_DOMAINS.join(', ')}`,
        allowedDomains: ALLOWED_DOMAINS,
      });
    }

    console.log(`📥 Importing context from: ${url}`);

    // Fetch URL content
    let htmlContent;
    try {
      const response = await axios.get(url, {
        timeout: 10000, // 10 second timeout
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });
      htmlContent = response.data;
    } catch (err) {
      console.error('Failed to fetch URL:', err.message);
      return res.status(400).json({
        success: false,
        error: 'Failed to fetch URL content',
        details: err.message || 'Unable to retrieve content from the provided URL',
      });
    }

    // Parse HTML content using Cheerio
    const cheerio = await import('cheerio');
    const $ = cheerio.load(htmlContent);

    // Extract page data
    const title = $('title').text() || $('h1').first().text() || 'Untitled';
    const description = $('meta[name="description"]').attr('content') || '';
    const ogImage = $('meta[property="og:image"]').attr('content') || '';

    // Extract events and variables based on domain
    let events = [];
    let variables = {};

    // Domain-specific parsing
    if (hostname.includes('polymarket')) {
      // Parse Polymarket event data
      events = [];
      $('[data-market], article, .market').each((i, elem) => {
        const eventTitle = $(elem).find('h2, h3, .title').text().trim();
        if (eventTitle) {
          events.push({
            name: eventTitle,
            source: 'polymarket',
            timestamp: new Date().toISOString(),
          });
        }
      });
      
      variables = {
        source: 'polymarket',
        pageTitle: title,
        marketCount: events.length,
      };
    } else if (hostname.includes('espn')) {
      // Parse ESPN sports data
      events = [];
      $('.Table, .Score-box, [data-sport]').each((i, elem) => {
        const eventText = $(elem).text().trim();
        if (eventText && eventText.length > 5) {
          events.push({
            name: eventText.substring(0, 100),
            source: 'espn',
            timestamp: new Date().toISOString(),
          });
        }
      });

      variables = {
        source: 'espn',
        pageTitle: title,
        sport: $('body').attr('data-sport') || 'general',
        eventCount: events.length,
      };
    } else if (hostname.includes('weather')) {
      // Parse weather data
      const tempElements = $('[role="heading"], .temperature, .temp').text();
      events.push({
        name: title,
        data: tempElements,
        source: 'weather',
        timestamp: new Date().toISOString(),
      });

      variables = {
        source: 'weather',
        pageTitle: title,
        extractedElements: $('*').length,
      };
    } else {
      // Generic parsing for other domains
      const paragraphs = [];
      $('p, h2, h3, article').each((i, elem) => {
        const text = $(elem).text().trim();
        if (text && text.length > 10 && i < 10) {
          paragraphs.push(text);
        }
      });

      events = paragraphs.map((text, idx) => ({
        name: text.substring(0, 150),
        index: idx,
        source: hostname,
        timestamp: new Date().toISOString(),
      }));

      variables = {
        source: hostname,
        pageTitle: title,
        pageDescription: description,
        ogImage: ogImage,
        elementCount: $('*').length,
      };
    }

    // If no events were extracted, add metadata as event
    if (events.length === 0) {
      events.push({
        name: `Data from ${hostname}`,
        type: 'metadata',
        source: hostname,
        timestamp: new Date().toISOString(),
      });
    }

    // Create context object
    const contextData = {
      user_id: req.user.id,
      plataforma_id: null, // Can be set later if needed
      url: url,
      titulo: title,
      dados_entrada: {
        url: url,
        hostname: hostname,
        description: description,
        fetchedAt: new Date().toISOString(),
      },
      eventos: events,
      variáveis: variables,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Store in Supabase
    const { data: storedContext, error: storeError } = await supabasePublic
      .from('contextos')
      .insert([contextData])
      .select();

    if (storeError) {
      console.error('Failed to store context:', storeError);
      return res.status(500).json({
        success: false,
        error: 'Failed to store context in database',
        details: storeError.message,
      });
    }

    console.log(`✅ Context imported and stored: ${storedContext[0]?.id}`);

    res.json({
      success: true,
      message: 'Context imported successfully',
      context: {
        id: storedContext[0]?.id,
        url: url,
        title: title,
        events: events,
        variables: variables,
        eventCount: events.length,
        sourceHostname: hostname,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('Context import error:', err);
    res.status(500).json({
      success: false,
      error: 'Context import failed',
      details: err.message,
    });
  }
});

// ============================================================
// FILE UPLOAD ENDPOINT
// ============================================================

/**
 * Upload CSV/JSON file
 * Parses file, cleans data (removes nulls), stores in contextos table
 */
app.post('/api/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided',
        error: 'File is required',
      });
    }

    const filename = req.file.originalname;
    const fileExtension = filename.split('.').pop().toLowerCase();

    console.log(`📤 Processing file upload: ${filename}`);

    let parsedData = [];

    if (fileExtension === 'csv') {
      // Parse CSV file
      await new Promise((resolve, reject) => {
        Readable.from([req.file.buffer])
          .pipe(csvParser())
          .on('data', (row) => {
            // Clean row: remove null and undefined values
            const cleanedRow = Object.fromEntries(
              Object.entries(row).filter(([_, v]) => v != null && v !== '')
            );
            if (Object.keys(cleanedRow).length > 0) {
              parsedData.push(cleanedRow);
            }
          })
          .on('end', () => resolve())
          .on('error', reject);
      });
    } else if (fileExtension === 'json') {
      // Parse JSON file
      try {
        const jsonContent = req.file.buffer.toString('utf-8');
        let jsonData = JSON.parse(jsonContent);

        // Ensure it's an array
        if (Array.isArray(jsonData)) {
          parsedData = jsonData;
        } else if (typeof jsonData === 'object') {
          parsedData = [jsonData];
        } else {
          return res.status(400).json({
            success: false,
            message: 'Invalid JSON format',
            error: 'JSON must be an object or array of objects',
          });
        }

        // Clean data: remove null and undefined values
        parsedData = parsedData.map(item => {
          if (typeof item === 'object' && item !== null) {
            return Object.fromEntries(
              Object.entries(item).filter(([_, v]) => v != null && v !== '')
            );
          }
          return item;
        });
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: 'Failed to parse JSON',
          error: err.message,
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Unsupported file format',
        error: 'Only CSV and JSON files are supported',
      });
    }

    if (parsedData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid data in file',
        error: 'File contains no valid records after cleaning',
      });
    }

    console.log(`📊 Parsed ${parsedData.length} records from ${filename}`);

    // Prepare context object for storage
    const contextData = {
      user_id: req.user.id,
      titulo: filename,
      tipo_origem: 'upload',
      url: null,
      dados_brutos: {
        filename: filename,
        fileType: fileExtension,
        recordCount: parsedData.length,
        uploadedAt: new Date().toISOString(),
      },
      dados_processados: parsedData,
      eventos: [], // Empty for file uploads
      variaveis: {
        source: 'file_upload',
        filename: filename,
        format: fileExtension,
        recordCount: parsedData.length,
      },
      tags: [fileExtension, 'uploaded', 'fallback'],
      status: 'ativo',
      criado_em: new Date().toISOString(),
    };

    // Store in Supabase contextos table
    const { data: storedData, error: storeError } = await supabasePublic
      .from('contextos')
      .insert([contextData])
      .select();

    if (storeError) {
      console.error('Failed to store uploaded data:', storeError);
      return res.status(500).json({
        success: false,
        message: 'Failed to store data',
        error: storeError.message,
      });
    }

    console.log(`✅ File uploaded and stored: ${storedData[0]?.id}`);

    res.json({
      success: true,
      message: 'Uploaded',
      data: {
        id: storedData[0]?.id,
        filename: filename,
        format: fileExtension,
        recordsProcessed: parsedData.length,
        records: parsedData,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('File upload error:', err);
    res.status(500).json({
      success: false,
      message: 'Upload failed',
      error: err.message,
    });
  }
});

// Send feedback and trigger learning loop
app.post('/api/feedback', async (req, res) => {
  try {
    const { analysisId, result } = req.body;

    // Validate input
    if (!analysisId || !result) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        details: 'analysisId and result are required',
      });
    }

    // Validate result format (should be boolean or string outcome)
    const validResults = ['vitoria', 'empate', 'derrota', 'correto', 'incorreto', true, false];
    if (!validResults.includes(result)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid result value',
        details: `result must be one of: ${validResults.join(', ')}`,
      });
    }

    console.log(`📝 Received feedback for analysis ${analysisId}: ${result}`);

    // 1. Save feedback to Supabase
    const feedbackData = {
      analysis_id: analysisId,
      resultado: result,
      criado_em: new Date().toISOString(),
    };

    const { data: feedback, error: dbError } = await supabasePublic
      .from('feedbacks')
      .insert([feedbackData])
      .select()
      .single();

    if (dbError) {
      console.error('❌ Failed to save feedback:', dbError);
      return res.status(500).json({
        success: false,
        error: 'Failed to save feedback',
        details: dbError.message,
      });
    }

    console.log(`✅ Feedback saved with ID: ${feedback.id}`);

    // 2. Trigger Python learning loop (fire-and-forget, don't wait)
    triggerPythonRetraining(analysisId, result).catch(err => {
      console.warn('⚠️  Python retraining failed (non-blocking):', err.message);
      // Don't fail the request if Python is unavailable
    });

    // 3. Return success response
    res.json({
      success: true,
      message: 'Feedback enviado',
      data: {
        feedbackId: feedback.id,
        analysisId,
        result,
        timestamp: feedback.criado_em,
      },
    });

  } catch (err) {
    console.error('❌ Feedback endpoint error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to process feedback',
      details: err.message,
    });
  }
});

// ============================================================
// FUTURE FEATURES - PLACEHOLDERS FOR DEVELOPMENT
// ============================================================

/**
 * [FUTURE] Enhanced Analysis with Multi-Niche Filtering
 * Endpoint: POST /api/analyze
 * 
 * Features to implement:
 * - Multi-niche filtering: Filter analysis by multiple market segments/niches
 * - Cross-niche correlation: Analyze relationships between different niches
 * - Niche-specific ML models: Train specialized models per niche
 * - Niche metadata: Store and query niche-specific metrics
 * - Comparison analysis: Compare predictions across multiple niches
 * 
 * Example request:
 * {
 *   "contextId": "uuid",
 *   "niches": ["sports", "crypto", "politics"],
 *   "filters": {
 *     "includeHistorical": true,
 *     "timeRange": "7d",
 *     "minConfidence": 0.6
 *   },
 *   "compareAcrossNiches": true
 * }
 * 
 * TODO: Implement multi-niche filtering logic
 * TODO: Add niche correlation analysis
 * TODO: Create niche-specific model training pipeline
 * TODO: Add niche metadata to analysis response
 * TODO: Implement cross-niche comparison endpoints
 */
app.post('/api/analyze', authenticateToken, async (req, res) => {
  try {
    // PLACEHOLDER: Multi-niche filtering will be implemented here
    // For now, return a feature not yet implemented response
    return res.status(501).json({
      success: false,
      error: 'Multi-niche analysis feature is under development',
      details: 'This endpoint will support analysis with multiple niche filters',
      status: 'planned',
      expectedFeatures: [
        'Multi-niche filtering',
        'Cross-niche correlation analysis',
        'Niche-specific ML models',
        'Niche-specific metrics',
        'Cross-niche comparison'
      ],
      plannedRelease: '2026-Q2'
    });
  } catch (err) {
    console.error('❌ Multi-niche analysis error:', err);
    res.status(500).json({
      success: false,
      error: 'Analysis failed',
      details: err.message,
    });
  }
});

/**
 * [FUTURE] Data Export Endpoint
 * Endpoint: POST /api/export
 * 
 * Features to implement:
 * - Export analysis results in multiple formats (CSV, JSON, PDF, Excel)
 * - Bulk export: Export multiple analyses at once
 * - Filtered export: Export with custom filters applied
 * - Scheduled exports: Set up automatic periodic exports
 * - Export templates: Custom export formats/layouts
 * - Compression: Support for ZIP exports of large datasets
 * 
 * Example request:
 * {
 *   "analysisIds": ["uuid1", "uuid2"],
 *   "format": "csv|json|pdf|excel|zip",
 *   "filters": {
 *     "dateRange": "7d",
 *     "includeMetadata": true,
 *     "includeExplanations": true
 *   },
 *   "scheduling": {
 *     "enabled": false,
 *     "frequency": "daily|weekly|monthly",
 *     "email": "user@example.com"
 *   }
 * }
 * 
 * TODO: Implement format-specific export methods
 * TODO: Add export compression support
 * TODO: Implement scheduled export queue
 * TODO: Add export templates system
 * TODO: Implement S3/cloud storage integration for exports
 * TODO: Add email delivery for scheduled exports
 * TODO: Implement rate limiting for large exports
 */
app.post('/api/export', authenticateToken, async (req, res) => {
  try {
    const { analysisIds, format = 'json' } = req.body;

    // PLACEHOLDER: Export functionality will be implemented here
    if (!analysisIds || analysisIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: analysisIds',
      });
    }

    // Validate format
    const supportedFormats = ['json', 'csv', 'pdf', 'excel', 'zip'];
    if (!supportedFormats.includes(format)) {
      return res.status(400).json({
        success: false,
        error: 'Unsupported export format',
        supported: supportedFormats,
      });
    }

    // PLACEHOLDER: Return feature roadmap
    return res.status(501).json({
      success: false,
      error: 'Data export feature is under development',
      details: `Export to ${format} format will be available soon`,
      status: 'planned',
      supportedFormats: supportedFormats,
      expectedFeatures: [
        'Multi-format export (JSON, CSV, PDF, Excel)',
        'Bulk export with filtering',
        'Scheduled periodic exports',
        'Custom export templates',
        'ZIP compression for large exports',
        'Email delivery option',
        'Cloud storage integration'
      ],
      plannedRelease: '2026-Q2'
    });
  } catch (err) {
    console.error('❌ Export error:', err);
    res.status(500).json({
      success: false,
      error: 'Export failed',
      details: err.message,
    });
  }
});

/**
 * [FUTURE] Microservices Migration Infrastructure
 * 
 * Current Architecture:
 * - Monolithic Node.js API Gateway (server.js)
 * - All routes in single server instance
 * - Queue system with Bull for background jobs
 * 
 * Migration Path (Phased Approach):
 * 
 * Phase 1: Service Discovery & Communication
 * - [ ] Implement service registry (Consul/Eureka alternative)
 * - [ ] Add gRPC support for inter-service communication
 * - [ ] Create API Gateway router with service discovery
 * - [ ] Implement circuit breaker pattern for fault tolerance
 * - [ ] Add distributed tracing (Jaeger/OpenTelemetry)
 * 
 * Phase 2: Separate Core Microservices
 * - [ ] Analysis Service (extract /api/results, /api/analyze)
 * - [ ] User Service (extract /api/auth/*, /api/settings)
 * - [ ] Subscription Service (extract /api/stripe/*, /api/plans)
 * - [ ] Import Service (extract /api/import-context, /api/upload)
 * - [ ] Queue/Worker Service (separate job processing)
 * 
 * Phase 3: Database Separation
 * - [ ] Database per service pattern
 * - [ ] Implement event sourcing for cross-service communication
 * - [ ] Create saga patterns for distributed transactions
 * - [ ] Implement data synchronization mechanism
 * 
 * Phase 4: Infrastructure & DevOps
 * - [ ] Containerize each microservice (Docker)
 * - [ ] Kubernetes orchestration (EKS/GKE/AKS)
 * - [ ] Service mesh (Istio for load balancing/security)
 * - [ ] Distributed logging (ELK Stack)
 * - [ ] Metrics & monitoring (Prometheus/Grafana)
 * 
 * Current Issues to Address:
 * - Shared database: Multiple services accessing 'contextos', 'analises', etc.
 * - Authentication: JWT validation currently in middleware
 * - Queue system: Bull Redis dependency across services
 * - Python service calls: Direct axios calls to external Python API
 * - Stripe webhook handling: Tightly coupled with user subscriptions
 * 
 * Migration Checkpoints:
 * ✓ Phase 0: Current monolithic structure documented
 * - Phase 1: Prepare service contracts and APIs
 * - Phase 2: Extract first microservice (likely Analysis Service)
 * - Phase 3: Set up inter-service communication
 * - Phase 4: Migrate remaining services progressively
 * - Phase 5: Decommission monolithic server
 * 
 * References:
 * - Event-driven architecture: https://martinfowler.com/articles/201701-event-driven.html
 * - Microservices patterns: https://microservices.io/patterns/index.html
 * - gRPC: https://grpc.io/
 * - Kubernetes: https://kubernetes.io/
 * - Service mesh: https://istio.io/
 * 
 * Related TODOs in codebase:
 * - Line 2154: TODO in Stripe webhook (payment_intent handling)
 * - Line 2166: TODO in Stripe webhook (subscription management)
 * - Python API integration requires separate authentication service
 * - Queue system needs to be service-agnostic
 */

// ============================================================
// WEBHOOK HANDLERS
// ============================================================

/**
 * Handle checkout.session.completed event
 * Creates or updates subscription in database
 * @param {Object} session - Stripe checkout session object
 */
async function handleCheckoutSessionCompleted(session) {
  try {
    console.log('Processing checkout.session.completed:', session.id);

    // Extract metadata
    const { userId, planId } = session.metadata;

    if (!userId || !planId) {
      console.error('Missing metadata in checkout session:', {
        sessionId: session.id,
        metadata: session.metadata,
      });
      return;
    }

    // Check if subscription already exists for this user and plan
    const { data: existingSubscription, error: fetchError } = await supabaseAdmin
      .from('assinaturas')
      .select('id, status')
      .eq('user_id', userId)
      .eq('plan_id', planId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 = not found (which is expected if no subscription exists)
      console.error('Error checking existing subscription:', fetchError);
      throw fetchError;
    }

    // If subscription exists, update it to active
    if (existingSubscription) {
      const { error: updateError } = await supabaseAdmin
        .from('assinaturas')
        .update({
          status: 'ativa',
          data_inicio: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingSubscription.id);

      if (updateError) {
        console.error('Error updating subscription:', updateError);
        throw updateError;
      }

      console.log('✅ Subscription updated to active:', existingSubscription.id);
    } else {
      // Create new subscription
      const { data: newSubscription, error: insertError } = await supabaseAdmin
        .from('assinaturas')
        .insert([
          {
            user_id: userId,
            plan_id: planId,
            status: 'ativa',
            data_inicio: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select();

      if (insertError) {
        console.error('Error creating subscription:', insertError);
        throw insertError;
      }

      console.log('✅ Subscription created:', newSubscription[0]?.id);
    }

    // Log successful webhook processing
    console.log('✅ Checkout completed successfully for user:', userId);

  } catch (err) {
    console.error('❌ Error handling checkout.session.completed:', err);
    // Don't throw - we want to acknowledge the webhook even if processing fails
    // Stripe will retry failed webhooks
  }
}

// ============================================================
// WEBHOOKS
// ============================================================

/**
 * Stripe webhook handler
 * Verifies Stripe signature and processes events
 */
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({
        success: false,
        error: 'Stripe is not configured',
      });
    }

    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !endpointSecret) {
      return res.status(400).json({
        success: false,
        error: 'Missing Stripe webhook signature or endpoint secret',
      });
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return res.status(400).json({
        success: false,
        error: 'Webhook signature verification failed',
      });
    }

    // Handle Stripe events
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      case 'payment_intent.succeeded':
        console.log('✅ Payment succeeded:', event.data.object.id);
        // TODO: Update subscription status in database
        break;
      case 'payment_intent.payment_failed':
        console.log('❌ Payment failed:', event.data.object.id);
        // TODO: Handle failed payment
        break;
      case 'customer.subscription.created':
        console.log('✅ Subscription created:', event.data.object.id);
        // TODO: Save subscription to database
        break;
      case 'customer.subscription.updated':
        console.log('✅ Subscription updated:', event.data.object.id);
        // TODO: Update subscription in database
        break;
      case 'customer.subscription.deleted':
        console.log('❌ Subscription cancelled:', event.data.object.id);
        // TODO: Mark subscription as cancelled
        break;
      default:
        console.log('Unhandled event type:', event.type);
    }

    res.json({ success: true, received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({
      success: false,
      error: 'Webhook processing failed',
      details: err.message,
    });
  }
});

/**
 * Supabase Auth webhook handler
 * Handles authentication events from Supabase
 */
app.post('/api/webhooks/auth', async (req, res) => {
  try {
    const { type, data } = req.body;

    if (!type || !data) {
      return res.status(400).json({
        success: false,
        error: 'Missing webhook type or data',
      });
    }

    // Handle Supabase auth events
    switch (type) {
      case 'user_signup':
        console.log('✅ New user signed up:', data.user.email);
        // TODO: Create user profile in database
        break;
      case 'user_deleted':
        console.log('❌ User deleted:', data.user.id);
        // TODO: Cleanup user data
        break;
      case 'user_updated':
        console.log('✅ User updated:', data.user.id);
        // TODO: Sync user data
        break;
      default:
        console.log('Unhandled auth event:', type);
    }

    res.json({ success: true, received: true });
  } catch (err) {
    console.error('Auth webhook error:', err);
    res.status(500).json({
      success: false,
      error: 'Auth webhook processing failed',
      details: err.message,
    });
  }
});

// Retrain ML models via Queue system
app.post('/api/retrain', authenticateToken, async (req, res) => {
  try {
    console.log('🔄 Queuing model retraining for user:', req.user.id);

    const { full_retrain = false, model_type = 'all' } = req.body;

    // Queue the retraining job instead of calling directly
    const job = await queueRetraining(req.user.id, {
      modelType: model_type,
      fullRetrain: full_retrain,
    });

    console.log('✅ Retraining job queued with ID:', job.id);

    res.json({
      success: true,
      message: 'Retreinamento agendado com sucesso',
      data: {
        user_id: req.user.id,
        job_id: job.id,
        retrain_type: model_type,
        full_retrain,
        status: 'queued',
        initiated_at: new Date().toISOString(),
        status_url: `/api/queue/status/${job.id}?queue=retraining`,
      },
    });

  } catch (err) {
    console.error('❌ Retrain error:', err);
    if (logger) logger.logError(err, { endpoint: '/api/retrain', userId: req.user?.id });
    res.status(500).json({
      success: false,
      error: 'Failed to queue model retraining',
      details: err.message,
    });
  }
});

// Dashboard Metrics - Aggregate data for frontend dashboard
app.get('/api/dashboard-metrics', authenticateToken, async (req, res) => {
  try {
    console.log('📊 Fetching dashboard metrics for user:', req.user.id);

    const userId = req.user.id;

    // Parallel queries for performance
    const [
      analysesResult,
      accuracyResult,
      nicheDistributionResult,
      recentAnalysesResult,
      planResult,
    ] = await Promise.all([
      // Total analyses count
      supabaseAdmin
        .from('analises')
        .select('id', { count: 'exact' })
        .eq('usuario_id', userId),

      // Average accuracy (based on feedback)
      supabaseAdmin
        .from('feedback')
        .select('precisao')
        .eq('usuario_id', userId),

      // Niche distribution
      supabaseAdmin
        .from('analises')
        .select('nicho')
        .eq('usuario_id', userId),

      // Recent analyses (last 5)
      supabaseAdmin
        .from('analises')
        .select('id, nicho, data_criacao, precisao')
        .eq('usuario_id', userId)
        .order('data_criacao', { ascending: false })
        .limit(5),

      // User subscription plan
      supabaseAdmin
        .from('assinaturas')
        .select('planos(nome, descricao), status')
        .eq('user_id', userId)
        .eq('status', 'ativa')
        .maybeSingle(),
    ]);

    // Calculate metrics
    const totalAnalyses = analysesResult.count || 0;

    // Average accuracy from feedback
    const accuracyScores = accuracyResult.data || [];
    const averageAccuracy = accuracyScores.length > 0
      ? (accuracyScores.reduce((sum, f) => sum + (f.precisao || 0), 0) / accuracyScores.length)
      : 0;

    // Niche distribution
    const nicheData = nicheDistributionResult.data || [];
    const nicheDistribution = {};
    nicheData.forEach(a => {
      nicheDistribution[a.nicho] = (nicheDistribution[a.nicho] || 0) + 1;
    });

    // Recent analyses with fallback to empty precisao
    const recentAnalyses = (recentAnalysesResult.data || []).map(a => ({
      id: a.id,
      nicho: a.nicho,
      data_criacao: a.data_criacao,
      precisao: a.precisao || 0,
    }));

    // Plan info
    const currentPlan = planResult?.data?.planos?.nome || 'Gratuito';

    // Growth trend (simplified: count analyses in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const trendResult = await supabaseAdmin
      .from('analises')
      .select('id', { count: 'exact' })
      .eq('usuario_id', userId)
      .gte('data_criacao', sevenDaysAgo.toISOString());

    const analysesLastWeek = trendResult.count || 0;
    const weeklyGrowth = analysesLastWeek > 0
      ? ((analysesLastWeek / (totalAnalyses || 1)) * 100).toFixed(1)
      : 0;

    // Calculate most used niche
    const mostUsedNiche = Object.entries(nicheDistribution).length > 0
      ? Object.entries(nicheDistribution).reduce((a, b) => b[1] > a[1] ? b : a)[0]
      : 'N/A';

    // Response
    const metrics = {
      success: true,
      data: {
        overview: {
          totalAnalyses,
          averageAccuracy: Math.round(averageAccuracy * 100) / 100,
          currentPlan,
          analysesLastWeek,
        },
        trends: {
          weeklyGrowthPercentage: parseFloat(weeklyGrowth),
          mostUsedNiche,
          nicheDistribution,
        },
        recent: {
          analyses: recentAnalyses,
          lastAnalysisDate: recentAnalyses.length > 0
            ? recentAnalyses[0].data_criacao
            : null,
        },
        stats: {
          totalNiches: Object.keys(nicheDistribution).length,
          totalFeedback: accuracyScores.length,
          averageAccuracyPercentage: Math.round(averageAccuracy * 100),
        },
      },
      timestamp: new Date().toISOString(),
    };

    console.log('✅ Dashboard metrics calculated successfully');
    res.json(metrics);

  } catch (err) {
    console.error('❌ Dashboard metrics error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard metrics',
      details: err.message,
    });
  }
});

// ============================================================
// MONITORING & LOGGING ENDPOINTS
// ============================================================

/**
 * GET /api/monitoring/health
 * Get system health status
 */
app.get('/api/monitoring/health', authenticateToken, async (req, res) => {
  try {
    // Check admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can access health endpoint' });
    }

    if (!monitor) {
      return res.status(503).json({ error: 'Monitoring system not initialized' });
    }

    const report = monitor.getReport();

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      health: report,
    });
  } catch (error) {
    if (logger) logger.logError(error, { endpoint: '/api/monitoring/health' });
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/monitoring/metrics
 * Get detailed metrics
 */
app.get('/api/monitoring/metrics', authenticateToken, async (req, res) => {
  try {
    // Check admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can access metrics endpoint' });
    }

    if (!logger) {
      return res.status(503).json({ error: 'Logging system not initialized' });
    }

    const metrics = logger.getMetrics();

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      metrics,
    });
  } catch (error) {
    if (logger) logger.logError(error, { endpoint: '/api/monitoring/metrics' });
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/monitoring/logs
 * Retrieve critical logs from Supabase (admin only)
 */
app.get('/api/monitoring/logs', authenticateToken, async (req, res) => {
  try {
    // Check admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can access logs' });
    }

    if (!supabaseClient) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const limit = Math.min(parseInt(req.query.limit || '100'), 1000);
    const severity = req.query.severity || 'all';

    let query = supabaseClient.from('logs').select('*').order('created_at', { ascending: false }).limit(limit);

    if (severity !== 'all') {
      query = query.eq('severity', severity);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({
      success: true,
      count: data.length,
      logs: data,
    });
  } catch (error) {
    if (logger) logger.logError(error, { endpoint: '/api/monitoring/logs' });
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/monitoring/test-alert
 * Test the alerting system (admin only)
 */
app.post('/api/monitoring/test-alert', authenticateToken, async (req, res) => {
  try {
    // Check admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can test alerts' });
    }

    if (!logger) {
      return res.status(503).json({ error: 'Logging system not initialized' });
    }

    const { type = 'test', message = 'Test alert' } = req.body;

    logger.logSecurityEvent(`TEST_ALERT: ${type}`, { message, testedAt: new Date().toISOString() });

    res.json({
      success: true,
      message: 'Alert test completed',
      details: { type, message },
    });
  } catch (error) {
    if (logger) logger.logError(error, { endpoint: '/api/monitoring/test-alert' });
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// QUEUE ENDPOINTS
// ============================================================

// Get job status
app.get('/api/queue/status/:jobId', authenticateToken, async (req, res) => {
  try {
    const { jobId } = req.params;
    const { queue = 'analysis' } = req.query;
    
    const jobStatus = await getJobStatus(jobId, queue);
    
    res.json({
      success: true,
      job: jobStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (logger) logger.logError(error, { endpoint: '/api/queue/status/:jobId' });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get queue statistics
app.get('/api/queue/stats', authenticateToken, async (req, res) => {
  try {
    const { queue = 'all' } = req.query;
    
    const stats = await getQueueStats(queue);
    
    res.json({
      success: true,
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (logger) logger.logError(error, { endpoint: '/api/queue/stats' });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Default 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path,
    method: req.method,
  });
});

// Error handling middleware - ENHANCED with logging
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error';

  // Log error with logging system
  if (logger) {
    logger.logError(err, {
      url: req.originalUrl,
      method: req.method,
      userId: req.user?.id,
      statusCode,
    });
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ============================================================
// SERVER STARTUP
// ============================================================

if (process.env.NODE_ENV !== 'test') app.listen(PORT, async () => {
  console.log('\n🚀 API Gateway Server Started');
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌍 Environment: ${NODE_ENV}`);
  console.log(`📅 Started at: ${new Date().toISOString()}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  
  // Initialize queue system
  try {
    await initializeQueues();
    console.log(`✅ Queue system initialized`);
  } catch (error) {
    console.error(`❌ Failed to initialize queues:`, error.message);
    if (NODE_ENV === 'production') {
      process.exit(1);
    }
  }
  
  console.log(`\n✨ Endpoints:`);
  console.log(`   • Health Check: http://localhost:${PORT}/health`);
  console.log(`   • API Health: http://localhost:${PORT}/api/health`);
  console.log(`   • Test Supabase: http://localhost:${PORT}/api/test-supabase`);
  console.log(`\n� Protected Routes (Require JWT):`);
  console.log(`   • GET  /api/auth/me - Get user profile`);
  console.log(`   • PUT  /api/auth/profile - Update user profile`);
  console.log(`   • GET  /api/auth/subscriptions - Get user subscriptions`);
  console.log(`   • GET  /api/auth/analyses - Get user analyses`);
  console.log(`   • POST /api/stripe/checkout - Create checkout session`);
  console.log(`\n🔔 Webhooks (No Auth Required):`);
  console.log(`   • POST /api/webhooks/stripe - Stripe events`);
  console.log(`   • POST /api/webhooks/auth - Supabase auth events`);
  console.log(`\n💡 Configuration:`);
  console.log(`   • Rate Limit: ${process.env.RATE_LIMIT_MAX_REQUESTS} requests per minute`);
  console.log(`   • Stripe: ${stripe ? '✅ Configured' : '⚠️  Not configured'}`);
  console.log(`   • Database: ${databaseReady ? '✅ Ready' : '⏳ Initializing'}`);
  console.log(`\n📖 Documentation:`);
  console.log(`   • AUTH_ENDPOINTS.md - Complete endpoint reference`);
  console.log(`   • STRIPE_JWT_SETUP.md - Setup & testing guide`);
  console.log(`   • client-protected-endpoints.js - Frontend examples\n`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('📍 SIGTERM signal received: closing HTTP server');
  try {
    await cleanupQueues();
    console.log('✅ Queues cleaned up');
  } catch (error) {
    console.error('❌ Error cleaning up queues:', error.message);
  }
  server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('📍 SIGINT signal received: closing HTTP server');
  try {
    await cleanupQueues();
    console.log('✅ Queues cleaned up');
  } catch (error) {
    console.error('❌ Error cleaning up queues:', error.message);
  }
  server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  if (logger) logger.logError(err, { type: 'uncaughtException' });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  if (logger) logger.logError(new Error(String(reason)), { type: 'unhandledRejection' });
  process.exit(1);
});

export default app;
export { logger, monitor, initializeLogging };
