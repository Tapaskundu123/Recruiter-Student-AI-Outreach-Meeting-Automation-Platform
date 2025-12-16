import { createCalendarEvent } from './googleCalendar.js';
import prisma from '../db/client.js';
import { sendMeetingConfirmation } from '../email/emailClient.js';
import { addMeetingReminderJob } from '../jobs/meetingJobs.js';

/**
 * Schedule a meeting with calendar event and email notifications
 */
export async function scheduleMeeting({
    recruiterId,
    refreshToken, // Receive refresh token
    studentId,
    recruiterEmail,
    studentEmail,
    recruiterName,
    studentName,
    scheduledTime,
    duration,
    title,
    description,
    eventField,
    keyAreas
}) {
    try {
        const startTime = new Date(scheduledTime);
        const endTime = new Date(startTime.getTime() + duration * 60000);

        // Create Google Calendar event
        const calendarResult = await createCalendarEvent({
            refreshToken, // Pass refresh token
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
                eventField,
                keyAreas: keyAreas || [],
                scheduledTime: startTime,
                duration,
                googleMeetLink: calendarResult.googleMeetLink,
                calendarEventId: calendarResult.eventId,
                status: 'scheduled'
            }
        });

        // Send confirmation emails with enhanced template
        const eventDetails = {
            eventName: title,
            scheduledTime: startTime.toLocaleString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZoneName: 'short'
            }),
            duration,
            googleMeetLink: calendarResult.googleMeetLink,
            description,
            eventField,
            keyAreas: keyAreas || [],
            recipientName: recruiterName,
            organizerName: studentName
        };

        const { sendEventInvitation } = await import('../email/emailClient.js');

        await Promise.all([
            sendEventInvitation({
                to: recruiterEmail,
                type: 'invitation',
                eventDetails: {
                    ...eventDetails,
                    recipientName: recruiterName,
                    organizerName: studentName
                }
            }),
            sendEventInvitation({
                to: studentEmail,
                type: 'invitation',
                eventDetails: {
                    ...eventDetails,
                    recipientName: studentName,
                    organizerName: recruiterName
                }
            })
        ]);

        // Update meeting as confirmation sent
        await prisma.meeting.update({
            where: { id: meeting.id },
            data: { confirmationSent: true }
        });

        // Schedule reminder jobs (both 24h and 1h)
        await addMeetingReminderJob({
            meetingId: meeting.id,
            scheduledTime: startTime,
            recruiterEmail,
            studentEmail,
            meetingDetails: {
                eventName: title,
                scheduledTime: startTime.toLocaleString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZoneName: 'short'
                }),
                duration,
                googleMeetLink: calendarResult.googleMeetLink,
                description,
                eventField,
                keyAreas: keyAreas || [],
                recruiterName,
                studentName
            }
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
