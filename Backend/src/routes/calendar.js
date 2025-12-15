import express from 'express';
import { findAvailableSlots, scheduleMeeting } from '../services/meetingService.js';
import prisma from '../db/client.js'; // Need to fetch recruiter email if not passed

const router = express.Router();

// GET /api/calendar/slots?recruiterId=123&date=2023-10-25
router.get('/slots', async (req, res) => {
    try {
        const { recruiterId, date } = req.query;
        const slots = await findAvailableSlots({ recruiterId, date });
        res.json(slots);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/calendar/schedule
router.post('/schedule', async (req, res) => {
    try {
        const { recruiterId, studentId, time, duration } = req.body;

        // Fetch emails for the service function
        const recruiter = await prisma.recruiter.findUnique({ where: { id: recruiterId } });
        const student = await prisma.student.findUnique({ where: { id: studentId } });

        const meeting = await scheduleMeeting({
            recruiterId,
            studentId,
            recruiterEmail: recruiter.email,
            studentEmail: student.email,
            recruiterName: recruiter.name,
            studentName: student.name,
            scheduledTime: time,
            duration: duration || 30,
            title: "Interview Discussion",
            description: "Scheduled via platform."
        });

        res.json({ success: true, meeting });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;