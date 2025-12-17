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
            },
            // Brevo-specific settings
            pool: true, // Use pooled connections for better performance
            maxConnections: 5,
            maxMessages: 100
        });

        // Log Brevo connection info
        if (config.SMTP.HOST && config.SMTP.HOST.includes('brevo')) {
            console.log('📧 Initializing Brevo SMTP transporter...');
            console.log(`   Host: ${config.SMTP.HOST}`);
            console.log(`   Port: ${config.SMTP.PORT}`);
            console.log(`   User: ${config.SMTP.USER}`);
            console.log(`   From: ${config.SMTP.FROM}`);
        }
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

        // Enhanced logging for Brevo
        if (config.SMTP.HOST && config.SMTP.HOST.includes('brevo')) {
            console.log(`✅ Email sent via Brevo SMTP`);
            console.log(`   To: ${to}`);
            console.log(`   Subject: ${subject}`);
            console.log(`   Message ID: ${info.messageId}`);
        } else {
            console.log(`Email sent to ${to}: ${info.messageId}`);
        }

        return {
            success: true,
            messageId: info.messageId,
            recipient: to
        };
    } catch (error) {
        console.error('❌ Email send error:', error.message);
        console.error(`   Recipient: ${to}`);
        console.error(`   SMTP Host: ${config.SMTP.HOST}`);
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
 * Send event invitation email with enhanced template
 */
export async function sendEventInvitation({ to, type, eventDetails }) {
    try {
        const template = getEmailTemplate('eventInvitation');
        const html = template({
            ...eventDetails,
            type // 'invitation' or 'reminder'
        });

        const subject =
            type === 'reminder'
                ? `⏰ Reminder: ${eventDetails.eventName} - Tomorrow`
                : `🎯 Event Invitation: ${eventDetails.eventName}`;

        return await sendEmail({ to, subject, html });
    } catch (error) {
        console.error('Event invitation error:', error.message);
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

        if (config.SMTP.HOST && config.SMTP.HOST.includes('brevo')) {
            console.log('✅ Brevo SMTP configuration verified successfully!');
            console.log('   Ready to send meeting confirmation emails');
        } else {
            console.log('✓ Email configuration verified');
        }

        return true;
    } catch (error) {
        console.error('❌ Email verification failed:', error.message);
        if (config.SMTP.HOST && config.SMTP.HOST.includes('brevo')) {
            console.error('   Please check your Brevo SMTP credentials in .env');
            console.error('   Get credentials from: https://app.brevo.com/settings/keys/smtp');
        }
        return false;
    }
}

export default {
    sendEmail,
    sendMeetingConfirmation,
    sendEventInvitation,
    sendWelcomeEmail,
    verifyEmailConfig
};
