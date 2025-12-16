import express from 'express';
import { body, query, validationResult } from 'express-validator';
import prisma from '../db/client.js';

const router = express.Router();

// TODO: Add authentication middleware for admin routes

/**
 * GET /api/admin/recruiters
 * Get all recruiters with pagination and filtering
 */
router.get('/recruiters', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;
        const search = req.query.search;
        const country = req.query.country;
        const field = req.query.field;
        const platform = req.query.platform;

        let where = {};

        // Build where clause
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { company: { contains: search, mode: 'insensitive' } }
            ];
        }

        if (country) where.country = country;
        if (field) where.field = field;
        if (platform) where.platform = platform;

        const [recruiters, total] = await Promise.all([
            prisma.recruiter.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.recruiter.count({ where })
        ]);

        res.json({
            data: recruiters,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Recruiters fetch error:', error);
        res.status(500).json({
            error: 'Server error',
            message: 'Failed to fetch recruiters'
        });
    }
});

/**
 * GET /api/admin/students
 * Get all students with pagination and filtering
 */
router.get('/students', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;
        const search = req.query.search;
        const country = req.query.country;
        const major = req.query.major;
        const platform = req.query.platform;

        let where = {};

        // Build where clause
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { university: { contains: search, mode: 'insensitive' } }
            ];
        }

        if (country) where.country = country;
        if (major) where.major = major;
        if (platform) where.platform = platform;

        const [students, total] = await Promise.all([
            prisma.student.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.student.count({ where })
        ]);

        res.json({
            data: students,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Students fetch error:', error);
        res.status(500).json({
            error: 'Server error',
            message: 'Failed to fetch students'
        });
    }
});

/**
 * GET /api/admin/stats
 * Get statistics for dashboard
 */
router.get('/stats', async (req, res) => {
    try {
        const [
            totalRecruiters,
            totalStudents,
            recruitersByCountry,
            studentsByCountry,
            recruitersByField,
            recruitersByPlatform
        ] = await Promise.all([
            prisma.recruiter.count(),
            prisma.student.count(),
            prisma.recruiter.groupBy({
                by: ['country'],
                _count: true
            }),
            prisma.student.groupBy({
                by: ['country'],
                _count: true
            }),
            prisma.recruiter.groupBy({
                by: ['field'],
                _count: true
            }),
            prisma.recruiter.groupBy({
                by: ['platform'],
                _count: true
            })
        ]);

        res.json({
            totalRecruiters,
            totalStudents,
            recruitersByCountry,
            studentsByCountry,
            recruitersByField,
            recruitersByPlatform
        });
    } catch (error) {
        console.error('Stats fetch error:', error);
        res.status(500).json({
            error: 'Server error',
            message: 'Failed to fetch stats'
        });
    }
});

/**
 * POST /api/admin/export/recruiters
 * Export recruiters to CSV/JSON
 */
router.post('/export/recruiters', async (req, res) => {
    try {
        const format = req.body.format || 'json';
        const recruiters = await prisma.recruiter.findMany({
            orderBy: { createdAt: 'desc' }
        });

        if (format === 'json') {
            res.json({ data: recruiters, count: recruiters.length });
        } else {
            // CSV export
            res.json({ message: 'CSV export coming soon', data: recruiters });
        }
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({
            error: 'Server error',
            message: 'Failed to export recruiters'
        });
    }
});

/**
 * POST /api/admin/export/students
 * Export students to CSV/JSON
 */
router.post('/export/students', async (req, res) => {
    try {
        const format = req.body.format || 'json';
        const students = await prisma.student.findMany({
            orderBy: { createdAt: 'desc' }
        });

        if (format === 'json') {
            res.json({ data: students, count: students.length });
        } else {
            // CSV export
            res.json({ message: 'CSV export coming soon', data: students });
        }
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({
            error: 'Server error',
            message: 'Failed to export students'
        });
    }
});

/**
 * DELETE /api/admin/recruiters/:id
 * Delete a recruiter
 */
router.delete('/recruiters/:id', async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.recruiter.delete({
            where: { id }
        });

        res.json({
            success: true,
            message: 'Recruiter deleted successfully'
        });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({
                error: 'Not found',
                message: 'Recruiter not found'
            });
        }
        console.error('Delete error:', error);
        res.status(500).json({
            error: 'Server error',
            message: 'Failed to delete recruiter'
        });
    }
});

/**
 * DELETE /api/admin/students/:id
 * Delete a student
 */
router.delete('/students/:id', async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.student.delete({
            where: { id }
        });

        res.json({
            success: true,
            message: 'Student deleted successfully'
        });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({
                error: 'Not found',
                message: 'Student not found'
            });
        }
        console.error('Delete error:', error);
        res.status(500).json({
            error: 'Server error',
            message: 'Failed to delete student'
        });
    }
});

/**
 * GET /api/admin/pending-slots
 * Get all pending availability slots
 */
router.get('/pending-slots', async (req, res) => {
    try {
        const pendingSlots = await prisma.availabilitySlot.findMany({
            where: {
                status: 'pending',
                startTime: {
                    gte: new Date() // Only future slots
                }
            },
            include: {
                recruiter: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        company: true
                    }
                }
            },
            orderBy: {
                startTime: 'asc'
            }
        });

        res.json({
            success: true,
            slots: pendingSlots
        });

    } catch (error) {
        console.error('Error fetching pending slots:', error);
        res.status(500).json({
            error: 'Failed to fetch pending slots',
            message: error.message
        });
    }
});

/**
 * GET /api/admin/waitlisted-students
 * Get all students on waitlist
 */
router.get('/waitlisted-students', async (req, res) => {
    try {
        const waitlistedStudents = await prisma.student.findMany({
            where: {
                status: 'waitlisted'
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json({
            success: true,
            students: waitlistedStudents
        });

    } catch (error) {
        console.error('Error fetching waitlisted students:', error);
        res.status(500).json({
            error: 'Failed to fetch waitlisted students',
            message: error.message
        });
    }
});

/**
 * POST /api/admin/confirm-meeting
 * Admin confirms a meeting by assigning a student to an availability slot
 */
router.post('/confirm-meeting',
    [
        body('availabilitySlotId').isUUID().withMessage('Valid availability slot ID required'),
        body('studentId').isUUID().withMessage('Valid student ID required'),
        body('agenda').optional().trim()
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const {
                availabilitySlotId,
                studentId,
                agenda
            } = req.body;

            // Import scheduler
            const { scheduleMeeting } = await import('../calendar/scheduler.js');

            // Fetch availability slot with recruiter details
            const availabilitySlot = await prisma.availabilitySlot.findUnique({
                where: { id: availabilitySlotId },
                include: {
                    recruiter: true
                }
            });

            if (!availabilitySlot) {
                return res.status(404).json({ error: 'Availability slot not found' });
            }

            if (availabilitySlot.status !== 'pending') {
                return res.status(400).json({
                    error: 'Availability slot is not pending',
                    status: availabilitySlot.status
                });
            }

            // Fetch student details
            const student = await prisma.student.findUnique({
                where: { id: studentId }
            });

            if (!student) {
                return res.status(404).json({ error: 'Student not found' });
            }

            const recruiter = availabilitySlot.recruiter;

            if (!recruiter.googleRefreshToken) {
                return res.status(400).json({
                    error: 'Recruiter has not connected Google Calendar',
                    code: 'CALENDAR_NOT_CONNECTED'
                });
            }

            // Create meeting title and description
            const title = 'Meeting Discussion';
            const description = agenda || `Meeting between ${recruiter.name} and ${student.name}`;

            // Schedule the meeting
            const meeting = await scheduleMeeting({
                recruiterId: recruiter.id,
                studentId: student.id,
                recruiterEmail: recruiter.email,
                studentEmail: student.email,
                recruiterName: recruiter.name,
                studentName: student.name,
                scheduledTime: availabilitySlot.startTime,
                duration: availabilitySlot.duration,
                title,
                description,
                eventField: null,
                keyAreas: []
            });

            // Update availability slot to confirmed
            await prisma.availabilitySlot.update({
                where: { id: availabilitySlotId },
                data: {
                    status: 'confirmed',
                    meetingId: meeting.id,
                    confirmedBy: 'admin' // TODO: Use actual admin ID
                }
            });

            res.json({
                success: true,
                meeting: {
                    id: meeting.id,
                    title: meeting.title,
                    scheduledTime: meeting.scheduledTime,
                    duration: meeting.duration,
                    googleMeetLink: meeting.googleMeetLink,
                    recruiter: {
                        name: recruiter.name,
                        email: recruiter.email
                    },
                    student: {
                        name: student.name,
                        email: student.email
                    },
                    availabilitySlot: {
                        id: availabilitySlot.id,
                        status: 'confirmed'
                    }
                }
            });

        } catch (error) {
            console.error('Meeting confirmation error:', error);
            res.status(500).json({
                error: 'Failed to confirm meeting',
                message: error.message
            });
        }
    }
);

export default router;
