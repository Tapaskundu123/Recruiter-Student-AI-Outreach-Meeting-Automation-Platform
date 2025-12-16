import express from 'express';
import { body, query, validationResult } from 'express-validator';
import prisma from '../db/client.js';
import { scheduleMeeting } from '../calendar/scheduler.js';

const router = express.Router();

/**
 * POST /api/events/schedule
 * Automatic meeting scheduling with participant email
 */
router.post('/schedule',
    [
        body('recruiterId').isUUID().withMessage('Valid recruiter ID required'),
        body('participantEmail').isEmail().withMessage('Valid participant email required'),
        body('agenda').optional().trim(),
        body('scheduledTime').isISO8601().withMessage('Valid date/time required'),
        body('duration').isInt({ min: 15, max: 240 }).withMessage('Duration must be between 15 and 240 minutes')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const {
                recruiterId,
                participantEmail,
                agenda,
                scheduledTime,
                duration
            } = req.body;

            // Fetch recruiter details
            const recruiter = await prisma.recruiter.findUnique({
                where: { id: recruiterId }
            });

            if (!recruiter) {
                return res.status(404).json({ error: 'Recruiter not found' });
            }

            if (!recruiter.googleRefreshToken) {
                return res.status(400).json({
                    error: 'Google Calendar not connected',
                    code: 'CALENDAR_NOT_CONNECTED'
                });
            }

            // Try to find student by email, create if doesn't exist
            let student = await prisma.student.findUnique({
                where: { email: participantEmail }
            });

            if (!student) {
                // Extract name from email (before @)
                const emailName = participantEmail.split('@')[0];
                const displayName = emailName.charAt(0).toUpperCase() + emailName.slice(1);

                student = await prisma.student.create({
                    data: {
                        email: participantEmail,
                        name: displayName,
                        status: 'contacted'
                    }
                });
            }

            const title = 'Meeting Discussion';
            const description = agenda || 'Meeting scheduled via AI Outreach Platform';

            // Schedule the meeting
            const meeting = await scheduleMeeting({
                recruiterId,
                studentId: student.id,
                recruiterEmail: recruiter.email,
                studentEmail: student.email,
                recruiterName: recruiter.name,
                studentName: student.name,
                scheduledTime,
                duration,
                title,
                description,
                eventField: null,
                keyAreas: []
            });

            res.json({
                success: true,
                meeting: {
                    id: meeting.id,
                    title: meeting.title,
                    scheduledTime: meeting.scheduledTime,
                    duration: meeting.duration,
                    googleMeetLink: meeting.googleMeetLink,
                    participant: {
                        name: student.name,
                        email: student.email
                    }
                }
            });

        } catch (error) {
            console.error('Meeting scheduling error:', error);
            res.status(500).json({
                error: 'Failed to schedule meeting',
                message: error.message
            });
        }
    }
);

/**
 * POST /api/events/create
 * Create a new event with Google Calendar integration
 */
router.post('/create',
    [
        body('recruiterId').isUUID().withMessage('Valid recruiter ID required'),
        body('studentId').isUUID().withMessage('Valid student ID required'),
        body('eventName').trim().notEmpty().withMessage('Event name is required'),
        body('eventField').optional().trim(),
        body('keyAreas').optional().isArray().withMessage('Key areas must be an array'),
        body('scheduledTime').isISO8601().withMessage('Valid date/time required'),
        body('duration').isInt({ min: 15, max: 240 }).withMessage('Duration must be between 15 and 240 minutes')
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
                eventName,
                eventField,
                keyAreas,
                scheduledTime,
                duration
            } = req.body;

            // Fetch recruiter and student details
            const recruiter = await prisma.recruiter.findUnique({
                where: { id: recruiterId }
            });

            const student = await prisma.student.findUnique({
                where: { id: studentId }
            });

            if (!recruiter) {
                return res.status(404).json({ error: 'Recruiter not found' });
            }

            if (!student) {
                return res.status(404).json({ error: 'Student not found' });
            }

            if (!recruiter.googleRefreshToken) {
                return res.status(400).json({
                    error: 'Google Calendar not connected',
                    code: 'CALENDAR_NOT_CONNECTED'
                });
            }

            // Build description with event details
            let description = `Meeting between ${recruiter.name} and ${student.name}`;
            if (eventField) {
                description += `\n\nField: ${eventField}`;
            }
            if (keyAreas && keyAreas.length > 0) {
                description += `\n\nKey Areas:\n${keyAreas.map(area => `• ${area}`).join('\n')}`;
            }

            // Schedule the meeting using existing scheduler
            const meeting = await scheduleMeeting({
                recruiterId,
                studentId,
                recruiterEmail: recruiter.email,
                studentEmail: student.email,
                recruiterName: recruiter.name,
                studentName: student.name,
                scheduledTime,
                duration,
                title: eventName,
                description,
                eventField,
                keyAreas: keyAreas || []
            });

            res.json({
                success: true,
                meeting: {
                    id: meeting.id,
                    title: meeting.title,
                    scheduledTime: meeting.scheduledTime,
                    duration: meeting.duration,
                    googleMeetLink: meeting.googleMeetLink,
                    student: {
                        name: student.name,
                        email: student.email
                    }
                }
            });

        } catch (error) {
            console.error('Event creation error:', error);
            res.status(500).json({
                error: 'Failed to create event',
                message: error.message
            });
        }
    }
);

/**
 * GET /api/events/students/search
 * Search students by name or email
 */
router.get('/students/search',
    [
        query('q').trim().notEmpty().withMessage('Search query required')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { q } = req.query;
            const searchTerm = q.toLowerCase();

            // Search students by name or email
            const students = await prisma.student.findMany({
                where: {
                    OR: [
                        { name: { contains: searchTerm, mode: 'insensitive' } },
                        { email: { contains: searchTerm, mode: 'insensitive' } }
                    ],
                    status: {
                        notIn: ['rejected', 'blocked']
                    }
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    university: true,
                    major: true,
                    graduationYear: true
                },
                take: 10,
                orderBy: {
                    name: 'asc'
                }
            });

            res.json({
                success: true,
                students
            });

        } catch (error) {
            console.error('Student search error:', error);
            res.status(500).json({
                error: 'Failed to search students',
                message: error.message
            });
        }
    }
);

/**
 * GET /api/events/list
 * Get all events for a recruiter
 */
router.get('/list',
    [
        query('recruiterId').isUUID().withMessage('Valid recruiter ID required')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { recruiterId } = req.query;

            const events = await prisma.meeting.findMany({
                where: {
                    recruiterId,
                    scheduledTime: {
                        gte: new Date() // Only future events
                    }
                },
                include: {
                    student: {
                        select: {
                            name: true,
                            email: true,
                            university: true
                        }
                    }
                },
                orderBy: {
                    scheduledTime: 'asc'
                }
            });

            res.json({
                success: true,
                events
            });

        } catch (error) {
            console.error('Event list error:', error);
            res.status(500).json({
                error: 'Failed to fetch events',
                message: error.message
            });
        }
    }
);

export default router;
