import express from 'express';
import { param, body, validationResult } from 'express-validator';
import prisma from '../db/client.js';

const router = express.Router();

/**
 * GET /api/dashboard/meetings/:recruiterId
 * Get all scheduled meetings for a recruiter
 */
router.get('/meetings/:recruiterId',
    [param('recruiterId').isUUID().withMessage('Valid recruiter ID required')],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { recruiterId } = req.params;
            const { status, upcoming } = req.query;

            // Build query filters
            const where = { recruiterId };

            if (status) {
                where.status = status;
            }

            // Filter for upcoming meetings only
            if (upcoming === 'true') {
                where.scheduledTime = {
                    gte: new Date()
                };
            }

            const meetings = await prisma.meeting.findMany({
                where,
                include: {
                    student: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            university: true,
                            major: true,
                            graduationYear: true,
                            linkedIn: true,
                        }
                    },
                    recruiter: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            company: true,
                            jobTitle: true
                        }
                    }
                },
                orderBy: {
                    scheduledTime: 'asc'
                }
            });

            res.json({
                success: true,
                count: meetings.length,
                meetings
            });

        } catch (error) {
            console.error('Fetch meetings error:', error);
            res.status(500).json({ error: 'Failed to fetch meetings' });
        }
    }
);

/**
 * GET /api/dashboard/stats/:recruiterId
 * Get overview statistics for a recruiter's meetings
 */
router.get('/stats/:recruiterId',
    [param('recruiterId').isUUID().withMessage('Valid recruiter ID required')],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { recruiterId } = req.params;
            const now = new Date();

            // Get counts for different meeting statuses
            const [
                totalMeetings,
                upcomingMeetings,
                completedMeetings,
                cancelledMeetings,
                todaysMeetings
            ] = await Promise.all([
                prisma.meeting.count({
                    where: { recruiterId }
                }),
                prisma.meeting.count({
                    where: {
                        recruiterId,
                        scheduledTime: { gte: now },
                        status: { in: ['scheduled', 'confirmed'] }
                    }
                }),
                prisma.meeting.count({
                    where: {
                        recruiterId,
                        status: 'completed'
                    }
                }),
                prisma.meeting.count({
                    where: {
                        recruiterId,
                        status: 'cancelled'
                    }
                }),
                prisma.meeting.count({
                    where: {
                        recruiterId,
                        scheduledTime: {
                            gte: new Date(now.setHours(0, 0, 0, 0)),
                            lt: new Date(now.setHours(23, 59, 59, 999))
                        }
                    }
                })
            ]);

            // Get next meeting
            const nextMeeting = await prisma.meeting.findFirst({
                where: {
                    recruiterId,
                    scheduledTime: { gte: new Date() },
                    status: { in: ['scheduled', 'confirmed'] }
                },
                include: {
                    student: {
                        select: {
                            name: true,
                            email: true
                        }
                    }
                },
                orderBy: {
                    scheduledTime: 'asc'
                }
            });

            res.json({
                success: true,
                stats: {
                    totalMeetings,
                    upcomingMeetings,
                    completedMeetings,
                    cancelledMeetings,
                    todaysMeetings,
                    nextMeeting
                }
            });

        } catch (error) {
            console.error('Fetch stats error:', error);
            res.status(500).json({ error: 'Failed to fetch statistics' });
        }
    }
);

/**
 * PATCH /api/dashboard/meetings/:id
 * Update meeting status
 */
router.patch('/meetings/:id',
    [
        param('id').isUUID().withMessage('Valid meeting ID required'),
        body('status').isIn(['scheduled', 'confirmed', 'completed', 'cancelled', 'no-show'])
            .withMessage('Valid status required')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { id } = req.params;
            const { status } = req.body;

            // Check if meeting exists
            const meeting = await prisma.meeting.findUnique({
                where: { id }
            });

            if (!meeting) {
                return res.status(404).json({ error: 'Meeting not found' });
            }

            // Update meeting status
            const updatedMeeting = await prisma.meeting.update({
                where: { id },
                data: { status },
                include: {
                    student: {
                        select: {
                            name: true,
                            email: true
                        }
                    }
                }
            });

            res.json({
                success: true,
                message: 'Meeting status updated successfully',
                meeting: updatedMeeting
            });

        } catch (error) {
            console.error('Update meeting error:', error);
            res.status(500).json({ error: 'Failed to update meeting' });
        }
    }
);

export default router;
