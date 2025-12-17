import prisma from '../src/db/client.js';
import { sendEmail } from '../src/email/emailClient.js';
import { getEmailTemplate } from '../src/email/templates.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Test Brevo SMTP email sending
 * This script sends a test meeting confirmation email
 */
async function testBrevoEmail() {
    console.log('🧪 Testing Brevo SMTP Email Configuration...\n');

    // Test email recipient (change this to your email)
    const testRecipient = process.env.TEST_EMAIL || 'your-email@example.com';

    console.log(`📧 Sending test email to: ${testRecipient}\n`);

    // Create sample meeting details
    const meetingDetails = {
        eventName: 'Test Meeting - Technical Interview',
        scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short'
        }),
        duration: 30,
        googleMeetLink: 'https://meet.google.com/test-meet-link',
        description: 'This is a test meeting confirmation email sent via Brevo SMTP',
        eventField: 'Software Engineering',
        keyAreas: [
            'Technical skills assessment',
            'Project experience discussion',
            'Career goals alignment'
        ],
        recipientName: 'Test User',
        organizerName: 'AI Outreach Platform',
        type: 'invitation'
    };

    try {
        // Get the email template
        const template = getEmailTemplate('eventInvitation');
        const html = template(meetingDetails);

        // Send the email
        console.log('Sending email via Brevo SMTP...\n');
        const result = await sendEmail({
            to: testRecipient,
            subject: '🎯 Test: Meeting Confirmation Email',
            html
        });

        if (result.success) {
            console.log('\n✅ SUCCESS! Test email sent successfully!\n');
            console.log('Details:');
            console.log(`   Recipient: ${result.recipient}`);
            console.log(`   Message ID: ${result.messageId}\n`);
            console.log('Next steps:');
            console.log('   1. Check your inbox (and spam folder)');
            console.log('   2. Verify email formatting looks correct');
            console.log('   3. Click the Google Meet link to test');
            console.log('   4. Check Brevo dashboard for delivery status\n');
        } else {
            console.log('\n❌ FAILED! Email could not be sent.\n');
            console.log('Error:', result.error);
            console.log('\nTroubleshooting:');
            console.log('   1. Verify SMTP credentials in .env file');
            console.log('   2. Check sender email is verified in Brevo');
            console.log('   3. Ensure SMTP_PASS is the SMTP key (not password)');
            console.log('   4. Review docs/BREVO_SETUP.md for help\n');
        }

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        console.error('\nStack trace:', error.stack);
    }
}

// Run the test
testBrevoEmail()
    .then(() => {
        console.log('Test completed.');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Test failed:', error);
        process.exit(1);
    });
