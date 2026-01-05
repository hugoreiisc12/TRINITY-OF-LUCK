# POST /api/upload - File Upload Endpoint

## Overview
Upload CSV or JSON files to import context data. Acts as a fallback for data import when URL scraping is not available. The endpoint automatically cleans data (removes null/empty values) and stores it in the Supabase `contextos` table.

## Authentication
✅ **Required:** JWT Bearer Token in Authorization header

## Request

### Endpoint
```
POST /api/upload
Content-Type: multipart/form-data
Authorization: Bearer <JWT_TOKEN>
```

### Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `file` | File | Yes | CSV or JSON file (max 5MB) |

### Supported File Formats

#### CSV Format
```csv
name,value,category
Market A,50,prediction
Market B,75,sports
```

#### JSON Format
```json
[
  { "name": "Market A", "value": 50, "category": "prediction" },
  { "name": "Market B", "value": 75, "category": "sports" }
]
```

## Response

### Success (200)
```json
{
  "success": true,
  "message": "Uploaded",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "filename": "markets.csv",
    "format": "csv",
    "recordsProcessed": 2,
    "records": [
      { "name": "Market A", "value": "50", "category": "prediction" },
      { "name": "Market B", "value": "75", "category": "sports" }
    ],
    "timestamp": "2026-01-04T10:30:00.000Z"
  }
}
```

### Error Responses

#### Missing File (400)
```json
{
  "success": false,
  "message": "No file provided",
  "error": "File is required"
}
```

#### Invalid File Type (400)
```json
{
  "success": false,
  "message": "Unsupported file format",
  "error": "Only CSV and JSON files are supported"
}
```

#### File Too Large (413)
```json
{
  "success": false,
  "message": "File too large",
  "error": "Maximum file size is 5MB"
}
```

#### Invalid JSON (400)
```json
{
  "success": false,
  "message": "Failed to parse JSON",
  "error": "Unexpected token } in JSON at position 42"
}
```

#### No Valid Data (400)
```json
{
  "success": false,
  "message": "No valid data in file",
  "error": "File contains no valid records after cleaning"
}
```

#### Unauthorized (401)
```json
{
  "success": false,
  "message": "Unauthorized",
  "error": "No valid JWT token provided"
}
```

#### Database Error (500)
```json
{
  "success": false,
  "message": "Failed to store data",
  "error": "Supabase error details..."
}
```

## Features

✅ **Multi-Format Support** - CSV and JSON files  
✅ **Data Cleaning** - Automatically removes null and empty values  
✅ **Size Limit** - 5MB maximum file size  
✅ **Record Processing** - Parses and validates all records  
✅ **Metadata** - Stores filename, format, and record count  
✅ **User Association** - Links data to authenticated user  
✅ **Timestamp** - Records exact upload time  
✅ **Error Handling** - Detailed error messages  

## Data Storage

Uploaded data is stored in the `contextos` table with:

```javascript
{
  user_id: "user-uuid",                    // From JWT
  titulo: "filename.csv",                  // Original filename
  tipo_origem: "upload",                   // Data source type
  url: null,                               // No URL for uploads
  dados_brutos: {
    filename: "markets.csv",
    fileType: "csv",
    recordCount: 2,
    uploadedAt: "2026-01-04T10:30:00.000Z"
  },
  dados_processados: [
    { name: "Market A", value: "50", ... },
    { name: "Market B", value: "75", ... }
  ],
  eventos: [],                             // Empty for file uploads
  variaveis: {
    source: "file_upload",
    filename: "markets.csv",
    format: "csv",
    recordCount: 2
  },
  tags: ["csv", "uploaded", "fallback"],
  status: "ativo",
  criado_em: "2026-01-04T10:30:00.000Z"
}
```

## Testing

### Using cURL

```bash
# Get JWT token first
JWT_TOKEN="eyJ..."

# Upload CSV file
curl -X POST http://localhost:3001/api/upload \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -F "file=@markets.csv"

# Upload JSON file
curl -X POST http://localhost:3001/api/upload \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -F "file=@data.json"
```

### Using JavaScript/Fetch

```javascript
async function uploadFile(file, jwtToken) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${jwtToken}`,
    },
    body: formData,
  });

  return response.json();
}

// Usage
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];
const result = await uploadFile(file, jwtToken);
console.log(result);
```

### Using Axios

```javascript
async function uploadFile(file, jwtToken) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post('/api/upload', formData, {
    headers: {
      'Authorization': `Bearer ${jwtToken}`,
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
}

// Usage
const result = await uploadFile(fileInput.files[0], token);
console.log('Uploaded:', result.data.recordsProcessed, 'records');
```

## Data Cleaning Process

### What Gets Removed
- `null` values
- Empty strings (`""`)
- Whitespace-only fields (trimmed and considered empty)
- Undefined values

### What Gets Kept
- Numbers (including 0)
- Boolean values (true/false)
- Non-empty strings
- Objects/nested data

### Example

**Input CSV:**
```csv
id,name,value,,status
1,Market A,50,,active
2,Market B,,75,null
3,,null,100,active
```

**After Cleaning:**
```json
[
  { "id": "1", "name": "Market A", "value": "50", "status": "active" },
  { "id": "2", "value": "75" },
  { "id": "3", "value": "100", "status": "active" }
]
```

## Rate Limiting

- **Global Limit:** 100 requests/minute per IP
- **Per-User Limit:** Subject to rate limiting for all API requests
- **File Upload Specific:** Uses the same rate limiting as other API endpoints

## File Size Limits

| Format | Max Size | Max Records (Recommended) |
|--------|----------|--------------------------|
| CSV | 5MB | 10,000 records |
| JSON | 5MB | 5,000 records |

## Use Cases

1. **Batch Data Import** - Import hundreds of records at once
2. **Market Data** - Load prediction market data
3. **Historical Data** - Import past events for analysis
4. **Statistical Data** - Load datasets for analysis
5. **Configuration** - Import custom parameters and settings
6. **Testing** - Quick data loading for development

## Limitations

- ❌ No streaming/chunked uploads
- ❌ No compression support
- ❌ No automatic format detection beyond extension
- ❌ No data transformation/mapping
- ❌ Records stored as-is (no schema enforcement)

## Best Practices

✅ **Do:**
- Validate CSV/JSON format before uploading
- Use meaningful filenames
- Keep files under 5MB
- Ensure headers/keys are consistent
- Remove duplicate records before uploading

❌ **Don't:**
- Upload files with sensitive information
- Upload multiple times with same data
- Mix different data types in one upload
- Upload unvalidated/untrusted data
- Rely on automatic cleaning for complex transformations

## Future Enhancements

- [ ] Support for XML, YAML, XLSX formats
- [ ] Chunked file uploads for large files
- [ ] Data transformation/mapping rules
- [ ] Duplicate detection and removal
- [ ] Scheduled bulk imports
- [ ] Import history and versioning
- [ ] Data validation schema
- [ ] Background processing for large files

## Technical Details

- **Parser:** csv-parser for CSV, JSON.parse for JSON
- **Storage:** Multer memory storage (temporary in RAM)
- **Validation:** File extension and MIME type checking
- **Error Handling:** Comprehensive try-catch with detailed messages
- **Async:** Non-blocking file processing using Streams (CSV)

## Integration Example

```javascript
// Import context utility functions
import {
  uploadFile,
  uploadCSV,
  uploadJSON,
  uploadAndAnalyze
} from './client-protected-endpoints.js';

// Simple file upload
async function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const result = await uploadFile(file, jwtToken);
    console.log('Processed', result.data.recordsProcessed, 'records');
    console.log('Data:', result.data.records);
  } catch (error) {
    console.error('Upload failed:', error);
  }
}

// With type checking
async function uploadCSVData(file) {
  if (file.type !== 'text/csv') {
    throw new Error('Must be a CSV file');
  }
  return await uploadCSV(file, jwtToken);
}
```

---

**Last Updated:** January 4, 2026  
**Status:** Production Ready  
**Authentication:** Required (JWT)  
**Rate Limited:** Yes (100 req/min)  
**Max File Size:** 5MB
