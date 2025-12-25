import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

export async function sendWaitlistEmail({ to,name, university, linkedIn }) {
    await transporter.sendMail({
        from: '"AI Outreach Platform" <no-reply@aioutrich.com>',
        to,
        subject: 'Welcome to the AI Outreach Waitlist! 🚀',
        html: `
            <h1>Hi ${name},</h1>
            <p>Thank you for joining the AI Outreach Platform waitlist!</p>
            <p>We're excited to connect top students like you with recruiters using AI-powered automation.</p>
            ${university ? `<p><strong>University:</strong> ${university}</p>` : ''}
            ${linkedIn ? `<p><strong>LinkedIn:</strong> <a href="${linkedIn}">${linkedIn}</a></p>` : ''}
            <p>We'll notify you as soon as we're ready for early access.</p>
            <br>
            <p>Best regards,<br>The AI Outreach Team</p>
        `
    });
}