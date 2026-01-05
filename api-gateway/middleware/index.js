/**
 * Custom Middleware Functions
 */

import { getClientIp, isAuthorized, generateRequestId } from '../utils/helpers.js';

/**
 * Middleware para adicionar Request ID
 */
export const requestIdMiddleware = (req, res, next) => {
  req.id = generateRequestId();
  res.set('X-Request-ID', req.id);
  next();
};

/**
 * Middleware para logging de requisições
 */
export const requestLoggingMiddleware = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const clientIp = getClientIp(req);

    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.path} | ` +
      `Status: ${res.statusCode} | ` +
      `Duration: ${duration}ms | ` +
      `IP: ${clientIp}`
    );
  });

  next();
};

/**
 * Middleware para verificar API Key
 */
export const apiKeyMiddleware = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'X-API-Key header is required',
      timestamp: new Date().toISOString(),
    });
  }

  if (apiKey !== process.env.API_SECRET_KEY) {
    return res.status(403).json({
      success: false,
      error: 'Invalid API key',
      timestamp: new Date().toISOString(),
    });
  }

  next();
};

/**
 * Middleware para validação de token JWT
 */
export const validateTokenMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Missing or invalid authorization header',
      timestamp: new Date().toISOString(),
    });
  }

  // Token validation logic would go here
  // For now, just extract the token
  req.token = authHeader.substring(7);

  next();
};

/**
 * Middleware para validar JSON body
 */
export const validateJsonMiddleware = (req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    if (!req.is('application/json')) {
      return res.status(415).json({
        success: false,
        error: 'Content-Type must be application/json',
        timestamp: new Date().toISOString(),
      });
    }
  }

  next();
};

/**
 * Middleware para adicionar informações de cliente
 */
export const clientInfoMiddleware = (req, res, next) => {
  req.clientInfo = {
    ip: getClientIp(req),
    userAgent: req.headers['user-agent'] || 'Unknown',
    timestamp: new Date().toISOString(),
  };

  next();
};

/**
 * Middleware para tratamento de async errors
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    return Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Middleware para timeout de requisição
 */
export const requestTimeoutMiddleware = (timeout = 30000) => {
  return (req, res, next) => {
    const timeoutId = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({
          success: false,
          error: 'Request timeout',
          timestamp: new Date().toISOString(),
        });
      }
    }, timeout);

    res.on('finish', () => {
      clearTimeout(timeoutId);
    });

    next();
  };
};

export default {
  requestIdMiddleware,
  requestLoggingMiddleware,
  apiKeyMiddleware,
  validateTokenMiddleware,
  validateJsonMiddleware,
  clientInfoMiddleware,
  asyncHandler,
  requestTimeoutMiddleware,
};
