# CSV Upload System - User Guide

## Overview

The CSV Upload System allows administrators to upload recruiter and student data via CSV (Comma-Separated Values) files. This replaces the previous web scraping functionality with a more reliable and controlled data import process.

## Features

- ✅ **Drag-and-drop CSV upload**
- ✅ **Automatic data validation**
- ✅ **Duplicate email detection** (upserts existing records)
- ✅ **Error tracking** with row-level details
- ✅ **Background processing** for large files
- ✅ **File management** (view, download, delete uploads)
- ✅ **Statistics dashboard**
- ✅ **Template downloads**

## Getting Started

### 1. Access CSV Upload Manager

Navigate to: `http://localhost:5173/admin/csv-upload`

### 2. Download Templates

Click the template download links to get pre-formatted CSV files:
- **Recruiter Template**: Contains sample recruiter data
- **Student Template**: Contains sample student data

### 3. Prepare Your CSV File

#### Recruiter CSV Format

**Required Columns:**
- `name` - Full name of the recruiter
- `email` - Valid email address (must be unique)

**Optional Columns:**
- `company` - Company name
- `jobTitle` - Job title
- `linkedIn` - LinkedIn profile URL
- `country` - Country name (e.g., USA, Canada, UK)
- `field` - Industry/field (e.g., Technology, Finance, Healthcare)

**Example:**
```csv
name,email,company,jobTitle,linkedIn,country,field
John Doe,john@techcorp.com,Tech Corp,Senior Recruiter,linkedin.com/in/johndoe,USA,Technology
Jane Smith,jane@startup.io,Startup Inc,HR Manager,,Canada,Finance
```

#### Student CSV Format

**Required Columns:**
- `name` - Full name of the student
- `email` - Valid email address (must be unique)

**Optional Columns:**
- `phone` - Phone number
- `university` - University name  
- `major` - Major/field of study
- `graduationYear` - Year of graduation (e.g., 2025)
- `country` - Country name
- `degree` - Degree type (e.g., B.Tech, M.S., MBA)

**Example:**
```csv
name,email,phone,university,major,graduationYear,country,degree
Alice Johnson,alice@university.edu,+1-234-567-8900,MIT,Computer Science,2025,USA,B.Tech
Bob Lee,bob@college.edu,,Stanford,Data Science,2024,USA,M.S.
```

### 4. Upload CSV File

1. **Select Data Type**: Choose either "Recruiter CSV" or "Student CSV"
2. **Upload File**: 
   - Drag and drop the CSV file onto the upload zone
   - OR click the upload zone to browse for files
3. **Wait for Processing**: The file will upload and process automatically
   - Upload progress is shown with a progress bar
   - Processing happens in the background

### 5. Monitor Upload Status

After uploading, your CSV will appear in the uploads list with:
- **Status Badge**: 
  - 🟡 Pending - Waiting to process
  - 🔵 Processing - Currently being processed
  - 🟢 Completed - Successfully processed
  - 🔴 Failed - Processing failed
- **Statistics**:
  - Total Records - Number of rows in CSV
  - Success - Records successfully saved
  - Errors - Records that failed validation

## Validation Rules

### Recruiter Validation

- ✅ `name` field must not be empty
- ✅ `email` must be valid email format
- ✅ `email` must be unique (duplicates update existing records)
- ✅ `graduationYear` (if provided) must be between 1900-2100

### Student Validation

- ✅ `name` field must not be empty
- ✅ `email` must be valid email format
- ✅ `email` must be unique (duplicates update existing records)
- ✅ `graduationYear` (if provided) must be a valid number

## Error Handling

### View Errors

If your upload has errors (red error count > 0):
- Errors are automatically tracked row-by-row
- Click "View Details" to see specific error messages
- Error details include:
  - Row number
  - Error message
  - Problematic field
  - Row data (for reference)

### Common Errors

1. **Missing required field** - Add the missing column to your CSV
2. **Invalid email format** - Check email addresses are correctly formatted
3. **Invalid graduation year** - Ensure year is a number between 1900-2100
4. **Database error** - Usually indicates data type mismatch or constraint violation

### Fix and Reupload

If you have errors:
1. Download the original CSV using the download button
2. Fix the errors in the CSV file
3. Delete the failed upload (optional)
4. Upload the corrected CSV

## Features

### Download Original CSV

Click the **Download** button (⬇️) to download the original CSV file you uploaded.

### Delete Upload

Click the **Delete** button (🗑️) to:
- Remove the CSV record from the database
- Delete the physical file from the server
- Note: This does NOT delete the imported data (recruiters/students)

### Reprocess Failed Upload

For failed uploads:
- Click the **Reprocess** button (🔄) to retry processing
- Useful if processing failed due to temporary issues

### Filter Uploads

Use the filter buttons to view:
- **All** - Show all uploads
- **Recruiter** - Show only recruiter uploads
- **Student** - Show only student uploads

## File Limits

- **Maximum File Size**: 10 MB
- **Accepted Formats**: .csv only
- **Encoding**: UTF-8 recommended

## Best Practices

1. **Use Templates**: Download and modify the provided templates
2. **Test with Small File**: Upload a small test CSV (5-10 rows) first
3. **Check Formatting**: Ensure no extra commas or special characters
4. **Validate Emails**: Use valid email addresses
5. **Remove Duplicates**: Clean your data before upload (duplicate emails will update existing records)
6. **UTF-8 Encoding**: Save CSVs in UTF-8 format to avoid character issues

## Troubleshooting

### Upload Stuck on "Processing"

- Wait a few minutes (large files take time)
- Refresh the page to see updated status
- Check browser console for errors

### File Upload Failed

- Check file size (must be < 10MB)
- Ensure file extension is .csv
- Try a different browser

### All Records Failed

- Check CSV format matches template
- Ensure required columns (name, email) are present
- Verify email addresses are valid

### Partial Success

- Some rows succeeded, some failed (normal for data quality issues)
- Check error details for failed rows
- Fix and reupload only failed records

## API Endpoints

For developers integrating with the CSV upload system:

```javascript
// Upload CSV
POST /api/csv/upload
Content-Type: multipart/form-data
Body: { file: File, recordType: 'recruiter' | 'student' }

// List uploads
GET /api/csv/uploads?page=1&limit=20&recordType=recruiter

// Get upload details
GET /api/csv/uploads/:id

// Download CSV
GET /api/csv/uploads/:id/download

// Delete upload
DELETE /api/csv/uploads/:id

// Reprocess upload
POST /api/csv/uploads/:id/reprocess

// Get statistics
GET /api/csv/stats
```

## Migration from Scraping

If you previously used web scraping:

1. **Export existing data** (optional): Use the export feature in Lead Manager
2. **CSV uploads replace scraping**: Data now comes from CSV files you upload
3. **Scraping routes removed**: `/admin/scraping` no longer exists
4. **New route**: Access CSV uploads at `/admin/csv-upload`

## Support

For issues or questions:
- Check this documentation
- Review error messages in the upload details
- Contact system administrator

---

**Last Updated**: December 17, 2024
