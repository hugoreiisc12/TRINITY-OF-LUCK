// Client library for platforms endpoint
// Get platforms list with optional filtering

/**
 * Fetch all platforms
 * @returns {Promise<Object>} Platforms response with data array
 */
export async function getPlatforms() {
  try {
    const response = await fetch('/api/platforms');

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ Fetched ${data.count} platforms`);
    return data;
  } catch (error) {
    console.error('Failed to fetch platforms:', error);
    throw error;
  }
}

/**
 * Fetch platforms filtered by niche
 * @param {string} niche - Platform niche (e.g., 'sports', 'crypto', 'esports')
 * @returns {Promise<Object>} Filtered platforms response
 */
export async function getPlatformsByNiche(niche) {
  if (!niche || typeof niche !== 'string') {
    throw new Error('Niche must be a non-empty string');
  }

  try {
    const response = await fetch(`/api/platforms?niche=${encodeURIComponent(niche)}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ Fetched ${data.count} platforms for niche: ${niche}`);
    return data;
  } catch (error) {
    console.error(`Failed to fetch platforms for niche ${niche}:`, error);
    throw error;
  }
}

/**
 * Get platform by name
 * @param {string} name - Platform name
 * @param {Array} platforms - Platforms array (from getPlatforms)
 * @returns {Object|null} Platform object or null if not found
 */
export function findPlatformByName(name, platforms) {
  if (!Array.isArray(platforms)) {
    throw new Error('Platforms must be an array');
  }

  return platforms.find(p => p.nome?.toLowerCase() === name.toLowerCase()) || null;
}

/**
 * Get all unique niches from platforms
 * @param {Array} platforms - Platforms array
 * @returns {Array<string>} Array of unique niches
 */
export function getUniqueNiches(platforms) {
  if (!Array.isArray(platforms)) {
    return [];
  }

  const niches = new Set();
  platforms.forEach(p => {
    if (p.nicho) {
      niches.add(p.nicho.toLowerCase());
    }
  });
  return Array.from(niches).sort();
}

/**
 * Get platforms count by niche
 * @param {Array} platforms - Platforms array
 * @returns {Object} Object with niche as key and count as value
 */
export function countPlatformsByNiche(platforms) {
  if (!Array.isArray(platforms)) {
    return {};
  }

  return platforms.reduce((acc, p) => {
    const niche = p.nicho?.toLowerCase() || 'unknown';
    acc[niche] = (acc[niche] || 0) + 1;
    return acc;
  }, {});
}

/**
 * Filter platforms by multiple criteria
 * @param {Array} platforms - Platforms array
 * @param {Object} criteria - Filter criteria { niche, suportado, etc }
 * @returns {Array} Filtered platforms
 */
export function filterPlatforms(platforms, criteria) {
  if (!Array.isArray(platforms)) {
    return [];
  }

  return platforms.filter(platform => {
    // Check niche
    if (criteria.niche && platform.nicho?.toLowerCase() !== criteria.niche.toLowerCase()) {
      return false;
    }

    // Check supported status
    if (criteria.suportado !== undefined && platform.suportado !== criteria.suportado) {
      return false;
    }

    // Check name (partial match)
    if (criteria.nome && !platform.nome?.toLowerCase().includes(criteria.nome.toLowerCase())) {
      return false;
    }

    return true;
  });
}

/**
 * Load platforms and filter by niche on component mount
 * React hook example
 */
export function usePlatforms(niche = null) {
  const [platforms, setPlatforms] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const fetchPlatforms = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = niche
          ? await getPlatformsByNiche(niche)
          : await getPlatforms();

        setPlatforms(data.data || []);
      } catch (err) {
        setError(err.message);
        setPlatforms([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPlatforms();
  }, [niche]);

  return { platforms, loading, error };
}

export default {
  getPlatforms,
  getPlatformsByNiche,
  findPlatformByName,
  getUniqueNiches,
  countPlatformsByNiche,
  filterPlatforms,
  usePlatforms,
};
