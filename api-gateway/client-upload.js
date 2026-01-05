// Client library for file upload functionality
// Integrates with POST /api/upload endpoint

/**
 * Upload a file (CSV or JSON) to the server
 * @param {File} file - The file to upload
 * @param {string} jwtToken - JWT authentication token
 * @returns {Promise<Object>} Upload response with processed data
 */
export async function uploadFile(file, jwtToken) {
  if (!file) {
    throw new Error('File is required');
  }

  if (!jwtToken) {
    throw new Error('JWT token is required');
  }

  const allowedExtensions = ['csv', 'json'];
  const fileExtension = file.name.split('.').pop().toLowerCase();

  if (!allowedExtensions.includes(fileExtension)) {
    throw new Error(`Only ${allowedExtensions.join(', ')} files are supported`);
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error('File size must be less than 5MB');
  }

  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Upload failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
}

/**
 * Upload a CSV file
 * @param {File} file - CSV file to upload
 * @param {string} jwtToken - JWT authentication token
 * @returns {Promise<Object>} Upload response with parsed CSV data
 */
export async function uploadCSV(file, jwtToken) {
  if (!file.name.toLowerCase().endsWith('.csv')) {
    throw new Error('File must be a CSV file');
  }
  return uploadFile(file, jwtToken);
}

/**
 * Upload a JSON file
 * @param {File} file - JSON file to upload
 * @param {string} jwtToken - JWT authentication token
 * @returns {Promise<Object>} Upload response with parsed JSON data
 */
export async function uploadJSON(file, jwtToken) {
  if (!file.name.toLowerCase().endsWith('.json')) {
    throw new Error('File must be a JSON file');
  }
  return uploadFile(file, jwtToken);
}

/**
 * Upload and get record count without processing
 * @param {File} file - File to upload
 * @param {string} jwtToken - JWT authentication token
 * @returns {Promise<number>} Number of records in file
 */
export async function getRecordCount(file, jwtToken) {
  const result = await uploadFile(file, jwtToken);
  return result.data.recordsProcessed;
}

/**
 * Upload and get raw data records
 * @param {File} file - File to upload
 * @param {string} jwtToken - JWT authentication token
 * @returns {Promise<Array>} Array of data records
 */
export async function getRecords(file, jwtToken) {
  const result = await uploadFile(file, jwtToken);
  return result.data.records;
}

/**
 * Upload file with progress tracking
 * @param {File} file - File to upload
 * @param {string} jwtToken - JWT authentication token
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise<Object>} Upload response
 */
export async function uploadFileWithProgress(file, jwtToken, onProgress) {
  if (!file) {
    throw new Error('File is required');
  }

  if (!jwtToken) {
    throw new Error('JWT token is required');
  }

  const formData = new FormData();
  formData.append('file', file);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Track upload progress
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const percentComplete = (event.loaded / event.total) * 100;
        onProgress?.(percentComplete);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (error) {
          reject(new Error('Invalid response format'));
        }
      } else {
        try {
          const errorData = JSON.parse(xhr.responseText);
          reject(new Error(errorData.error || `Upload failed with status ${xhr.status}`));
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload cancelled'));
    });

    xhr.open('POST', '/api/upload');
    xhr.setRequestHeader('Authorization', `Bearer ${jwtToken}`);
    xhr.send(formData);
  });
}

/**
 * Batch upload multiple files
 * @param {File[]} files - Array of files to upload
 * @param {string} jwtToken - JWT authentication token
 * @returns {Promise<Object[]>} Array of upload responses
 */
export async function batchUploadFiles(files, jwtToken) {
  if (!Array.isArray(files) || files.length === 0) {
    throw new Error('At least one file is required');
  }

  const results = [];
  for (const file of files) {
    try {
      const result = await uploadFile(file, jwtToken);
      results.push({
        filename: file.name,
        success: true,
        data: result.data,
      });
    } catch (error) {
      results.push({
        filename: file.name,
        success: false,
        error: error.message,
      });
    }
  }
  return results;
}

/**
 * Upload and filter records by criteria
 * @param {File} file - File to upload
 * @param {string} jwtToken - JWT authentication token
 * @param {Function} filterFn - Filter function (returns true to keep)
 * @returns {Promise<Array>} Filtered records
 */
export async function uploadAndFilterRecords(file, jwtToken, filterFn) {
  const result = await uploadFile(file, jwtToken);
  return result.data.records.filter(filterFn);
}

/**
 * Upload and transform records
 * @param {File} file - File to upload
 * @param {string} jwtToken - JWT authentication token
 * @param {Function} mapFn - Transform function
 * @returns {Promise<Array>} Transformed records
 */
export async function uploadAndMapRecords(file, jwtToken, mapFn) {
  const result = await uploadFile(file, jwtToken);
  return result.data.records.map(mapFn);
}

/**
 * Upload CSV and convert to JSON
 * @param {File} file - CSV file to upload
 * @param {string} jwtToken - JWT authentication token
 * @returns {Promise<string>} JSON string representation
 */
export async function uploadCSVAndConvertToJSON(file, jwtToken) {
  if (!file.name.toLowerCase().endsWith('.csv')) {
    throw new Error('File must be a CSV file');
  }

  const result = await uploadFile(file, jwtToken);
  return JSON.stringify(result.data.records, null, 2);
}

/**
 * Upload JSON and convert to CSV
 * @param {File} file - JSON file to upload
 * @param {string} jwtToken - JWT authentication token
 * @returns {Promise<string>} CSV string representation
 */
export async function uploadJSONAndConvertToCSV(file, jwtToken) {
  if (!file.name.toLowerCase().endsWith('.json')) {
    throw new Error('File must be a JSON file');
  }

  const result = await uploadFile(file, jwtToken);
  const records = result.data.records;

  if (records.length === 0) {
    return '';
  }

  // Get all unique keys
  const allKeys = new Set();
  records.forEach(record => {
    Object.keys(record).forEach(key => allKeys.add(key));
  });

  const keys = Array.from(allKeys);
  const header = keys.join(',');

  const rows = records.map(record => {
    return keys.map(key => {
      const value = record[key] ?? '';
      // Escape quotes and wrap in quotes if contains comma
      const stringValue = String(value).replace(/"/g, '""');
      return stringValue.includes(',') ? `"${stringValue}"` : stringValue;
    }).join(',');
  });

  return [header, ...rows].join('\n');
}

/**
 * Get file upload statistics
 * @param {File} file - File to analyze
 * @param {string} jwtToken - JWT authentication token
 * @returns {Promise<Object>} File statistics
 */
export async function getFileStatistics(file, jwtToken) {
  const result = await uploadFile(file, jwtToken);
  const records = result.data.records;

  if (records.length === 0) {
    return {
      totalRecords: 0,
      totalFields: 0,
      fieldNames: [],
    };
  }

  const fieldNames = Object.keys(records[0]);
  const stats = {
    totalRecords: records.length,
    totalFields: fieldNames.length,
    fieldNames: fieldNames,
    recordSizes: records.map(r => Object.keys(r).length),
    averageFieldsPerRecord: fieldNames.length,
  };

  return stats;
}

/**
 * Upload file and save to localStorage for offline access
 * @param {File} file - File to upload
 * @param {string} jwtToken - JWT authentication token
 * @param {string} storageKey - localStorage key
 * @returns {Promise<Object>} Upload response
 */
export async function uploadAndCache(file, jwtToken, storageKey) {
  const result = await uploadFile(file, jwtToken);
  localStorage.setItem(storageKey, JSON.stringify(result.data));
  return result;
}

/**
 * Get cached upload data
 * @param {string} storageKey - localStorage key
 * @returns {Object|null} Cached data or null
 */
export function getCachedUpload(storageKey) {
  const cached = localStorage.getItem(storageKey);
  return cached ? JSON.parse(cached) : null;
}

/**
 * Clear cached upload data
 * @param {string} storageKey - localStorage key
 */
export function clearCachedUpload(storageKey) {
  localStorage.removeItem(storageKey);
}

/**
 * Validate file before upload
 * @param {File} file - File to validate
 * @returns {Object} Validation result { valid, errors }
 */
export function validateFile(file) {
  const errors = [];

  if (!file) {
    errors.push('No file provided');
    return { valid: false, errors };
  }

  const allowedExtensions = ['csv', 'json'];
  const fileExtension = file.name.split('.').pop().toLowerCase();

  if (!allowedExtensions.includes(fileExtension)) {
    errors.push(`File type .${fileExtension} not supported. Use: ${allowedExtensions.join(', ')}`);
  }

  if (file.size > 5 * 1024 * 1024) {
    errors.push(`File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds 5MB limit`);
  }

  if (file.size === 0) {
    errors.push('File is empty');
  }

  return {
    valid: errors.length === 0,
    errors,
    file: {
      name: file.name,
      size: file.size,
      type: file.type,
      extension: fileExtension,
    },
  };
}

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted size string
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// Export all functions
export default {
  uploadFile,
  uploadCSV,
  uploadJSON,
  getRecordCount,
  getRecords,
  uploadFileWithProgress,
  batchUploadFiles,
  uploadAndFilterRecords,
  uploadAndMapRecords,
  uploadCSVAndConvertToJSON,
  uploadJSONAndConvertToCSV,
  getFileStatistics,
  uploadAndCache,
  getCachedUpload,
  clearCachedUpload,
  validateFile,
  formatFileSize,
};
