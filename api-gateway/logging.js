/**
 * Advanced Logging System for TRINITY OF LUCK API Gateway
 * Features: Detailed Morgan logging, Supabase storage, monitoring alerts
 * 
 * Date: January 4, 2026
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure logs directory exists
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// ============================================================================
// LOGGER CLASS
// ============================================================================

class Logger {
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
    this.requestsCount = 0;
    this.errorsCount = 0;
    this.startTime = Date.now();
    this.metrics = {
      totalRequests: 0,
      totalErrors: 0,
      avgResponseTime: 0,
      errorRate: 0,
      criticalErrors: [],
    };
  }

  /**
   * Log a message to console and file
   */
  log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data,
      nodeEnv: process.env.NODE_ENV,
    };

    // Console output with colors
    this._consoleLog(level, message, data);

    // File logging
    this._fileLog(level, logEntry);

    // Track metrics
    if (level === 'error' || level === 'critical') {
      this.errorsCount++;
      this.metrics.totalErrors++;
    }
    this.metrics.totalRequests++;

    return logEntry;
  }

  /**
   * Log request details
   */
  logRequest(req, res, responseTime) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'http_request',
      method: req.method,
      url: req.originalUrl,
      path: req.path,
      query: req.query,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userAgent: req.get('user-agent'),
      ip: req.ip || req.connection.remoteAddress,
      userId: req.user?.id || 'anonymous',
      contentLength: res.get('content-length') || 0,
    };

    // Console logging for debugging
    const statusEmoji = res.statusCode >= 200 && res.statusCode < 300 ? '✅' : '⚠️';
    console.log(
      `${statusEmoji} [${logEntry.timestamp}] ${req.method} ${req.originalUrl} - ${res.statusCode} (${responseTime}ms)`
    );

    // File logging
    this._fileLog('request', logEntry);

    // Update metrics
    this.metrics.totalRequests++;
    this.metrics.avgResponseTime = 
      (this.metrics.avgResponseTime + responseTime) / 2;

    // Store to Supabase if error
    if (res.statusCode >= 400) {
      this._storeToSupabase(logEntry);
    }

    return logEntry;
  }

  /**
   * Log error with alert
   */
  logError(error, context = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      type: 'error',
      message: error.message,
      stack: error.stack,
      code: error.code,
      context,
      nodeEnv: process.env.NODE_ENV,
    };

    console.error(`❌ [${timestamp}] ERROR: ${error.message}`);
    if (error.stack) console.error(error.stack);

    // File logging
    this._fileLog('error', logEntry);

    // Store to Supabase
    this._storeToSupabase(logEntry, 'critical');

    // Trigger alerts
    this._triggerAlert('error', error.message, context);

    this.errorsCount++;
    this.metrics.totalErrors++;
    this.metrics.criticalErrors.push({
      timestamp,
      message: error.message,
      context,
    });

    return logEntry;
  }

  /**
   * Log critical security issue
   */
  logSecurityEvent(event, details = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      type: 'security',
      event,
      details,
      severity: 'critical',
    };

    console.warn(`🔒 [SECURITY] ${event}:`, details);

    // File logging
    this._fileLog('security', logEntry);

    // Store to Supabase (always)
    this._storeToSupabase(logEntry, 'security');

    // Trigger alert
    this._triggerAlert('security', event, details);

    return logEntry;
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    const uptime = Date.now() - this.startTime;
    this.metrics.errorRate = (this.metrics.totalErrors / this.metrics.totalRequests * 100).toFixed(2);
    this.metrics.uptime = `${(uptime / 1000).toFixed(2)}s`;
    
    return this.metrics;
  }

  /**
   * Console logging with colors
   */
  _consoleLog(level, message, data) {
    const timestamp = new Date().toISOString();
    const colors = {
      info: '\x1b[36m',     // Cyan
      warn: '\x1b[33m',     // Yellow
      error: '\x1b[31m',    // Red
      debug: '\x1b[35m',    // Magenta
      success: '\x1b[32m',  // Green
      reset: '\x1b[0m',
    };

    const color = colors[level] || colors.info;
    const prefix = {
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
      debug: '🐛',
      success: '✅',
    }[level] || '📝';

    const message_str = typeof data === 'object' ? JSON.stringify(data) : data;
    console.log(`${color}${prefix} [${timestamp}] ${level.toUpperCase()}: ${message} ${message_str}${colors.reset}`);
  }

  /**
   * File logging
   */
  _fileLog(level, logEntry) {
    const logFile = path.join(logsDir, `${level}.log`);
    const allLogsFile = path.join(logsDir, 'all.log');

    const logString = `${JSON.stringify(logEntry)}\n`;

    try {
      fs.appendFileSync(logFile, logString);
      fs.appendFileSync(allLogsFile, logString);
    } catch (err) {
      console.error(`Failed to write log file: ${err.message}`);
    }
  }

  /**
   * Store critical logs to Supabase
   */
  async _storeToSupabase(logEntry, severity = 'info') {
    if (!this.supabase) return;

    try {
      // Only store errors, security events, and requests with errors
      if (severity === 'critical' || severity === 'security' || logEntry.statusCode >= 500) {
        const { error } = await this.supabase
          .from('logs')
          .insert([
            {
              timestamp: logEntry.timestamp,
              type: logEntry.type || 'general',
              severity: severity,
              message: logEntry.message || JSON.stringify(logEntry),
              details: logEntry,
              created_at: new Date().toISOString(),
            },
          ]);

        if (error) {
          console.error('Failed to store log in Supabase:', error);
        }
      }
    } catch (err) {
      console.error('Supabase logging error:', err.message);
    }
  }

  /**
   * Trigger alerts
   */
  _triggerAlert(type, message, context) {
    // Console alert
    console.warn(`\n🚨 ALERT [${type.toUpperCase()}]: ${message}`);
    console.warn(`Context:`, context);

    // Email alert (placeholder - requires nodemailer setup)
    if (process.env.EMAIL_ALERTS === 'true') {
      this._sendEmailAlert(type, message, context);
    }

    // Slack alert (placeholder - requires slack webhook)
    if (process.env.SLACK_WEBHOOK_URL) {
      this._sendSlackAlert(type, message, context);
    }
  }

  /**
   * Send email alert (placeholder)
   */
  _sendEmailAlert(type, message, context) {
    // TODO: Implement with nodemailer
    console.log(`📧 Email alert would be sent: ${type} - ${message}`);
  }

  /**
   * Send Slack alert (placeholder)
   */
  _sendSlackAlert(type, message, context) {
    // TODO: Implement with slack API
    console.log(`💬 Slack alert would be sent: ${type} - ${message}`);
  }

  /**
   * Create Morgan custom token for detailed logging
   */
  static createMorganTokens() {
    return {
      // Response time in milliseconds
      responseTime: (req, res) => {
        if (!req._startTime) return '0';
        const ms = Date.now() - req._startTime;
        return ms;
      },

      // User ID (if authenticated)
      userId: (req) => req.user?.id || 'anonymous',

      // Request body (first 100 chars)
      body: (req) => {
        if (!req.body) return '-';
        const bodyStr = JSON.stringify(req.body);
        return bodyStr.substring(0, 100);
      },

      // User agent
      userAgent: (req) => req.get('user-agent') || '-',

      // IP address (proxy aware)
      ipAddress: (req) => req.ip || req.connection.remoteAddress || '-',
    };
  }
}

// ============================================================================
// MONITORING CLASS
// ============================================================================

class Monitor {
  constructor(logger) {
    this.logger = logger;
    this.alerts = [];
    this.thresholds = {
      errorRate: 5,           // Alert if > 5% error rate
      responseTime: 5000,     // Alert if > 5 seconds
      criticalErrors: 10,     // Alert if > 10 critical errors
      requestsPerMinute: 1000, // Alert if > 1000 req/min
    };
  }

  /**
   * Check health and trigger alerts if needed
   */
  checkHealth() {
    const metrics = this.logger.getMetrics();

    // Check error rate
    if (parseFloat(metrics.errorRate) > this.thresholds.errorRate) {
      this._alert('HIGH_ERROR_RATE', `Error rate: ${metrics.errorRate}%`, metrics);
    }

    // Check critical errors
    if (metrics.criticalErrors.length > this.thresholds.criticalErrors) {
      this._alert('CRITICAL_ERRORS', `${metrics.criticalErrors.length} critical errors`, metrics);
    }

    return metrics;
  }

  /**
   * Get detailed metrics report
   */
  getReport() {
    const metrics = this.logger.getMetrics();
    return {
      ...metrics,
      alerts: this.alerts,
      health: this._getHealthStatus(metrics),
    };
  }

  /**
   * Create alert
   */
  _alert(type, message, context) {
    const alert = {
      timestamp: new Date().toISOString(),
      type,
      message,
      context,
    };

    this.alerts.push(alert);
    this.logger.logSecurityEvent(`MONITORING_ALERT: ${type}`, { message, context });
  }

  /**
   * Determine health status
   */
  _getHealthStatus(metrics) {
    const errorRate = parseFloat(metrics.errorRate);

    if (errorRate > 10) return 'CRITICAL';
    if (errorRate > 5) return 'UNHEALTHY';
    if (errorRate > 2) return 'DEGRADED';
    return 'HEALTHY';
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export { Logger, Monitor };

/**
 * USAGE EXAMPLE:
 * 
 * import { Logger, Monitor } from './logging.js';
 * 
 * const logger = new Logger(supabaseClient);
 * const monitor = new Monitor(logger);
 * 
 * // Log request
 * logger.logRequest(req, res, responseTime);
 * 
 * // Log error
 * logger.logError(error, { endpoint: '/api/login' });
 * 
 * // Log security event
 * logger.logSecurityEvent('XSS_ATTEMPT', { payload: sanitized });
 * 
 * // Get metrics
 * const metrics = logger.getMetrics();
 * 
 * // Check health
 * const report = monitor.getReport();
 */
