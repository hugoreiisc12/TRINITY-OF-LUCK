/**
 * Client library for GET /api/results/:id endpoint
 * 
 * Usage:
 *   import { getAnalysisResults, useResults } from './client-results.js';
 *   
 *   const data = await getAnalysisResults('analysis-id');
 *   const { results, loading } = useResults('analysis-id');
 */

/**
 * Get analysis results by ID
 * @param {string} id - Analysis ID (UUID)
 * @returns {Promise<Object>} - Analysis results
 */
export async function getAnalysisResults(id) {
  if (!id) throw new Error('Analysis ID is required');
  
  try {
    const response = await fetch(`/api/results/${id}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || error.error);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch analysis results:', error);
    throw error;
  }
}

/**
 * Get analysis results with recalculation
 * @param {string} id - Analysis ID (UUID)
 * @returns {Promise<Object>} - Recalculated analysis results
 */
export async function getAnalysisResultsRecalculated(id) {
  if (!id) throw new Error('Analysis ID is required');
  
  try {
    const response = await fetch(`/api/results/${id}?recalculate=true`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || error.error);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to recalculate analysis results:', error);
    throw error;
  }
}

/**
 * Get probabilities from analysis results
 * @param {Object} analysisData - Analysis data from response
 * @returns {Object} - Probabilities object
 */
export function getProbabilities(analysisData) {
  if (!analysisData || !analysisData.data) return null;
  return analysisData.data.probabilidades || {};
}

/**
 * Get confidence score from analysis results
 * @param {Object} analysisData - Analysis data from response
 * @returns {number} - Confidence score (0-1)
 */
export function getConfidence(analysisData) {
  if (!analysisData || !analysisData.data) return 0;
  return analysisData.data.confianca || 0;
}

/**
 * Get explanations from analysis results
 * @param {Object} analysisData - Analysis data from response
 * @returns {string[]} - Array of explanations
 */
export function getExplanations(analysisData) {
  if (!analysisData || !analysisData.data) return [];
  return analysisData.data.explicacoes || [];
}

/**
 * Get prediction (highest probability outcome)
 * @param {Object} analysisData - Analysis data from response
 * @returns {Object} - Object with outcome and probability
 */
export function getPrediction(analysisData) {
  if (!analysisData || !analysisData.data) return null;
  
  const probs = analysisData.data.probabilidades || {};
  
  // Find highest probability
  let highest = { outcome: null, probability: 0 };
  
  for (const [outcome, probability] of Object.entries(probs)) {
    if (probability > highest.probability) {
      highest = { outcome, probability };
    }
  }
  
  return highest.outcome ? highest : null;
}

/**
 * Check if results were recalculated
 * @param {Object} analysisData - Analysis data from response
 * @returns {boolean} - Was recalculated
 */
export function wasRecalculated(analysisData) {
  if (!analysisData || !analysisData.data) return false;
  return analysisData.data.recalculado || false;
}

/**
 * Get analysis metadata
 * @param {Object} analysisData - Analysis data from response
 * @returns {Object} - Metadata object
 */
export function getMetadata(analysisData) {
  if (!analysisData || !analysisData.data) return null;
  
  const data = analysisData.data;
  return {
    id: data.id,
    titulo: data.titulo,
    descricao: data.descricao,
    status: data.status,
    usuario: data.usuario,
    contexto: data.contexto,
    timestamps: data.timestamps,
  };
}

/**
 * Format probabilities as percentages
 * @param {Object} probabilities - Probabilities object
 * @returns {Object} - Formatted probabilities as percentages
 */
export function formatProbabilities(probabilities) {
  if (!probabilities) return {};
  
  const formatted = {};
  for (const [key, value] of Object.entries(probabilities)) {
    if (typeof value === 'number') {
      formatted[key] = `${(value * 100).toFixed(1)}%`;
    }
  }
  return formatted;
}

/**
 * Format confidence score as percentage
 * @param {number} confidence - Confidence score (0-1)
 * @returns {string} - Formatted confidence percentage
 */
export function formatConfidence(confidence) {
  if (typeof confidence !== 'number') return 'N/A';
  return `${(confidence * 100).toFixed(1)}%`;
}

/**
 * Validate analysis ID format (UUID)
 * @param {string} id - Analysis ID
 * @returns {boolean} - Is valid UUID
 */
export function isValidAnalysisId(id) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

// ============================================================
// React Hook
// ============================================================

/**
 * React hook for fetching analysis results
 * @param {string} id - Analysis ID (UUID)
 * @param {Object} options - Options object
 * @param {boolean} options.recalculate - Force recalculation
 * @param {number} options.refreshInterval - Auto-refresh interval in ms
 * @returns {Object} - { results, loading, error, refresh, recalculate }
 */
export function useResults(id, options = {}) {
  if (typeof window === 'undefined') {
    // SSR-safe fallback
    return { results: null, loading: false, error: null, refresh: () => {} };
  }

  const { useEffect, useState } = require('react');
  
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchResults = async () => {
    if (!id) {
      setError('Analysis ID is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = options.recalculate
        ? await getAnalysisResultsRecalculated(id)
        : await getAnalysisResults(id);

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch results');
      }

      setResults(data.data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching analysis results:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();

    // Setup auto-refresh if interval is provided
    if (options.refreshInterval && options.refreshInterval > 0) {
      const interval = setInterval(fetchResults, options.refreshInterval);
      return () => clearInterval(interval);
    }
  }, [id, options.refreshInterval]);

  const refresh = () => fetchResults();

  const recalculate = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAnalysisResultsRecalculated(id);
      if (!data.success) throw new Error(data.error);
      setResults(data.data);
    } catch (err) {
      setError(err.message);
      console.error('Error recalculating results:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    results,
    loading,
    error,
    refresh,
    recalculate,
  };
}

// ============================================================
// React Component
// ============================================================

/**
 * React component to display analysis results
 * @param {Object} props
 * @param {string} props.analysisId - Analysis ID
 * @param {boolean} props.showRaw - Show raw data
 * @returns {JSX.Element}
 */
export function ResultsDisplay({ analysisId, showRaw = false }) {
  if (typeof window === 'undefined') {
    return null; // SSR-safe
  }

  const { results, loading, error, refresh, recalculate } = useResults(analysisId);

  if (loading) {
    return <div className="results-loading">Loading analysis results...</div>;
  }

  if (error) {
    return (
      <div className="results-error">
        <p>Error: {error}</p>
        <button onClick={refresh}>Retry</button>
      </div>
    );
  }

  if (!results) {
    return <div className="results-empty">No results found</div>;
  }

  const probs = results.probabilidades || {};
  const confidence = results.confianca || 0;

  return (
    <div className="results-container">
      <div className="results-header">
        <h2>{results.titulo}</h2>
        <p className="results-description">{results.descricao}</p>
      </div>

      <div className="results-main">
        <div className="results-probabilities">
          <h3>Probabilities</h3>
          <ul>
            {Object.entries(probs).map(([outcome, prob]) => (
              <li key={outcome}>
                <span>{outcome}:</span>
                <span className="prob-value">{(prob * 100).toFixed(1)}%</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="results-confidence">
          <h3>Confidence</h3>
          <div className="confidence-bar">
            <div
              className="confidence-fill"
              style={{ width: `${confidence * 100}%` }}
            >
              {(confidence * 100).toFixed(1)}%
            </div>
          </div>
        </div>

        {results.explicacoes && results.explicacoes.length > 0 && (
          <div className="results-explanations">
            <h3>Explanations</h3>
            <ul>
              {results.explicacoes.map((exp, i) => (
                <li key={i}>{exp}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {showRaw && results.dados && (
        <div className="results-raw">
          <h3>Raw Data</h3>
          <pre>{JSON.stringify(results.dados, null, 2)}</pre>
        </div>
      )}

      <div className="results-actions">
        <button onClick={refresh}>Refresh</button>
        <button onClick={recalculate}>Recalculate</button>
        {results.recalculado && <span className="recalculated-badge">Recalculated</span>}
      </div>

      <div className="results-metadata">
        <small>
          Created: {new Date(results.timestamps.criado_em).toLocaleString()}
          <br />
          Updated: {new Date(results.timestamps.atualizado_em).toLocaleString()}
          <br />
          Queried: {new Date(results.timestamps.consultado_em).toLocaleString()}
        </small>
      </div>
    </div>
  );
}

// ============================================================
// Styles (optional)
// ============================================================

export const styles = `
.results-container {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
  background: #f9f9f9;
}

.results-header h2 {
  margin: 0 0 10px 0;
  font-size: 24px;
}

.results-description {
  color: #666;
  margin: 0 0 20px 0;
}

.results-main {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin: 20px 0;
}

.results-probabilities ul,
.results-explanations ul {
  list-style: none;
  padding: 0;
}

.results-probabilities li,
.results-explanations li {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #e0e0e0;
}

.prob-value {
  font-weight: bold;
  color: #2196f3;
}

.confidence-bar {
  width: 100%;
  height: 30px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.confidence-fill {
  height: 100%;
  background: linear-gradient(90deg, #4caf50, #2196f3);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  transition: width 0.3s ease;
}

.results-raw {
  margin: 20px 0;
  padding: 10px;
  background: #f0f0f0;
  border-radius: 4px;
}

.results-raw pre {
  overflow-x: auto;
  max-height: 400px;
}

.results-actions {
  display: flex;
  gap: 10px;
  margin: 20px 0;
}

.results-actions button {
  padding: 8px 16px;
  border: 1px solid #2196f3;
  background: white;
  color: #2196f3;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.results-actions button:hover {
  background: #f0f7ff;
}

.recalculated-badge {
  background: #4caf50;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.results-metadata {
  color: #999;
  font-size: 12px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #e0e0e0;
}

.results-loading,
.results-error,
.results-empty {
  padding: 20px;
  text-align: center;
  color: #666;
}

.results-error {
  background: #ffebee;
  border: 1px solid #f44336;
  border-radius: 4px;
  color: #c62828;
}
`;
