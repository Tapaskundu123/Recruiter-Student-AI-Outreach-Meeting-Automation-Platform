import { createCalendarEvent } from './googleCalendar.js';
import prisma from '../db/client.js';
import { sendMeetingConfirmation } from '../email/emailClient.js';
import { addMeetingReminderJob } from '../jobs/meetingJobs.js';

/**
 * Schedule a meeting with calendar event and email notifications
 */
export async function scheduleMeeting({
    recruiterId,
    studentId,
    recruiterEmail,
    studentEmail,
    recruiterName,
    studentName,
    scheduledTime,
    duration,
    title,
    description
}) {
    try {
        const startTime = new Date(scheduledTime);
        const endTime = new Date(startTime.getTime() + duration * 60000);

        // Create Google Calendar event
        const calendarResult = await createCalendarEvent({
            summary: title,
            description: description || `Meeting between ${recruiterName} and ${studentName}`,
            startDateTime: startTime,
            endDateTime: endTime,
            attendees: [recruiterEmail, studentEmail]
        });

        if (!calendarResult.success) {
            throw new Error(`Failed to create calendar event: ${calendarResult.error}`);
        }

        // Create meeting record in database
        const meeting = await prisma.meeting.create({
            data: {
                recruiterId,
                studentId,
                title,
                description,
                scheduledTime: startTime,
                duration,
                googleMeetLink: calendarResult.googleMeetLink,
                calendarEventId: calendarResult.eventId,
                status: 'scheduled'
            }
        });

        // Send confirmation emails
        const meetingDetails = {
            title,
            scheduledTime: startTime.toLocaleString(),
            duration,
            googleMeetLink: calendarResult.googleMeetLink,
            description
        };

        await Promise.all([
            sendMeetingConfirmation({
                to: recruiterEmail,
                type: 'confirmation',
                meetingDetails
            }),
            sendMeetingConfirmation({
                to: studentEmail,
                type: 'confirmation',
                meetingDetails
            })
        ]);

        // Update meeting as confirmation sent
        await prisma.meeting.update({
            where: { id: meeting.id },
            data: { confirmationSent: true }
        });

        // Schedule reminder job
        await addMeetingReminderJob({
            meetingId: meeting.id,
            scheduledTime: startTime,
            recruiterEmail,
            studentEmail,
            meetingDetails
        });

        return meeting;
    } catch (error) {
        console.error('Meeting scheduling error:', error);
        throw error;
    }
}

/**
 * Find available time slots
 */
export async function findAvailableSlots({
    startDate,
    endDate,
    duration = 30,
    emails = []
}) {
    try {
        // TODO: Implement free/busy check and slot finding
        // This would query Google Calendar API for free/busy times
        // and return available slots

        const slots = [];
        const currentDate = new Date(startDate);
        const end = new Date(endDate);

        // Simple slot generation (9 AM - 5 PM, weekdays)
        while (currentDate < end) {
            const day = currentDate.getDay();

            // Skip weekends
            if (day !== 0 && day !== 6) {
                for (let hour = 9; hour < 17; hour++) {
                    const slotTime = new Date(currentDate);
                    slotTime.setHours(hour, 0, 0, 0);

                    slots.push({
                        start: slotTime,
                        end: new Date(slotTime.getTime() + duration * 60000)
                    });
                }
            }

            currentDate.setDate(currentDate.getDate() + 1);
        }

        return slots;
    } catch (error) {
        console.error('Slot finding error:', error);
        return [];
    }
}

export default {
    scheduleMeeting,
    findAvailableSlots
};
