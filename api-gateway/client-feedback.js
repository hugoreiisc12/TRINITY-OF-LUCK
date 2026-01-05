/**
 * TRINITY OF LUCK - Feedback Client Library
 * 
 * Handles feedback submission and learning loop integration
 * Provides JavaScript and React interfaces for sending feedback
 * 
 * Usage:
 *   const result = await submitFeedback(analysisId, 'vitoria');
 *   
 * React Hook:
 *   const { submitFeedback, loading, error } = useFeedback();
 *   await submitFeedback(analysisId, result);
 */

// ============================================================
// CONFIGURATION
// ============================================================

const FEEDBACK_API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
const FEEDBACK_ENDPOINT = `${FEEDBACK_API_URL}/api/feedback`;

const VALID_RESULTS = [
  'vitoria',           // Win/Success
  'empate',           // Draw/Tie
  'derrota',          // Loss/Failure
  'correto',          // Correct
  'incorreto',        // Incorrect
  true,               // Boolean true
  false,              // Boolean false
];

// ============================================================
// CORE FUNCTIONS
// ============================================================

/**
 * Submit feedback for an analysis
 * 
 * @param {string} analysisId - UUID of the analysis
 * @param {string|boolean} result - Outcome: 'vitoria', 'empate', 'derrota', 'correto', 'incorreto', true, false
 * @returns {Promise<{success: boolean, message: string, data: {feedbackId, analysisId, result, timestamp}}>}
 * 
 * @example
 * const feedback = await submitFeedback('550e8400-e29b-41d4-a716-446655440000', 'vitoria');
 * console.log(`Feedback ${feedback.data.feedbackId} saved`);
 */
export const submitFeedback = async (analysisId, result) => {
  try {
    // Validate inputs
    if (!analysisId || typeof analysisId !== 'string') {
      throw new Error('analysisId must be a non-empty string');
    }

    if (result === undefined || result === null) {
      throw new Error('result is required');
    }

    if (!VALID_RESULTS.includes(result)) {
      throw new Error(
        `Invalid result. Must be one of: ${VALID_RESULTS.join(', ')}`
      );
    }

    console.log(
      `📤 Submitting feedback for analysis ${analysisId}: ${result}`
    );

    // Send to API
    const response = await fetch(FEEDBACK_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        analysisId,
        result,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const error = new Error(data.error || 'Failed to submit feedback');
      error.status = response.status;
      error.details = data.details;
      throw error;
    }

    console.log(`✅ Feedback submitted:`, data);
    return data;

  } catch (error) {
    console.error('❌ Feedback submission error:', error);
    throw error;
  }
};

/**
 * Alias for submitFeedback with more descriptive name
 * 
 * @param {string} analysisId - UUID of the analysis
 * @param {string|boolean} result - Outcome
 * @returns {Promise<{success: boolean, message: string, data: {...}}>}
 */
export const submitAnalysisFeedback = async (analysisId, result) => {
  return submitFeedback(analysisId, result);
};

/**
 * Submit feedback and automatically refresh analysis results
 * Useful for updating UI after feedback submission
 * 
 * @param {string} analysisId - UUID of the analysis
 * @param {string|boolean} result - Outcome
 * @param {function} onSuccess - Callback when feedback is saved
 * @returns {Promise<{success: boolean, feedback: {...}, timestamp: string}>}
 * 
 * @example
 * const result = await submitFeedbackAndRefresh(
 *   analysisId,
 *   'vitoria',
 *   () => console.log('Analysis updated')
 * );
 */
export const submitFeedbackAndRefresh = async (
  analysisId,
  result,
  onSuccess
) => {
  try {
    // Submit feedback
    const feedbackResponse = await submitFeedback(analysisId, result);

    // Call success callback if provided
    if (typeof onSuccess === 'function') {
      onSuccess(feedbackResponse);
    }

    return {
      success: true,
      feedback: feedbackResponse.data,
      timestamp: new Date().toISOString(),
    };

  } catch (error) {
    console.error('❌ Feedback and refresh error:', error);
    throw error;
  }
};

/**
 * Batch submit multiple feedbacks
 * Useful for submitting multiple analysis results at once
 * 
 * @param {Array<{analysisId: string, result: string|boolean}>} feedbacks - Array of feedback objects
 * @returns {Promise<{success: boolean, submitted: number, failed: number, results: Array}>}
 * 
 * @example
 * const batch = await submitBatchFeedback([
 *   { analysisId: 'id1', result: 'vitoria' },
 *   { analysisId: 'id2', result: 'derrota' },
 * ]);
 * console.log(`Submitted ${batch.submitted}, failed: ${batch.failed}`);
 */
export const submitBatchFeedback = async (feedbacks) => {
  if (!Array.isArray(feedbacks) || feedbacks.length === 0) {
    throw new Error('feedbacks must be a non-empty array');
  }

  const results = [];
  let submitted = 0;
  let failed = 0;

  console.log(`📤 Submitting ${feedbacks.length} feedbacks...`);

  // Submit each feedback sequentially
  for (const feedback of feedbacks) {
    try {
      const response = await submitFeedback(
        feedback.analysisId,
        feedback.result
      );
      results.push({ ...feedback, success: true, response });
      submitted++;
    } catch (error) {
      console.warn(`Failed for ${feedback.analysisId}:`, error.message);
      results.push({ ...feedback, success: false, error: error.message });
      failed++;
    }
  }

  return {
    success: failed === 0,
    submitted,
    failed,
    results,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Get valid feedback result options
 * 
 * @returns {Array<string|boolean>}
 * 
 * @example
 * const options = getValidResults();
 * console.log(options); // ['vitoria', 'empate', 'derrota', 'correto', 'incorreto', true, false]
 */
export const getValidResults = () => [...VALID_RESULTS];

/**
 * Check if a result is valid
 * 
 * @param {string|boolean} result - Result to validate
 * @returns {boolean}
 * 
 * @example
 * if (isValidResult('vitoria')) {
 *   await submitFeedback(id, 'vitoria');
 * }
 */
export const isValidResult = (result) => VALID_RESULTS.includes(result);

// ============================================================
// REACT HOOKS
// ============================================================

/**
 * React Hook for feedback submission
 * Manages loading, error, and success states
 * 
 * @returns {{
 *   submitFeedback: function,
 *   loading: boolean,
 *   error: string|null,
 *   success: boolean,
 *   data: object|null,
 *   reset: function
 * }}
 * 
 * @example
 * export function FeedbackForm() {
 *   const { submitFeedback, loading, error, success } = useFeedback();
 *   
 *   const handleSubmit = async (e) => {
 *     e.preventDefault();
 *     try {
 *       await submitFeedback(analysisId, 'vitoria');
 *     } catch (err) {
 *       console.error(err);
 *     }
 *   };
 *   
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       <button disabled={loading}>
 *         {loading ? 'Enviando...' : 'Enviar Feedback'}
 *       </button>
 *       {error && <p style={{color: 'red'}}>{error}</p>}
 *       {success && <p style={{color: 'green'}}>Feedback enviado!</p>}
 *     </form>
 *   );
 * }
 */
export const useFeedback = () => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [success, setSuccess] = React.useState(false);
  const [data, setData] = React.useState(null);

  const handleSubmitFeedback = React.useCallback(
    async (analysisId, result) => {
      setLoading(true);
      setError(null);
      setSuccess(false);

      try {
        const response = await submitFeedback(analysisId, result);
        setData(response.data);
        setSuccess(true);
        return response;
      } catch (err) {
        const errorMessage = err.message || 'Failed to submit feedback';
        setError(errorMessage);
        setSuccess(false);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const reset = React.useCallback(() => {
    setLoading(false);
    setError(null);
    setSuccess(false);
    setData(null);
  }, []);

  return {
    submitFeedback: handleSubmitFeedback,
    loading,
    error,
    success,
    data,
    reset,
  };
};

// ============================================================
// REACT COMPONENTS
// ============================================================

/**
 * FeedbackForm Component
 * Pre-built feedback submission form
 * 
 * @param {Object} props
 * @param {string} props.analysisId - UUID of the analysis
 * @param {function} props.onSuccess - Callback when feedback is submitted
 * @param {function} props.onError - Callback when an error occurs
 * @param {string} props.className - CSS class for styling
 * @returns {JSX.Element}
 * 
 * @example
 * <FeedbackForm
 *   analysisId="550e8400-e29b-41d4-a716-446655440000"
 *   onSuccess={() => console.log('Feedback saved')}
 * />
 */
export const FeedbackForm = ({
  analysisId,
  onSuccess,
  onError,
  className = '',
}) => {
  const { submitFeedback, loading, error, success, reset } = useFeedback();
  const [selectedResult, setSelectedResult] = React.useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedResult) return;

    try {
      const response = await submitFeedback(analysisId, selectedResult);
      setSelectedResult('');
      if (onSuccess) onSuccess(response);
    } catch (err) {
      if (onError) onError(err);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`feedback-form ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '16px',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
      }}
    >
      <h3 style={{ margin: '0 0 12px 0' }}>Enviar Feedback</h3>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {VALID_RESULTS.map((result) => (
          <label key={result} style={{ display: 'flex', alignItems: 'center' }}>
            <input
              type="radio"
              name="result"
              value={result}
              checked={selectedResult === String(result)}
              onChange={(e) => setSelectedResult(e.target.value)}
              style={{ marginRight: '6px' }}
            />
            {String(result)}
          </label>
        ))}
      </div>

      <button
        type="submit"
        disabled={!selectedResult || loading}
        style={{
          padding: '8px 16px',
          backgroundColor: loading ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? 'Enviando...' : 'Enviar Feedback'}
      </button>

      {error && (
        <div
          style={{
            padding: '8px 12px',
            backgroundColor: '#fee',
            border: '1px solid #fcc',
            borderRadius: '4px',
            color: '#c33',
          }}
        >
          ❌ {error}
        </div>
      )}

      {success && (
        <div
          style={{
            padding: '8px 12px',
            backgroundColor: '#efe',
            border: '1px solid #cfc',
            borderRadius: '4px',
            color: '#3c3',
          }}
        >
          ✅ Feedback enviado com sucesso!
        </div>
      )}
    </form>
  );
};

// ============================================================
// EXPORT SUMMARY
// ============================================================

export default {
  // Core functions
  submitFeedback,
  submitAnalysisFeedback,
  submitFeedbackAndRefresh,
  submitBatchFeedback,
  getValidResults,
  isValidResult,

  // React
  useFeedback,
  FeedbackForm,
};
