import express from 'express';
import { body, query, validationResult } from 'express-validator';
import prisma from '../db/client.js';
import { addScrapingJob } from '../jobs/scrapingJobs.js';

const router = express.Router();

/**
 * POST /api/scrapers/bulk
 * Start bulk scraping job with multiple platforms
 */
router.post(
    '/bulk',
    [
        body('countries').isArray().withMessage('Countries must be an array'),
        body('fields').optional().isArray(),
        body('platforms').optional().isArray(),
        body('targetCount').optional().isInt({ min: 1 })
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { countries, fields = [], platforms = ['all'], targetCount = 500 } = req.body;

            // Create scraping logs for both recruiter and student
            const recruiterLog = await prisma.scrapingLog.create({
                data: {
                    jobType: 'recruiter',
                    target: platforms.join(', '),
                    status: 'running'
                }
            });

            const studentLog = await prisma.scrapingLog.create({
                data: {
                    jobType: 'student',
                    target: platforms.join(', '),
                    status: 'running'
                }
            });

            // Add jobs to queue
            const recruiterJob = await addScrapingJob({
                type: 'recruiter',
                logId: recruiterLog.id,
                target: 'all',
                countries,
                fields
            });

            const studentJob = await addScrapingJob({
                type: 'student',
                logId: studentLog.id,
                target: 'all',
                countries,
                fields
            });

            res.status(202).json({
                success: true,
                message: 'Bulk scraping jobs started',
                jobs: [
                    { type: 'recruiter', jobId: recruiterJob.id, logId: recruiterLog.id },
                    { type: 'student', jobId: studentJob.id, logId: studentLog.id }
                ]
            });
        } catch (error) {
            console.error('Bulk scraper start error:', error);
            res.status(500).json({
                error: 'Server error',
                message: 'Failed to start bulk scraping jobs'
            });
        }
    }
);

/**
 * POST /api/scrapers/recruiters
 * Start recruiter scraping job
 */
router.post(
    '/recruiters',
    [
        body('target').optional().isString(),
        body('countries').optional().isArray(),
        body('fields').optional().isArray()
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { target = 'all', countries = ['USA', 'Canada', 'Australia'], fields = [] } = req.body;

            // Create scraping log
            const log = await prisma.scrapingLog.create({
                data: {
                    jobType: 'recruiter',
                    target,
                    status: 'running'
                }
            });

            // Add job to queue
            const job = await addScrapingJob({
                type: 'recruiter',
                logId: log.id,
                target,
                countries,
                fields
            });

            res.status(202).json({
                success: true,
                message: 'Scraping job started',
                jobId: job.id,
                logId: log.id
            });
        } catch (error) {
            console.error('Scraper start error:', error);
            res.status(500).json({
                error: 'Server error',
                message: 'Failed to start scraping job'
            });
        }
    }
);

/**
 * POST /api/scrapers/students
 * Start student scraping job
 */
router.post(
    '/students',
    [
        body('target').optional().isString(),
        body('countries').optional().isArray(),
        body('fields').optional().isArray()
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { target = 'all', countries = ['USA', 'Canada', 'Australia'], fields = [] } = req.body;

            // Create scraping log
            const log = await prisma.scrapingLog.create({
                data: {
                    jobType: 'student',
                    target,
                    status: 'running'
                }
            });

            // Add job to queue
            const job = await addScrapingJob({
                type: 'student',
                logId: log.id,
                target,
                countries,
                fields
            });

            res.status(202).json({
                success: true,
                message: 'Scraping job started',
                jobId: job.id,
                logId: log.id
            });
        } catch (error) {
            console.error('Scraper start error:', error);
            res.status(500).json({
                error: 'Server error',
                message: 'Failed to start scraping job'
            });
        }
    }
);

/**
 * GET /api/scrapers/status/:logId
 * Get scraping job status
 */
router.get('/status/:logId', async (req, res) => {
    try {
        const { logId } = req.params;

        const log = await prisma.scrapingLog.findUnique({
            where: { id: logId }
        });

        if (!log) {
            return res.status(404).json({
                error: 'Not found',
                message: 'Scraping log not found'
            });
        }

        res.json({
            id: log.id,
            jobType: log.jobType,
            target: log.target,
            status: log.status,
            recordsFound: log.recordsFound,
            recordsSaved: log.recordsSaved,
            errors: log.errors,
            startedAt: log.startedAt,
            completedAt: log.completedAt
        });
    } catch (error) {
        console.error('Status fetch error:', error);
        res.status(500).json({
            error: 'Server error',
            message: 'Failed to fetch job status'
        });
    }
});

/**
 * GET /api/scrapers/logs
 * Get all scraping logs with pagination
 */
router.get(
    '/logs',
    [
        query('page').optional().isInt({ min: 1 }),
        query('limit').optional().isInt({ min: 1, max: 100 }),
        query('jobType').optional().isIn(['recruiter', 'student'])
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const skip = (page - 1) * limit;
            const jobType = req.query.jobType;

            const where = jobType ? { jobType } : {};

            const [logs, total] = await Promise.all([
                prisma.scrapingLog.findMany({
                    where,
                    orderBy: { startedAt: 'desc' },
                    skip,
                    take: limit
                }),
                prisma.scrapingLog.count({ where })
            ]);

            res.json({
                data: logs,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            console.error('Logs fetch error:', error);
            res.status(500).json({
                error: 'Server error',
                message: 'Failed to fetch logs'
            });
        }
    }
);

/**
 * GET /api/scrapers/stats
 * Get scraping statistics
 */
router.get('/stats', async (req, res) => {
    try {
        const [totalRecruiters, totalStudents, recentLogs, platformStats] = await Promise.all([
            prisma.recruiter.count(),
            prisma.student.count(),
            prisma.scrapingLog.findMany({
                where: { status: 'completed' },
                orderBy: { completedAt: 'desc' },
                take: 5
            }),
            // Get records by platform
            prisma.recruiter.groupBy({
                by: ['platform'],
                _count: true
            })
        ]);

        res.json({
            totalRecruiters,
            totalStudents,
            recentLogs,
            platformBreakdown: platformStats
        });
    } catch (error) {
        console.error('Stats fetch error:', error);
        res.status(500).json({
            error: 'Server error',
            message: 'Failed to fetch scraping stats'
        });
    }
});

export default router;
