import Handlebars from 'handlebars';

/**
 * Email Templates using Handlebars
 */

const templates = {
    welcome: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to AI Outreach Platform!</h1>
        </div>
        <div class="content">
          <p>Hi {{name}},</p>
          <p>Thank you for joining our waitlist! We're excited to have you on board.</p>
          <p>We're building something amazing to connect recruiters and students seamlessly. You'll be among the first to know when we launch.</p>
          <p>In the meantime, feel free to reach out if you have any questions.</p>
          <a href="#" class="button">Learn More</a>
        </div>
        <div class="footer">
          <p>&copy; 2024 AI Outreach Platform. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `,

    meetingConfirmation: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #fff; padding: 30px; border: 1px solid #ddd; }
        .meeting-details { background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .button { display: inline-block; padding: 12px 30px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>{{#if (eq type 'reminder')}}Meeting Reminder{{else}}Meeting Confirmed{{/if}}</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>{{#if (eq type 'reminder')}}This is a reminder about your upcoming meeting:{{else}}Your meeting has been scheduled:{{/if}}</p>
          
          <div class="meeting-details">
            <h3>{{title}}</h3>
            <p><strong>Date & Time:</strong> {{scheduledTime}}</p>
            <p><strong>Duration:</strong> {{duration}} minutes</p>
            {{#if googleMeetLink}}
            <p><strong>Join Link:</strong> <a href="{{googleMeetLink}}">{{googleMeetLink}}</a></p>
            {{/if}}
            {{#if description}}
            <p><strong>Description:</strong> {{description}}</p>
            {{/if}}
          </div>

          {{#if googleMeetLink}}
          <a href="{{googleMeetLink}}" class="button">Join Meeting</a>
          {{/if}}

          <p>Looking forward to speaking with you!</p>
        </div>
      </div>
    </body>
    </html>
  `,

    campaignInvitation: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .content { background: white; padding: 30px; }
        .button { display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="content">
          <p>Hi {{name}},</p>
          {{{content}}}
        </div>
      </div>
    </body>
    </html>
  `
};

// Register Handlebars helper for equality check
Handlebars.registerHelper('eq', function (a, b) {
    return a === b;
});

/**
 * Get compiled email template
 */
export function getEmailTemplate(templateName) {
    const template = templates[templateName];
    if (!template) {
        throw new Error(`Template ${templateName} not found`);
    }
    return Handlebars.compile(template);
}

export default {
    getEmailTemplate
};
