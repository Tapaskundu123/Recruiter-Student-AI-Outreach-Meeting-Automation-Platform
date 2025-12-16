import express from 'express';
import { body, query, validationResult } from 'express-validator';
import prisma from '../db/client.js';
import { listEvents, createCalendarEvent } from '../calendar/googleCalendar.js';

const router = express.Router();

/**
 * GET /api/calendar/slots
 * Get calendar events/slots for a specific date range
 */
router.get('/slots',
    [
        query('recruiterId').isUUID().withMessage('Valid recruiter ID required'),
        query('date').isISO8601().withMessage('Valid date required (YYYY-MM-DD)')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { recruiterId, date } = req.query;

            const recruiter = await prisma.recruiter.findUnique({
                where: { id: recruiterId }
            });

            if (!recruiter || !recruiter.googleRefreshToken) {
                return res.status(400).json({
                    error: 'Calendar not connected',
                    code: 'CALENDAR_NOT_CONNECTED'
                });
            }

            // Define range: Start of month to End of month (to populate the view efficiently)
            // Or just the specific day if view is 'day'. 
            // For now, let's fetch the whole month around the date to support month view dots.
            // Actually, the frontend might request a specific range.
            // Let's assume 'date' is the center, and we fetch month.

            const targetDate = new Date(date);
            const startStr = req.query.start || new Date(targetDate.getFullYear(), targetDate.getMonth(), 1).toISOString();
            const endStr = req.query.end || new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59).toISOString();

            const result = await listEvents({
                refreshToken: recruiter.googleRefreshToken,
                timeMin: new Date(startStr),
                timeMax: new Date(endStr)
            });

            if (!result.success) {
                throw new Error(result.error);
            }

            // Fetch database meetings for the same period
            const dbMeetings = await prisma.meeting.findMany({
                where: {
                    recruiterId,
                    scheduledTime: {
                        gte: new Date(startStr),
                        lte: new Date(endStr)
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

            // Map Google events to a cleaner format for frontend
            const formattedEvents = result.events.map(event => ({
                id: event.id,
                title: event.summary || '(No Title)',
                start: event.start.dateTime || event.start.date, // Date handle for all-day events
                end: event.end.dateTime || event.end.date,
                allDay: !event.start.dateTime,
                description: event.description,
                meetLink: event.conferenceData?.entryPoints?.find(e => e.entryPointType === 'video')?.uri,
                type: 'calendar', // Mark as calendar event
                source: 'google'
            }));

            // Format database meetings
            const formattedMeetings = dbMeetings.map(meeting => ({
                id: meeting.id,
                title: meeting.title,
                start: meeting.scheduledTime.toISOString(),
                end: new Date(meeting.scheduledTime.getTime() + meeting.duration * 60000).toISOString(),
                allDay: false,
                description: meeting.description,
                meetLink: meeting.googleMeetLink,
                type: 'interview', // Mark as interview
                source: 'database',
                status: meeting.status,
                student: meeting.student,
                calendarEventId: meeting.calendarEventId
            }));

            // Combine both sources (interviews will appear alongside calendar events)
            const allEvents = [...formattedEvents, ...formattedMeetings];

            res.json({
                slots: [], // Legacy field if needed
                events: formattedEvents, // Only Google Calendar events
                interviews: formattedMeetings, // Database interviews
                allEvents // Combined view
            });

        } catch (error) {
            console.error('Calendar fetch error:', error);
            res.status(500).json({ error: 'Failed to fetch calendar data' });
        }
    }
);

/**
 * POST /api/calendar/schedule
 * Schedule a meeting directly (internal use)
 */
router.post('/schedule',
    [
        body('recruiterId').isUUID(),
        body('studentId').optional().isString(), // might be a placeholder ID or name
        body('title').optional().isString(),
        body('time').isISO8601(),
        body('duration').isInt({ min: 15, max: 120 })
    ],
    async (req, res) => {
        try {
            const { recruiterId, studentId, title, time, duration } = req.body;

            const recruiter = await prisma.recruiter.findUnique({ where: { id: recruiterId } });
            if (!recruiter?.googleRefreshToken) return res.status(400).json({ error: 'Recruiter not connected' });

            // If studentId is UUID, fetch student. If not, assume it's a manual entry (TODO)
            let student = null;
            if (studentId && studentId.length === 36) { // naive uuid check
                student = await prisma.student.findUnique({ where: { id: studentId } });
            }

            const startDateTime = new Date(time);
            const endDateTime = new Date(startDateTime.getTime() + duration * 60000);

            const result = await createCalendarEvent({
                refreshToken: recruiter.googleRefreshToken,
                summary: title || 'New Meeting',
                description: 'Created via AI Outreach Platform',
                startDateTime,
                endDateTime,
                attendees: student ? [recruiter.email, student.email] : [recruiter.email]
            });

            if (!result.success) throw new Error(result.error);

            res.json({ success: true, event: result });

        } catch (error) {
            console.error('Schedule error:', error);
            res.status(500).json({ error: 'Failed to schedule' });
        }
    }
);

export default router;