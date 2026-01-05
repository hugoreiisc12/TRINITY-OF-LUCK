# POST /api/upload - Quick Reference

## Endpoint Summary
File upload for CSV/JSON with automatic cleaning and storage.

## Quick Commands

### Upload CSV File
```bash
JWT_TOKEN="your_jwt_token_here"

curl -X POST http://localhost:3001/api/upload \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -F "file=@markets.csv"
```

### Upload JSON File
```bash
curl -X POST http://localhost:3001/api/upload \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -F "file=@data.json"
```

## Quick Response Example

### Request
```bash
curl -X POST http://localhost:3001/api/upload \
  -H "Authorization: Bearer eyJ..." \
  -F "file=@sample.csv"
```

### Response (200 OK)
```json
{
  "success": true,
  "message": "Uploaded",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "filename": "sample.csv",
    "format": "csv",
    "recordsProcessed": 2,
    "records": [
      {"name": "Market A", "value": "50"},
      {"name": "Market B", "value": "75"}
    ],
    "timestamp": "2026-01-04T10:30:00.000Z"
  }
}
```

## File Format Examples

### CSV Input
```csv
id,name,value,status
1,Market A,50,active
2,Market B,75,active
```

### JSON Input
```json
[
  {"id": "1", "name": "Market A", "value": 50},
  {"id": "2", "name": "Market B", "value": 75}
]
```

## JavaScript Usage

```javascript
// Import functions
import { uploadFile, uploadCSV, uploadJSON } from './client-upload.js';

// Simple upload
async function upload() {
  const file = document.querySelector('input[type="file"]').files[0];
  const token = localStorage.getItem('jwt_token');
  
  try {
    const result = await uploadFile(file, token);
    console.log('Success:', result.data.recordsProcessed, 'records');
    console.log('Data:', result.data.records);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// With progress
import { uploadFileWithProgress } from './client-upload.js';

const file = fileInput.files[0];
const result = await uploadFileWithProgress(file, token, (progress) => {
  console.log(`Upload: ${progress.toFixed(0)}%`);
});
```

## Features

✅ **Auto Clean** - Removes null/empty values  
✅ **CSV/JSON** - Both formats supported  
✅ **Size Limit** - Max 5MB per file  
✅ **Error Handling** - Detailed error messages  
✅ **Metadata** - Filename, format, record count  
✅ **User Linked** - Associated with JWT user  

## Common Errors

| Error | Solution |
|-------|----------|
| 401 Unauthorized | Check JWT token in Authorization header |
| 400 No file provided | Add `-F "file=@filename"` to curl |
| 400 Unsupported file format | Use .csv or .json extension |
| 413 File too large | File exceeds 5MB limit |
| 400 Invalid JSON | Check JSON syntax (use JSONLint) |

## Storage

All uploaded data is stored in Supabase `contextos` table:
- **Table:** contextos
- **User Scoped:** Each user only sees their uploads
- **Query:** `SELECT * FROM contextos WHERE tipo_origem = 'upload'`

## Advanced Usage

```javascript
// Get statistics
import { getFileStatistics } from './client-upload.js';
const stats = await getFileStatistics(file, token);
console.log('Total records:', stats.totalRecords);
console.log('Fields:', stats.fieldNames);

// Batch upload
import { batchUploadFiles } from './client-upload.js';
const files = Array.from(fileInput.files);
const results = await batchUploadFiles(files, token);

// Filter records
import { uploadAndFilterRecords } from './client-upload.js';
const filtered = await uploadAndFilterRecords(
  file, 
  token,
  record => record.value > 50
);
```

---

**Rate Limit:** 100 requests/min per IP  
**Auth:** Required (JWT)  
**Max Size:** 5MB  
**Formats:** CSV, JSON
