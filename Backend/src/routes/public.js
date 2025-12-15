import express from 'express';
import { body, query, validationResult } from 'express-validator';
import prisma from '../db/client.js';
import { getFreeBusy, createCalendarEvent } from '../calendar/googleCalendar.js';
import { sendMeetingConfirmation } from '../email/emailClient.js';

const router = express.Router();

/**
 * GET /api/public/recruiters/:id
 * Get public recruiter profile for booking
 */
router.get('/recruiters/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const recruiter = await prisma.recruiter.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                company: true,
                jobTitle: true,
                country: true,
                field: true,
                // Do NOT expose email or tokens
            }
        });

        if (!recruiter) {
            return res.status(404).json({ error: 'Recruiter not found' });
        }

        res.json(recruiter);
    } catch (error) {
        console.error('Public profile fetch error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * GET /api/public/availability
 * Get available slots for a recruiter
 */
router.get(
    '/availability',
    [
        query('recruiterId').isUUID().withMessage('Recruiter ID required'),
        query('date').isISO8601().withMessage('Valid date required'),
        query('timezone').optional().isString()
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { recruiterId, date, timezone = 'UTC' } = req.query;

            // Fetch recruiter to get refresh token
            const recruiter = await prisma.recruiter.findUnique({
                where: { id: recruiterId }
            });

            if (!recruiter || !recruiter.googleRefreshToken) {
                return res.status(404).json({
                    error: 'Recruiter calendar not connected',
                    message: 'This recruiter has not connected their calendar yet.'
                });
            }

            // Define time range (9 AM to 5 PM in recruiter's timezone effectively)
            // For simplicity, we check full day in UTC and filter logic later or rely on free/busy
            const startOfDay = new Date(date);
            startOfDay.setUTCHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setUTCHours(23, 59, 59, 999);

            const result = await getFreeBusy({
                refreshToken: recruiter.googleRefreshToken,
                timeMin: startOfDay,
                timeMax: endOfDay,
                emails: [recruiter.email] // Check recruiter's calendar
            });

            if (!result.success) {
                throw new Error(result.error);
            }

            // Basic logic: Generate 30-min slots and filter out busy ones
            const busySlots = result.calendars[recruiter.email]?.busy || [];

            // Generate all potential slots (e.g., 9 AM - 5 PM UTC)
            // TODO: Use recruiter's timezone preference
            const slots = [];
            let currentSlot = new Date(startOfDay);
            currentSlot.setUTCHours(9, 0, 0, 0); // Start at 9 AM

            const workEnd = new Date(startOfDay);
            workEnd.setUTCHours(17, 0, 0, 0); // End at 5 PM

            while (currentSlot < workEnd) {
                const slotEnd = new Date(currentSlot.getTime() + 30 * 60000); // 30 min duration

                // Check overlap with busy slots
                const isBusy = busySlots.some(busy => {
                    const busyStart = new Date(busy.start);
                    const busyEnd = new Date(busy.end);
                    return (currentSlot < busyEnd && slotEnd > busyStart);
                });

                if (!isBusy) {
                    slots.push(new Date(currentSlot));
                }

                currentSlot = slotEnd;
            }

            res.json({ slots });
        } catch (error) {
            console.error('Availability check error:', error);
            res.status(500).json({ error: 'Failed to fetch availability' });
        }
    }
);

/**
 * POST /api/public/book
 * Book a meeting
 *
 */
router.post(
    '/book',
    [
        body('recruiterId').isUUID(),
        body('studentId').isUUID(), // Student ID (should come from logged-in student or param)
        body('startTime').isISO8601(),
        body('title').optional().isString()
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { recruiterId, studentId, startTime, title } = req.body;
            const startDateTime = new Date(startTime);
            const endDateTime = new Date(startDateTime.getTime() + 30 * 60000); // 30 mins

            // Fetch participants
            const [recruiter, student] = await Promise.all([
                prisma.recruiter.findUnique({ where: { id: recruiterId } }),
                prisma.student.findUnique({ where: { id: studentId } })
            ]);

            if (!recruiter || !student) {
                return res.status(404).json({ error: 'Recruiter or student not found' });
            }

            if (!recruiter.googleRefreshToken) {
                return res.status(400).json({ error: 'Recruiter calendar not connected' });
            }

            // Create Calendar Event
            const calendarResult = await createCalendarEvent({
                refreshToken: recruiter.googleRefreshToken,
                summary: title || `Meeting: ${recruiter.name} & ${student.name}`,
                description: `Meeting scheduled via AI Outreach Platform.\n\nAttendees:\n- ${recruiter.name} (${recruiter.email})\n- ${student.name} (${student.email})`,
                startDateTime,
                endDateTime,
                attendees: [recruiter.email, student.email]
            });

            if (!calendarResult.success) {
                throw new Error('Failed to create calendar event');
            }

            // Save to DB
            const meeting = await prisma.meeting.create({
                data: {
                    recruiterId,
                    studentId,
                    title: title || `Meeting: ${recruiter.name} & ${student.name}`,
                    scheduledTime: startDateTime,
                    duration: 30,
                    status: 'scheduled',
                    googleMeetLink: calendarResult.googleMeetLink,
                    calendarEventId: calendarResult.eventId
                }
            });

            res.status(201).json({
                success: true,
                message: 'Meeting booked successfully',
                data: meeting
            });

        } catch (error) {
            console.error('Booking error:', error);
            res.status(500).json({ error: 'Failed to book meeting' });
        }
    }
);

export default router;
