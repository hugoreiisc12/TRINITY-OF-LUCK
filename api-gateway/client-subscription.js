/**
 * Supabase Subscription Client
 * 
 * Handles all subscription-related API calls
 * 
 * Usage:
 *   const client = new SubscriptionClient(apiUrl, token);
 *   const subscription = await client.getSubscription();
 *   const hasFeature = await client.hasFeature('exportar_resultados');
 */

class SubscriptionClient {
  constructor(apiUrl = 'http://localhost:3001', token = null) {
    this.apiUrl = apiUrl;
    this.token = token;
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Set authentication token
   * @param {string} token - JWT token
   */
  setToken(token) {
    this.token = token;
    this.cache.clear(); // Clear cache when token changes
  }

  /**
   * Get headers for API requests
   * @private
   * @returns {object} Headers object
   */
  _getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  /**
   * Make HTTP request with error handling
   * @private
   * @param {string} method - HTTP method
   * @param {string} path - API path
   * @param {object} data - Request body (optional)
   * @returns {Promise<object>} Response data
   */
  async _request(method, path, data = null) {
    const url = `${this.apiUrl}${path}`;
    const options = {
      method,
      headers: this._getHeaders(),
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      const result = await response.json();

      if (!response.ok) {
        throw {
          status: response.status,
          error: result.error || 'Unknown error',
          message: result.message,
        };
      }

      return result;
    } catch (error) {
      if (error.status) {
        throw error; // Re-throw API errors
      }
      throw {
        status: 0,
        error: error.message || 'Network error',
      };
    }
  }

  /**
   * Get current active subscription for user
   * @returns {Promise<object|null>} Subscription data or null
   * @throws {object} Error object with status and error message
   * 
   * @example
   * try {
   *   const subscription = await client.getSubscription();
   *   if (subscription) {
   *     console.log(`Plan: ${subscription.planName}`);
   *     console.log(`Days remaining: ${subscription.daysRemaining}`);
   *   } else {
   *     console.log('No active subscription');
   *   }
   * } catch (error) {
   *   console.error(`Error: ${error.error}`);
   * }
   */
  async getSubscription() {
    // Check cache first
    const cached = this.cache.get('subscription');
    if (cached && Date.now() < cached.expiry) {
      return cached.data;
    }

    try {
      const response = await this._request('GET', '/api/subscription');

      // Cache the result
      this.cache.set('subscription', {
        data: response.data,
        expiry: Date.now() + this.cacheExpiry,
      });

      return response.data;
    } catch (error) {
      // 404 means no subscription (not an error)
      if (error.status === 404) {
        this.cache.set('subscription', {
          data: null,
          expiry: Date.now() + this.cacheExpiry,
        });
        return null;
      }
      throw error;
    }
  }

  /**
   * Check if subscription is active
   * @returns {Promise<boolean>} True if subscription is active
   * 
   * @example
   * const isActive = await client.isActive();
   * if (isActive) {
   *   // Show premium features
   * } else {
   *   // Show upgrade prompt
   * }
   */
  async isActive() {
    try {
      const subscription = await this.getSubscription();
      return subscription?.isActive ?? false;
    } catch (error) {
      if (error.status === 401) {
        return false; // Not authenticated
      }
      throw error;
    }
  }

  /**
   * Check if subscription is cancelled
   * @returns {Promise<boolean>} True if subscription is cancelled
   */
  async isCancelled() {
    try {
      const subscription = await this.getSubscription();
      return subscription?.isCancelled ?? false;
    } catch (error) {
      if (error.status === 401 || error.status === 404) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get current plan name
   * @returns {Promise<string|null>} Plan name or null
   * 
   * @example
   * const planName = await client.getPlanName();
   * console.log(`You are on the ${planName} plan`);
   */
  async getPlanName() {
    try {
      const subscription = await this.getSubscription();
      return subscription?.planName ?? null;
    } catch (error) {
      if (error.status === 401 || error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get current plan price
   * @returns {Promise<number|null>} Price in decimal format or null
   */
  async getPlanPrice() {
    try {
      const subscription = await this.getSubscription();
      return subscription?.planPrice ?? null;
    } catch (error) {
      if (error.status === 401 || error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Check if user has access to a specific feature
   * @param {string} feature - Feature name (e.g., 'exportar_resultados')
   * @returns {Promise<boolean>} True if user has access to feature
   * 
   * @example
   * const canExport = await client.hasFeature('exportar_resultados');
   * if (canExport) {
   *   // Show export button
   * } else {
   *   // Show upgrade prompt
   * }
   */
  async hasFeature(feature) {
    try {
      const subscription = await this.getSubscription();
      if (!subscription) {
        return false; // No subscription
      }

      const resources = subscription.resources || {};
      const hasAccess = resources[feature];

      return !!hasAccess; // Convert to boolean
    } catch (error) {
      if (error.status === 401 || error.status === 404) {
        return false; // Not authenticated or no subscription
      }
      throw error;
    }
  }

  /**
   * Get all available resources/features for current subscription
   * @returns {Promise<object|null>} Resources object or null
   * 
   * @example
   * const resources = await client.getResources();
   * Object.entries(resources).forEach(([key, value]) => {
   *   console.log(`${key}: ${value}`);
   * });
   */
  async getResources() {
    try {
      const subscription = await this.getSubscription();
      return subscription?.resources ?? null;
    } catch (error) {
      if (error.status === 401 || error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get number of days remaining in subscription
   * @returns {Promise<number|null>} Days remaining or null if no end date
   * 
   * @example
   * const daysLeft = await client.getDaysRemaining();
   * if (daysLeft !== null && daysLeft < 30) {
   *   console.log(`Only ${daysLeft} days left!`);
   * }
   */
  async getDaysRemaining() {
    try {
      const subscription = await this.getSubscription();
      return subscription?.daysRemaining ?? null;
    } catch (error) {
      if (error.status === 401 || error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get subscription start date
   * @returns {Promise<string|null>} ISO datetime string or null
   */
  async getStartDate() {
    try {
      const subscription = await this.getSubscription();
      return subscription?.startDate ?? null;
    } catch (error) {
      if (error.status === 401 || error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get subscription end date
   * @returns {Promise<string|null>} ISO datetime string or null
   */
  async getEndDate() {
    try {
      const subscription = await this.getSubscription();
      return subscription?.endDate ?? null;
    } catch (error) {
      if (error.status === 401 || error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get subscription status
   * @returns {Promise<string|null>} Status ('ativa', 'cancelada') or null
   */
  async getStatus() {
    try {
      const subscription = await this.getSubscription();
      return subscription?.status ?? null;
    } catch (error) {
      if (error.status === 401 || error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Check if subscription is expiring soon (within days)
   * @param {number} withinDays - Number of days to check (default: 30)
   * @returns {Promise<boolean>} True if expiring within specified days
   * 
   * @example
   * const expiringSoon = await client.isExpiringSoon(30);
   * if (expiringSoon) {
   *   // Show renewal reminder
   * }
   */
  async isExpiringSoon(withinDays = 30) {
    try {
      const daysRemaining = await this.getDaysRemaining();
      return daysRemaining !== null && daysRemaining <= withinDays;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get feature access level
   * Returns the value of a specific resource (might be boolean, number, or string)
   * @param {string} feature - Feature name
   * @returns {Promise<any>} Feature value or null if not available
   * 
   * @example
   * const limit = await client.getFeatureLevel('análises_por_mês');
   * console.log(`You can run ${limit} analyses per month`);
   */
  async getFeatureLevel(feature) {
    try {
      const subscription = await this.getSubscription();
      if (!subscription || !subscription.resources) {
        return null;
      }
      return subscription.resources[feature] ?? null;
    } catch (error) {
      if (error.status === 401 || error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Force refresh subscription data from server
   * Clears cache and fetches fresh data
   * @returns {Promise<object|null>} Fresh subscription data
   * 
   * @example
   * // After user upgrades plan
   * await client.refreshSubscription();
   */
  async refreshSubscription() {
    this.cache.delete('subscription');
    return this.getSubscription();
  }

  /**
   * Clear local cache
   * Useful when switching users or logging out
   * 
   * @example
   * client.clearCache();
   * client.setToken(newToken);
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get subscription object with all data
   * Alias for getSubscription()
   * @returns {Promise<object|null>} Full subscription object
   */
  async getFullSubscription() {
    return this.getSubscription();
  }

  /**
   * Validate that user can perform action
   * Check if subscription is active before allowing action
   * @param {string|array} features - Required feature(s)
   * @returns {Promise<boolean>} True if user can perform action
   * 
   * @example
   * const canAnalyze = await client.canPerform('análises_por_mês');
   * if (canAnalyze) {
   *   // Perform analysis
   * } else {
   *   // Show error or upgrade prompt
   * }
   */
  async canPerform(features) {
    try {
      const subscription = await this.getSubscription();
      
      if (!subscription || !subscription.isActive) {
        return false;
      }

      // If features is a string, check single feature
      if (typeof features === 'string') {
        return this.hasFeature(features);
      }

      // If features is an array, check all features
      if (Array.isArray(features)) {
        for (const feature of features) {
          if (!(await this.hasFeature(feature))) {
            return false;
          }
        }
        return true;
      }

      return false;
    } catch (error) {
      return false;
    }
  }
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SubscriptionClient;
}
