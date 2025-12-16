import { meetingQueue } from '../queue/index.js';
import { sendMeetingConfirmation } from '../email/emailClient.js';

/**
 * Add meeting reminder jobs to queue (24 hours and 1 hour before)
 */
export async function addMeetingReminderJob(data) {
    const { meetingId, scheduledTime } = data;
    const jobs = [];

    // Schedule 24-hour reminder
    const reminder24h = new Date(scheduledTime).getTime() - (24 * 60 * 60 * 1000);
    const delay24h = reminder24h - Date.now();

    if (delay24h > 0) {
        jobs.push(
            meetingQueue.add('send-reminder-24h', { ...data, reminderType: '24h' }, {
                delay: delay24h,
                attempts: 2
            })
        );
    }

    // Schedule 1-hour reminder
    const reminder1h = new Date(scheduledTime).getTime() - (1 * 60 * 60 * 1000);
    const delay1h = reminder1h - Date.now();

    if (delay1h > 0) {
        jobs.push(
            meetingQueue.add('send-reminder-1h', { ...data, reminderType: '1h' }, {
                delay: delay1h,
                attempts: 2
            })
        );
    }

    return Promise.all(jobs);
}

/**
 * Process 24-hour reminder jobs
 */
meetingQueue.process('send-reminder-24h', async (job) => {
    const { meetingId, recruiterEmail, studentEmail, meetingDetails } = job.data;

    try {
        job.log(`Sending 24-hour reminder for meeting ${meetingId}`);

        const { sendEventInvitation } = await import('../email/emailClient.js');

        // Send reminder emails
        await Promise.all([
            sendEventInvitation({
                to: recruiterEmail,
                type: 'reminder',
                eventDetails: {
                    ...meetingDetails,
                    recipientName: meetingDetails.recruiterName,
                    organizerName: meetingDetails.studentName
                }
            }),
            sendEventInvitation({
                to: studentEmail,
                type: 'reminder',
                eventDetails: {
                    ...meetingDetails,
                    recipientName: meetingDetails.studentName,
                    organizerName: meetingDetails.recruiterName
                }
            })
        ]);

        job.log('24-hour reminder emails sent successfully');

        return { success: true };
    } catch (error) {
        job.log(`Error sending 24-hour reminders: ${error.message}`);
        throw error;
    }
});

/**
 * Process 1-hour reminder jobs
 */
meetingQueue.process('send-reminder-1h', async (job) => {
    const { meetingId, recruiterEmail, studentEmail, meetingDetails } = job.data;

    try {
        job.log(`Sending 1-hour reminder for meeting ${meetingId}`);

        const { sendEventInvitation } = await import('../email/emailClient.js');

        // Send reminder emails
        await Promise.all([
            sendEventInvitation({
                to: recruiterEmail,
                type: 'reminder',
                eventDetails: {
                    ...meetingDetails,
                    recipientName: meetingDetails.recruiterName,
                    organizerName: meetingDetails.studentName,
                    reminderTime: '1 hour'
                }
            }),
            sendEventInvitation({
                to: studentEmail,
                type: 'reminder',
                eventDetails: {
                    ...meetingDetails,
                    recipientName: meetingDetails.studentName,
                    organizerName: meetingDetails.recruiterName,
                    reminderTime: '1 hour'
                }
            })
        ]);

        job.log('1-hour reminder emails sent successfully');

        return { success: true };
    } catch (error) {
        job.log(`Error sending 1-hour reminders: ${error.message}`);
        throw error;
    }
});

export default {
    addMeetingReminderJob
};
