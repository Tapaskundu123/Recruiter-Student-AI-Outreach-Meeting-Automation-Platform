import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { body, query, validationResult } from 'express-validator';
import prisma from '../db/client.js';
import csvService from '../services/csvService.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(process.cwd(), 'uploads', 'csv');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        cb(null, `${uniqueSuffix}-${file.originalname}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext !== '.csv') {
            return cb(new Error('Only CSV files are allowed'));
        }
        const mimeType = file.mimetype;
        if (mimeType !== 'text/csv' && mimeType !== 'application/vnd.ms-excel') {
            return cb(new Error('Invalid file type'));
        }
        cb(null, true);
    }
});

/**
 * POST /api/csv/upload
 * Upload a CSV file
 */
router.post('/upload',
    upload.single('file'),
    [
        body('recordType').isIn(['recruiter', 'student']).withMessage('Invalid record type')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                // Delete uploaded file if validation fails
                if (req.file) {
                    fs.unlinkSync(req.file.path);
                }
                return res.status(400).json({ errors: errors.array() });
            }

            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

            const { recordType } = req.body;

            console.log(`CSV upload started: ${req.file.originalname}, type: ${recordType}`);

            // Create CSV upload record
            const csvUpload = await prisma.csvUpload.create({
                data: {
                    filename: req.file.filename,
                    originalName: req.file.originalname,
                    fileSize: req.file.size,
                    filePath: req.file.path,
                    recordType,
                    status: 'pending'
                }
            });

            // Process upload asynchronously
            csvService.processUpload(csvUpload.id)
                .then(result => {
                    console.log(`CSV ${csvUpload.id} processed:`, result);
                })
                .catch(error => {
                    console.error(`CSV ${csvUpload.id} processing error:`, error);
                });

            res.json({
                success: true,
                upload: csvUpload,
                message: 'CSV uploaded successfully. Processing in background.'
            });

        } catch (error) {
            console.error('CSV upload error:', error);

            // Clean up file if it was uploaded
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }

            res.status(500).json({
                error: 'Upload failed',
                message: error.message
            });
        }
    }
);

/**
 * GET /api/csv/uploads
 * Get all CSV uploads with pagination and filtering
 */
router.get('/uploads', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const recordType = req.query.recordType;
        const status = req.query.status;

        let where = {};
        if (recordType) where.recordType = recordType;
        if (status) where.status = status;

        const [uploads, total] = await Promise.all([
            prisma.csvUpload.findMany({
                where,
                include: {
                    _count: {
                        select: { errors: true }
                    }
                },
                orderBy: { uploadedAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.csvUpload.count({ where })
        ]);

        res.json({
            success: true,
            uploads,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('CSV uploads fetch error:', error);
        res.status(500).json({
            error: 'Failed to fetch uploads',
            message: error.message
        });
    }
});

/**
 * GET /api/csv/uploads/:id
 * Get specific CSV upload details with errors
 */
router.get('/uploads/:id', async (req, res) => {
    try {
        const upload = await prisma.csvUpload.findUnique({
            where: { id: req.params.id },
            include: {
                errors: {
                    orderBy: { rowNumber: 'asc' },
                    take: 100 // Limit errors shown to first 100
                }
            }
        });

        if (!upload) {
            return res.status(404).json({
                error: 'CSV upload not found'
            });
        }

        res.json({
            success: true,
            upload
        });

    } catch (error) {
        console.error('CSV upload fetch error:', error);
        res.status(500).json({
            error: 'Failed to fetch upload details',
            message: error.message
        });
    }
});

/**
 * GET /api/csv/uploads/:id/preview
 * Preview CSV data (first 20 rows)
 */
router.get('/uploads/:id/preview', async (req, res) => {
    try {
        const upload = await prisma.csvUpload.findUnique({
            where: { id: req.params.id }
        });

        if (!upload) {
            return res.status(404).json({ error: 'CSV upload not found' });
        }

        if (!fs.existsSync(upload.filePath)) {
            return res.status(404).json({ error: 'File not found on server' });
        }

        // Read first 20 rows
        const rows = [];
        let rowCount = 0;

        const { parse } = await import('csv-parse');

        await new Promise((resolve, reject) => {
            fs.createReadStream(upload.filePath)
                .pipe(parse({ columns: true, skip_empty_lines: true }))
                .on('data', (row) => {
                    if (rowCount < 20) {
                        rows.push(row);
                        rowCount++;
                    }
                })
                .on('end', resolve)
                .on('error', reject);
        });

        res.json({
            success: true,
            preview: rows,
            totalPreviewRows: rows.length
        });

    } catch (error) {
        console.error('CSV preview error:', error);
        res.status(500).json({
            error: 'Failed to preview CSV',
            message: error.message
        });
    }
});

/**
 * GET /api/csv/uploads/:id/download
 * Download original CSV file
 */
router.get('/uploads/:id/download', async (req, res) => {
    try {
        const upload = await prisma.csvUpload.findUnique({
            where: { id: req.params.id }
        });

        if (!upload) {
            return res.status(404).json({ error: 'CSV upload not found' });
        }

        if (!fs.existsSync(upload.filePath)) {
            return res.status(404).json({ error: 'File not found on server' });
        }

        res.download(upload.filePath, upload.originalName);

    } catch (error) {
        console.error('CSV download error:', error);
        res.status(500).json({
            error: 'Failed to download file',
            message: error.message
        });
    }
});

/**
 * DELETE /api/csv/uploads/:id
 * Delete CSV upload and optionally its data
 */
router.delete('/uploads/:id', async (req, res) => {
    try {
        const upload = await prisma.csvUpload.findUnique({
            where: { id: req.params.id }
        });

        if (!upload) {
            return res.status(404).json({ error: 'CSV upload not found' });
        }

        // Delete file from disk
        if (fs.existsSync(upload.filePath)) {
            fs.unlinkSync(upload.filePath);
            console.log(`Deleted file: ${upload.filePath}`);
        }

        // Delete from database (cascades to errors)
        await prisma.csvUpload.delete({
            where: { id: req.params.id }
        });

        res.json({
            success: true,
            message: 'CSV upload deleted successfully'
        });

    } catch (error) {
        console.error('CSV delete error:', error);
        res.status(500).json({
            error: 'Failed to delete upload',
            message: error.message
        });
    }
});

/**
 * POST /api/csv/uploads/:id/reprocess
 * Reprocess a failed CSV upload
 */
router.post('/uploads/:id/reprocess', async (req, res) => {
    try {
        const upload = await prisma.csvUpload.findUnique({
            where: { id: req.params.id }
        });

        if (!upload) {
            return res.status(404).json({ error: 'CSV upload not found' });
        }

        if (upload.status === 'processing') {
            return res.status(400).json({
                error: 'Upload is already being processed'
            });
        }

        // Reset upload status
        await prisma.csvUpload.update({
            where: { id: req.params.id },
            data: {
                status: 'pending',
                totalRecords: 0,
                successCount: 0,
                errorCount: 0,
                processedAt: null
            }
        });

        // Delete existing errors
        await prisma.csvUploadError.deleteMany({
            where: { csvUploadId: req.params.id }
        });

        // Process upload
        csvService.processUpload(req.params.id)
            .then(result => {
                console.log(`CSV ${req.params.id} reprocessed:`, result);
            })
            .catch(error => {
                console.error(`CSV ${req.params.id} reprocessing error:`, error);
            });

        res.json({
            success: true,
            message: 'CSV reprocessing started'
        });

    } catch (error) {
        console.error('CSV reprocess error:', error);
        res.status(500).json({
            error: 'Failed to reprocess upload',
            message: error.message
        });
    }
});

/**
 * GET /api/csv/stats
 * Get CSV upload statistics
 */
router.get('/stats', async (req, res) => {
    try {
        const [
            totalUploads,
            recruiterUploads,
            studentUploads,
            completedUploads,
            failedUploads,
            totalRecordsProcessed
        ] = await Promise.all([
            prisma.csvUpload.count(),
            prisma.csvUpload.count({ where: { recordType: 'recruiter' } }),
            prisma.csvUpload.count({ where: { recordType: 'student' } }),
            prisma.csvUpload.count({ where: { status: 'completed' } }),
            prisma.csvUpload.count({ where: { status: 'failed' } }),
            prisma.csvUpload.aggregate({
                _sum: { successCount: true }
            })
        ]);

        res.json({
            success: true,
            stats: {
                totalUploads,
                recruiterUploads,
                studentUploads,
                completedUploads,
                failedUploads,
                totalRecordsProcessed: totalRecordsProcessed._sum.successCount || 0
            }
        });

    } catch (error) {
        console.error('CSV stats error:', error);
        res.status(500).json({
            error: 'Failed to fetch stats',
            message: error.message
        });
    }
});

export default router;
