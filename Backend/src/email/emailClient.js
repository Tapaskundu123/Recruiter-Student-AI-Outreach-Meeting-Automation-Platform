import nodemailer from 'nodemailer';
import config from '../config/index.js';
import { getEmailTemplate } from './templates.js';

let transporter;

/**
 * Initialize email transporter
 */
function initTransporter() {
    if (transporter) return transporter;

    if (config.EMAIL_SERVICE === 'smtp') {
        transporter = nodemailer.createTransport({
            host: config.SMTP.HOST,
            port: config.SMTP.PORT,
            secure: config.SMTP.PORT === 465,
            auth: {
                user: config.SMTP.USER,
                pass: config.SMTP.PASS
            }
        });
    }
    // Add Postmark/SendGrid configurations as needed

    return transporter;
}

/**
 * Send email
 */
export async function sendEmail({ to, subject, html, text }) {
    try {
        const transport = initTransporter();

        const mailOptions = {
            from: `${config.SMTP.FROM_NAME} <${config.SMTP.FROM}>`,
            to,
            subject,
            html,
            text: text || html.replace(/<[^>]*>/g, '') // Strip HTML for text version
        };

        const info = await transport.sendMail(mailOptions);

        console.log(`Email sent to ${to}: ${info.messageId}`);

        return {
            success: true,
            messageId: info.messageId
        };
    } catch (error) {
        console.error('Email send error:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Send meeting confirmation email
 */
export async function sendMeetingConfirmation({ to, type, meetingDetails }) {
    try {
        const template = getEmailTemplate('meetingConfirmation');
        const html = template({
            ...meetingDetails,
            type // 'confirmation' or 'reminder'
        });

        const subject =
            type === 'reminder'
                ? `Reminder: Meeting Tomorrow - ${meetingDetails.title}`
                : `Meeting Confirmed: ${meetingDetails.title}`;

        return await sendEmail({ to, subject, html });
    } catch (error) {
        console.error('Meeting confirmation error:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Send welcome email to waitlist
 */
export async function sendWelcomeEmail({ to, name }) {
    try {
        const template = getEmailTemplate('welcome');
        const html = template({ name });

        return await sendEmail({
            to,
            subject: 'Welcome to AI Outreach Platform!',
            html
        });
    } catch (error) {
        console.error('Welcome email error:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Verify email configuration
 */
export async function verifyEmailConfig() {
    try {
        const transport = initTransporter();
        await transport.verify();
        console.log('Email configuration verified ✓');
        return true;
    } catch (error) {
        console.error('Email verification failed:', error.message);
        return false;
    }
}

export default {
    sendEmail,
    sendMeetingConfirmation,
    sendWelcomeEmail,
    verifyEmailConfig
};
