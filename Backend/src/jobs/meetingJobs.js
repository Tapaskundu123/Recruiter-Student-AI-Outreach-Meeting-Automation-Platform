import { meetingQueue } from '../queue/index.js';
import { sendMeetingConfirmation } from '../email/emailClient.js';

/**
 * Add meeting reminder job to queue
 */
export async function addMeetingReminderJob(data) {
    const { meetingId, scheduledTime } = data;

    // Send reminder 24 hours before meeting
    const reminderTime = new Date(scheduledTime).getTime() - (24 * 60 * 60 * 1000);
    const delay = reminderTime - Date.now();

    if (delay > 0) {
        return meetingQueue.add('send-reminder', data, {
            delay,
            attempts: 2
        });
    }

    return null;
}

/**
 * Process meeting reminder jobs
 */
meetingQueue.process('send-reminder', async (job) => {
    const { meetingId, recruiterEmail, studentEmail, meetingDetails } = job.data;

    try {
        job.log(`Sending reminder for meeting ${meetingId}`);

        // Send reminder emails
        await Promise.all([
            sendMeetingConfirmation({
                to: recruiterEmail,
                type: 'reminder',
                meetingDetails
            }),
            sendMeetingConfirmation({
                to: studentEmail,
                type: 'reminder',
                meetingDetails
            })
        ]);

        job.log('Reminder emails sent successfully');

        return { success: true };
    } catch (error) {
        job.log(`Error sending reminders: ${error.message}`);
        throw error;
    }
});

export default {
    addMeetingReminderJob
};
