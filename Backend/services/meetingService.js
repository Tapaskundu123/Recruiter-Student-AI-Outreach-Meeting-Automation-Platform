import { getFreeBusy, createCalendarEvent } from '../src/calendar/googleCalendar.js'; // Ensure correct import path
import prisma from '../db/client.js';
import { sendMeetingConfirmation } from '../email/emailClient.js';
import { addMeetingReminderJob } from '../jobs/meetingJobs.js';

// ... (keep scheduleMeeting as is) ...

export async function findAvailableSlots({
    recruiterId,
    date, // ISO Date string (e.g. "2023-10-25")
    duration = 30
}) {
    try {
        // 1. Get Recruiter's Refresh Token
        const recruiter = await prisma.recruiter.findUnique({
            where: { id: recruiterId },
            select: { googleRefreshToken: true, email: true }
        });

        if (!recruiter?.googleRefreshToken) {
            throw new Error('Recruiter calendar not connected');
        }

        // 2. Define Day Range (9 AM - 5 PM)
        const startOfDay = new Date(date);
        startOfDay.setHours(9, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(17, 0, 0, 0);

        // 3. Fetch Busy Times from Google
        const busyData = await getFreeBusy({
            refreshToken: recruiter.googleRefreshToken,
            timeMin: startOfDay,
            timeMax: endOfDay,
            emails: [recruiter.email]
        });

        const busySlots = busyData.calendars[recruiter.email]?.busy || [];

        // 4. Generate All Possible Slots & Filter Busy Ones
        const availableSlots = [];
        let currentSlot = new Date(startOfDay);

        while (currentSlot.getTime() + duration * 60000 <= endOfDay.getTime()) {
            const slotEnd = new Date(currentSlot.getTime() + duration * 60000);

            // Check if this slot overlaps with any busy period
            const isBusy = busySlots.some(busy => {
                const busyStart = new Date(busy.start);
                const busyEnd = new Date(busy.end);
                return (currentSlot < busyEnd && slotEnd > busyStart);
            });

            if (!isBusy) {
                availableSlots.push({
                    start: new Date(currentSlot),
                    end: slotEnd
                });
            }

            // Move to next slot (e.g. 30 mins later)
            currentSlot = slotEnd;
        }

        return availableSlots;
    } catch (error) {
        console.error('Slot finding error:', error);
        throw error;
    }
}