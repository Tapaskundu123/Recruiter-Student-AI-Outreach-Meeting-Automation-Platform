import express from 'express';
import multer from 'multer';
import path from 'path';
import prisma from '../db/client.js';
import {
    processAndStoreDocument,
    searchContext,
    getDocuments,
    getDocument,
    deleteDocument
} from '../services/ragService.js';

const router = express.Router();

// Configure multer for PDF file uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext === '.pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'));
        }
    }
});

// TODO: Add authentication middleware to protect these routes

/**
 * POST /api/documents/upload
 * Upload a PDF document for context storage
 */
router.post('/upload', upload.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                error: 'No file uploaded',
                message: 'Please upload a PDF file'
            });
        }

        const { category, uploadedBy } = req.body;

        console.log(`📤 Uploading document: ${req.file.originalname}`);

        // Process and store document
        const result = await processAndStoreDocument(
            req.file.buffer,
            req.file.originalname,
            {
                category: category || undefined,
                uploadedBy: uploadedBy || undefined
            }
        );

        res.status(201).json({
            success: true,
            data: result,
            message: 'Document uploaded and processed successfully'
        });

    } catch (error) {
        console.error('Error uploading document:', error);
        res.status(500).json({
            error: 'Failed to upload document',
            message: error.message
        });
    }
});

/**
 * GET /api/documents
 * Get all uploaded documents
 */
router.get('/', async (req, res) => {
    try {
        const { category, status } = req.query;

        const documents = await getDocuments({
            category: category || undefined,
            status: status || undefined
        });

        res.json({
            success: true,
            data: documents,
            count: documents.length
        });

    } catch (error) {
        console.error('Error fetching documents:', error);
        res.status(500).json({
            error: 'Failed to fetch documents',
            message: error.message
        });
    }
});

/**
 * GET /api/documents/:id
 * Get a single document by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const document = await getDocument(id);

        if (!document) {
            return res.status(404).json({
                error: 'Document not found'
            });
        }

        res.json({
            success: true,
            data: document
        });

    } catch (error) {
        console.error('Error fetching document:', error);
        res.status(500).json({
            error: 'Failed to fetch document',
            message: error.message
        });
    }
});

/**
 * DELETE /api/documents/:id
 * Delete a document and its vectors
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await deleteDocument(id);

        res.json({
            success: true,
            message: 'Document deleted successfully',
            data: result
        });

    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({
                error: 'Document not found'
            });
        }

        console.error('Error deleting document:', error);
        res.status(500).json({
            error: 'Failed to delete document',
            message: error.message
        });
    }
});

/**
 * POST /api/documents/search
 * Search for relevant context
 */
router.post('/search', async (req, res) => {
    try {
        const { query, topK, category, minScore } = req.body;

        if (!query) {
            return res.status(400).json({
                error: 'Query is required'
            });
        }

        const results = await searchContext(query, {
            topK: topK || 5,
            category: category || null,
            minScore: minScore || 0.7
        });

        res.json({
            success: true,
            data: results,
            count: results.length
        });

    } catch (error) {
        console.error('Error searching documents:', error);
        res.status(500).json({
            error: 'Failed to search documents',
            message: error.message
        });
    }
});

/**
 * GET /api/documents/stats/overview
 * Get overview statistics
 */
router.get('/stats/overview', async (req, res) => {
    try {
        const documents = await getDocuments();

        const stats = {
            totalDocuments: documents.length,
            byCategory: {},
            byStatus: {},
            totalChunks: documents.reduce((sum, doc) => sum + doc.chunkCount, 0)
        };

        // Count by category
        documents.forEach(doc => {
            stats.byCategory[doc.category] = (stats.byCategory[doc.category] || 0) + 1;
            stats.byStatus[doc.status] = (stats.byStatus[doc.status] || 0) + 1;
        });

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('Error fetching document stats:', error);
        res.status(500).json({
            error: 'Failed to fetch document statistics',
            message: error.message
        });
    }
});

export default router;
