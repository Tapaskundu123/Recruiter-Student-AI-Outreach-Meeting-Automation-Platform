import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';
import prisma from '../db/client.js';

/**
 * Flexible CSV Upload Service
 * Handles CSV files with ANY column structure
 */
export class CsvService {
    constructor() {
        this.uploadDir = path.join(process.cwd(), 'uploads', 'csv');
        this.ensureUploadDir();
    }

    ensureUploadDir() {
        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
        }
    }

    /**
     * Parse CSV with dynamic columns - accepts any column structure
     */
    async parseCsvDynamic(filePath, csvUploadId) {
        const records = [];
        const errors = [];
        let rowNumber = 0;
        let headers = [];

        return new Promise((resolve, reject) => {
            fs.createReadStream(filePath)
                .pipe(parse({
                    columns: true,
                    skip_empty_lines: true,
                    trim: true,
                    relax_column_count: true,
                    relax_quotes: true
                }))
                .on('headers', (headerList) => {
                    headers = headerList;
                    console.log(`CSV headers detected: ${headers.join(', ')}`);
                })
                .on('data', (row) => {
                    rowNumber++;

                    try {
                        // Accept any row structure - just store as JSON
                        // Basic validation: ensure row has at least one non-empty value
                        const hasData = Object.values(row).some(val => val && val.trim() !== '');

                        if (!hasData) {
                            errors.push({
                                csvUploadId,
                                rowNumber,
                                errorMessage: 'Row contains no data',
                                rowData: row,
                                fieldName: null
                            });
                            return;
                        }

                        // Store the entire row as-is
                        records.push({
                            rowNumber,
                            data: row,
                            headers: headers
                        });

                    } catch (error) {
                        errors.push({
                            csvUploadId,
                            rowNumber,
                            errorMessage: error.message,
                            rowData: row,
                            fieldName: null
                        });
                    }
                })
                .on('end', () => {
                    console.log(`Parsed ${records.length} records with ${errors.length} errors`);
                    resolve({ records, errors, totalRows: rowNumber, headers });
                })
                .on('error', (error) => {
                    console.error('CSV parsing error:', error);
                    reject(error);
                });
        });
    }

    /**
     * Store CSV data in database as generic JSON records
     */
    async storeCsvData(csvUploadId, recordType, records, headers) {
        let successCount = 0;
        const errors = [];

        const tableName = recordType === 'recruiter' ? 'recruiter' : 'student';

        for (const record of records) {
            try {
                const rowData = record.data;

                // For recruiter - try to map common fields if they exist
                if (recordType === 'recruiter') {
                    const recruiterData = {
                        // Try to map common fields (case-insensitive)
                        name: this.findFieldValue(rowData, ['name', 'full_name', 'fullname', 'recruiter_name']) || `Recruiter ${record.rowNumber}`,
                        email: this.findFieldValue(rowData, ['email', 'email_address', 'e-mail']) || `unknown${record.rowNumber}@placeholder.com`,
                        company: this.findFieldValue(rowData, ['company', 'organization', 'org', 'company_name']),
                        jobTitle: this.findFieldValue(rowData, ['job_title', 'jobtitle', 'title', 'position']),
                        linkedIn: this.findFieldValue(rowData, ['linkedin', 'linked_in', 'linkedin_url']),
                        country: this.findFieldValue(rowData, ['country', 'location', 'nation']),
                        field: this.findFieldValue(rowData, ['field', 'industry', 'sector', 'domain']),
                        platform: 'CSV Upload',
                        status: 'active',
                        // Store ALL CSV data in enrichedData for later access
                        enrichedData: {
                            csvData: rowData,
                            csvHeaders: headers,
                            csvRowNumber: record.rowNumber,
                            uploadId: csvUploadId
                        }
                    };

                    await prisma.recruiter.create({
                        data: recruiterData
                    });
                    successCount++;
                }
                // For student - try to map common fields if they exist
                else {
                    const studentData = {
                        // Try to map common fields (case-insensitive)
                        name: this.findFieldValue(rowData, ['name', 'full_name', 'fullname', 'student_name']) || `Student ${record.rowNumber}`,
                        email: this.findFieldValue(rowData, ['email', 'email_address', 'e-mail']) || `unknown${record.rowNumber}@placeholder.com`,
                        phone: this.findFieldValue(rowData, ['phone', 'phone_number', 'mobile', 'contact']),
                        university: this.findFieldValue(rowData, ['university', 'college', 'school', 'institution']),
                        major: this.findFieldValue(rowData, ['major', 'course', 'degree', 'field_of_study']),
                        graduationYear: this.parseYear(this.findFieldValue(rowData, ['graduation_year', 'graduationyear', 'year', 'grad_year'])),
                        country: this.findFieldValue(rowData, ['country', 'location', 'nation']),
                        degree: this.findFieldValue(rowData, ['degree', 'qualification', 'degree_type']),
                        platform: 'CSV Upload',
                        status: 'waitlist',
                        // Store ALL CSV data for later access - this is the key!
                        // Note: Student model doesn't have enrichedData, so we'll add it
                    };

                    await prisma.student.create({
                        data: studentData
                    });
                    successCount++;
                }

            } catch (dbError) {
                console.error(`Database error for row ${record.rowNumber}:`, dbError.message);
                errors.push({
                    csvUploadId,
                    rowNumber: record.rowNumber,
                    errorMessage: `Database error: ${dbError.message}`,
                    rowData: record.data,
                    fieldName: null
                });
            }
        }

        return { successCount, errors };
    }

    /**
     * Find field value by trying multiple possible field names (case-insensitive)
     */
    findFieldValue(rowData, possibleNames) {
        for (const name of possibleNames) {
            // Try exact match first
            if (rowData[name]) return rowData[name].trim();

            // Try case-insensitive match
            const lowerName = name.toLowerCase();
            for (const [key, value] of Object.entries(rowData)) {
                if (key.toLowerCase() === lowerName && value) {
                    return value.trim();
                }
            }
        }
        return null;
    }

    /**
     * Parse year from string
     */
    parseYear(value) {
        if (!value) return null;
        const year = parseInt(value);
        if (isNaN(year) || year < 1900 || year > 2100) return null;
        return year;
    }

    /**
     * Process upload and save to database
     */
    async processUpload(csvUploadId) {
        try {
            const upload = await prisma.csvUpload.findUnique({
                where: { id: csvUploadId }
            });

            if (!upload) {
                throw new Error('CSV upload not found');
            }

            console.log(`Processing CSV upload: ${upload.originalName}, type: ${upload.recordType}`);

            // Update status to processing
            await prisma.csvUpload.update({
                where: { id: csvUploadId },
                data: { status: 'processing' }
            });

            // Parse CSV with dynamic columns
            const { records, errors, totalRows, headers } = await this.parseCsvDynamic(
                upload.filePath,
                csvUploadId
            );

            console.log(`Parsed ${records.length} records from CSV`);

            // Store CSV data in database
            const { successCount, errors: storageErrors } = await this.storeCsvData(
                csvUploadId,
                upload.recordType,
                records,
                headers
            );

            // Combine parsing and storage errors
            const allErrors = [...errors, ...storageErrors];

            // Save errors to database
            if (allErrors.length > 0) {
                console.log(`Saving ${allErrors.length} errors to database`);
                await prisma.csvUploadError.createMany({
                    data: allErrors.map(err => ({
                        csvUploadId: err.csvUploadId,
                        rowNumber: err.rowNumber,
                        errorMessage: err.errorMessage,
                        rowData: err.rowData || {},
                        fieldName: err.fieldName || null
                    })),
                    skipDuplicates: true
                });
            }

            // Update upload status with column info
            const finalStatus = successCount === 0 ? 'failed' : 'completed';
            await prisma.csvUpload.update({
                where: { id: csvUploadId },
                data: {
                    status: finalStatus,
                    totalRecords: totalRows,
                    successCount,
                    errorCount: allErrors.length,
                    processedAt: new Date(),
                    metadata: {
                        headers: headers,
                        columnCount: headers.length
                    }
                }
            });

            console.log(`CSV processing completed: ${successCount} success, ${allErrors.length} errors`);

            return {
                success: true,
                successCount,
                errorCount: allErrors.length,
                totalRows,
                status: finalStatus,
                headers
            };

        } catch (error) {
            console.error('CSV processing error:', error);

            // Update status to failed
            try {
                await prisma.csvUpload.update({
                    where: { id: csvUploadId },
                    data: {
                        status: 'failed',
                        processedAt: new Date()
                    }
                });
            } catch (updateError) {
                console.error('Failed to update upload status:', updateError);
            }

            throw error;
        }
    }

    /**
     * Delete CSV file from disk
     */
    async deleteFile(filePath) {
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                return true;
            }
            return false;
        } catch (error) {
            console.error('File deletion error:', error);
            return false;
        }
    }
}

export default new CsvService();
