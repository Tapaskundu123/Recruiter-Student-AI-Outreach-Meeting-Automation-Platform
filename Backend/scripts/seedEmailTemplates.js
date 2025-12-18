import prisma from '../src/db/client.js';

async function seedEmailTemplates() {
    console.log('🌱 Seeding email templates...');

    const templates = [
        {
            name: 'Recruiter Introduction',
            category: 'recruiter',
            subject: 'Connecting Top Talent with {{company}}',
            description: 'Professional introduction to recruiters',
            content: `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #e2e8f0; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Hello {{name}}!</h1>
        </div>
        <div class="content">
            <p>I hope this message finds you well at {{company}}.</p>
            <p>I'm reaching out to connect talented professionals with exciting career opportunities. Our platform specializes in matching top-tier candidates with companies like yours.</p>
            <p>I'd love to discuss how we can help you find exceptional talent for your team.</p>
            <p>Would you be available for a brief conversation this week?</p>
            <a href="#" class="button">Schedule a Meeting</a>
            <p>Best regards,<br>AI Outreach Team</p>
        </div>
    </div>
</body>
</html>`,
            isActive: true
        },
        {
            name: 'Student Opportunity Outreach',
            category: 'student',
            subject: 'Exciting Career Opportunity for {{name}}',
            description: 'Outreach to students about career opportunities',
            content: `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #e2e8f0; }
        .highlight { background: #f0fdf4; padding: 15px; border-left: 4px solid #10b981; margin: 20px 0; }
        .button { display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Hi {{name}}!</h1>
        </div>
        <div class="content">
            <p>Congratulations on your journey at {{university}}!</p>
            <p>We've been impressed by your profile and believe you'd be a great fit for some exciting opportunities we're helping to fill.</p>
            <div class="highlight">
                <strong>Why this could be perfect for you:</strong>
                <ul>
                    <li>Work with innovative companies</li>
                    <li>Great for {{degree}} graduates</li>
                    <li>Competitive compensation and benefits</li>
                    <li>Career growth opportunities</li>
                </ul>
            </div>
            <p>Would you be interested in learning more?</p>
            <a href="#" class="button">Explore Opportunities</a>
            <p>Looking forward to connecting with you!</p>
            <p>Best regards,<br>AI Outreach Team</p>
        </div>
    </div>
</body>
</html>`,
            isActive: true
        },
        {
            name: 'Follow-Up Template',
            category: 'both',
            subject: 'Following Up: {{name}}',
            description: 'General follow-up template for both recruiters and students',
            content: `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .content { background: white; padding: 30px; border: 1px solid #e2e8f0; border-radius: 8px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="content">
            <p>Hi {{name}},</p>
            <p>I wanted to follow up on my previous message regarding our conversation.</p>
            <p>I understand you're busy, but I wanted to ensure this opportunity doesn't slip through the cracks.</p>
            <p>Would you have 15 minutes this week for a quick chat?</p>
            <p>Looking forward to hearing from you.</p>
            <p>Best regards,<br>AI Outreach Team</p>
        </div>
    </div>
</body>
</html>`,
            isActive: true
        },
        {
            name: 'Meeting Invitation',
            category: 'both',
            subject: 'Let\'s Connect: Meeting Invitation',
            description: 'Invitation to schedule a meeting',
            content: `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background: white; padding: 30px; border: 1px solid #e2e8f0; }
        .button { display: inline-block; padding: 12px 30px; background: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📅 Let's Connect!</h1>
        </div>
        <div class="content">
            <p>Hi {{name}},</p>
            <p>I'd love to schedule a meeting with you to discuss how we can work together.</p>
            <p>Please use the link below to book a time that works best for you:</p>
            <div style="text-align: center;">
                <a href="#" class="button">Schedule Meeting</a>
            </div>
            <p>I look forward to our conversation!</p>
            <p>Best regards,<br>AI Outreach Team</p>
        </div>
        <div class="footer">
            <p>© 2024 AI Outreach Platform. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`,
            isActive: true
        }
    ];

    for (const template of templates) {
        try {
            await prisma.emailTemplate.create({
                data: template
            });
            console.log(`✅ Created template: ${template.name}`);
        } catch (error) {
            console.log(`⚠️  Template "${template.name}" may already exist, skipping...`);
        }
    }

    console.log('✨ Email templates seeding completed!');
}

// Run the seeder
seedEmailTemplates()
    .catch((error) => {
        console.error('Error seeding email templates:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
