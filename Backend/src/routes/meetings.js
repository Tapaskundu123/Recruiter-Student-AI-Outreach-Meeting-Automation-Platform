import express from 'express';
import { body, query, validationResult } from 'express-validator';
import prisma from '../db/client.js';
import { scheduleMeeting } from '../calendar/scheduler.js';

const router = express.Router();

/**
 * POST /api/meetings
 * Create and schedule a new meeting
 */
router.post(
    '/',
    [
        body('recruiterId').isUUID().withMessage('Valid recruiter ID is required'),
        body('studentId').isUUID().withMessage('Valid student ID is required'),
        body('scheduledTime').isISO8601().withMessage('Valid schedule time is required'),
        body('duration').optional().isInt({ min: 15, max: 180 }),
        body('title').optional().trim(),
        body('description').optional().trim()
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const {
                recruiterId,
                studentId,
                scheduledTime,
                duration,
                title,
                description
            } = req.body;

            // Verify recruiter and student exist
            const [recruiter, student] = await Promise.all([
                prisma.recruiter.findUnique({ where: { id: recruiterId } }),
                prisma.student.findUnique({ where: { id: studentId } })
            ]);

            if (!recruiter || !student) {
                return res.status(404).json({
                    error: 'Not found',
                    message: 'Recruiter or student not found'
                });
            }

            // Schedule meeting (creates calendar event and database entry)
            const meeting = await scheduleMeeting({
                recruiterId,
                studentId,
                recruiterEmail: recruiter.email,
                studentEmail: student.email,
                recruiterName: recruiter.name,
                studentName: student.name,
                scheduledTime: new Date(scheduledTime),
                duration: duration || 30,
                title: title || `Meeting: ${recruiter.name} & ${student.name}`,
                description
            });

            res.status(201).json({
                success: true,
                message: 'Meeting scheduled successfully',
                data: meeting
            });
        } catch (error) {
            console.error('Meeting creation error:', error);
            res.status(500).json({
                error: 'Server error',
                message: 'Failed to schedule meeting'
            });
        }
    }
);

/**
 * GET /api/meetings
 * List all meetings with pagination and filters
 */
router.get(
    '/',
    [
        query('page').optional().isInt({ min: 1 }),
        query('limit').optional().isInt({ min: 1, max: 100 }),
        query('status').optional().isIn(['scheduled', 'confirmed', 'completed', 'cancelled', 'no-show']),
        query('recruiterId').optional().isUUID(),
        query('studentId').optional().isUUID()
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

            const where = {};
            if (req.query.status) where.status = req.query.status;
            if (req.query.recruiterId) where.recruiterId = req.query.recruiterId;
            if (req.query.studentId) where.studentId = req.query.studentId;

            const [meetings, total] = await Promise.all([
                prisma.meeting.findMany({
                    where,
                    orderBy: { scheduledTime: 'desc' },
                    skip,
                    take: limit,
                    include: {
                        recruiter: {
                            select: { id: true, name: true, email: true, company: true }
                        },
                        student: {
                            select: { id: true, name: true, email: true, university: true }
                        }
                    }
                }),
                prisma.meeting.count({ where })
            ]);

            res.json({
                data: meetings,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            console.error('Meetings fetch error:', error);
            res.status(500).json({
                error: 'Server error',
                message: 'Failed to fetch meetings'
            });
        }
    }
);

/**
 * GET /api/meetings/:id
 * Get meeting details
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const meeting = await prisma.meeting.findUnique({
            where: { id },
            include: {
                recruiter: true,
                student: true
            }
        });

        if (!meeting) {
            return res.status(404).json({
                error: 'Not found',
                message: 'Meeting not found'
            });
        }

        res.json(meeting);
    } catch (error) {
        console.error('Meeting fetch error:', error);
        res.status(500).json({
            error: 'Server error',
            message: 'Failed to fetch meeting'
        });
    }
});

/**
 * PATCH /api/meetings/:id
 * Update meeting status
 */
router.patch(
    '/:id',
    [
        body('status')
            .optional()
            .isIn(['scheduled', 'confirmed', 'completed', 'cancelled', 'no-show'])
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { id } = req.params;
            const { status } = req.body;

            const meeting = await prisma.meeting.update({
                where: { id },
                data: { status }
            });

            res.json({
                success: true,
                message: 'Meeting updated successfully',
                data: meeting
            });
        } catch (error) {
            if (error.code === 'P2025') {
                return res.status(404).json({
                    error: 'Not found',
                    message: 'Meeting not found'
                });
            }
            console.error('Meeting update error:', error);
            res.status(500).json({
                error: 'Server error',
                message: 'Failed to update meeting'
            });
        }
    }
);

/**
 * DELETE /api/meetings/:id
 * Cancel and delete meeting
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // TODO: Also delete from Google Calendar
        await prisma.meeting.delete({
            where: { id }
        });

        res.json({
            success: true,
            message: 'Meeting cancelled successfully'
        });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({
                error: 'Not found',
                message: 'Meeting not found'
            });
        }
        console.error('Meeting delete error:', error);
        res.status(500).json({
            error: 'Server error',
            message: 'Failed to cancel meeting'
        });
    }
});

export default router;
