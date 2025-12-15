import { google } from 'googleapis';
import config from '../config/index.js';

/**
 * Initialize Google Calendar API client for a specific user
 * @param {string} refreshToken - User's refresh token
 */
function initCalendar(refreshToken) {
    if (!refreshToken) {
        throw new Error('Refresh token required for calendar initialization');
    }

    const oauth2Client = new google.auth.OAuth2(
        config.GOOGLE.CLIENT_ID,
        config.GOOGLE.CLIENT_SECRET,
        config.GOOGLE.REDIRECT_URI
    );

    oauth2Client.setCredentials({
        refresh_token: refreshToken
    });

    return google.calendar({ version: 'v3', auth: oauth2Client });
}

/**
 * Create calendar event with Google Meet
 * @param {Object} tokens - { refreshToken }
 */
export async function createCalendarEvent({
    refreshToken,
    summary,
    description,
    startDateTime,
    endDateTime,
    attendees
}) {
    try {
        const calendarApi = initCalendar(refreshToken);

        const event = {
            summary,
            description,
            start: {
                dateTime: startDateTime.toISOString(),
                timeZone: config.MEETING.TIMEZONE
            },
            end: {
                dateTime: endDateTime.toISOString(),
                timeZone: config.MEETING.TIMEZONE
            },
            attendees: attendees.map(email => ({ email })),
            conferenceData: {
                createRequest: {
                    requestId: `meet-${Date.now()}`,
                    conferenceSolutionKey: { type: 'hangoutsMeet' }
                }
            },
            reminders: {
                useDefault: false,
                overrides: [
                    { method: 'email', minutes: 24 * 60 }, // 1 day before
                    { method: 'popup', minutes: 30 } // 30 min before
                ]
            }
        };

        const response = await calendarApi.events.insert({
            calendarId: 'primary',
            conferenceDataVersion: 1,
            sendUpdates: 'all',
            resource: event
        });

        const googleMeetLink = response.data.conferenceData?.entryPoints?.find(
            ep => ep.entryPointType === 'video'
        )?.uri;

        return {
            success: true,
            eventId: response.data.id,
            googleMeetLink,
            htmlLink: response.data.htmlLink
        };
    } catch (error) {
        console.error('Calendar event creation error:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Update calendar event
 */
export async function updateCalendarEvent({ refreshToken, eventId, updates }) {
    try {
        const calendarApi = initCalendar(refreshToken);

        const response = await calendarApi.events.patch({
            calendarId: 'primary',
            eventId,
            resource: updates,
            sendUpdates: 'all'
        });

        return {
            success: true,
            event: response.data
        };
    } catch (error) {
        console.error('Calendar event update error:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Delete calendar event
 */
export async function deleteCalendarEvent({ refreshToken, eventId }) {
    try {
        const calendarApi = initCalendar(refreshToken);

        await calendarApi.events.delete({
            calendarId: 'primary',
            eventId,
            sendUpdates: 'all'
        });

        return { success: true };
    } catch (error) {
        console.error('Calendar event deletion error:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Get free/busy information
 */
export async function getFreeBusy({ refreshToken, timeMin, timeMax, emails }) {
    try {
        const calendarApi = initCalendar(refreshToken);

        const response = await calendarApi.freebusy.query({
            resource: {
                timeMin: timeMin.toISOString(),
                timeMax: timeMax.toISOString(),
                items: emails.map(email => ({ id: email }))
            }
        });

        return {
            success: true,
            calendars: response.data.calendars
        };
    } catch (error) {
        console.error('Free/busy query error:', error.message);
        return { success: false, error: error.message };
    }
}

export default {
    createCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
    getFreeBusy
};
