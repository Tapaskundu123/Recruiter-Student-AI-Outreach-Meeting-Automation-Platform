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
  `,

  eventInvitation: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #1a202c;
          background-color: #f7fafc;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 40px 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0 0 10px 0;
          font-size: 28px;
          font-weight: 600;
        }
        .header p {
          margin: 0;
          font-size: 16px;
          opacity: 0.95;
        }
        .content {
          padding: 40px 30px;
        }
        .greeting {
          font-size: 18px;
          margin-bottom: 20px;
          color: #2d3748;
        }
        .event-card {
          background: linear-gradient(135deg, #f6f8fb 0%, #f0f4f8 100%);
          border-left: 4px solid #667eea;
          border-radius: 8px;
          padding: 25px;
          margin: 25px 0;
        }
        .event-title {
          font-size: 22px;
          font-weight: 700;
          color: #1a202c;
          margin: 0 0 20px 0;
        }
        .event-detail {
          display: flex;
          align-items: flex-start;
          margin: 12px 0;
          font-size: 15px;
        }
        .event-detail-icon {
          margin-right: 12px;
          font-size: 18px;
          min-width: 20px;
        }
        .event-detail-label {
          font-weight: 600;
          color: #4a5568;
          min-width: 100px;
        }
        .event-detail-value {
          color: #2d3748;
        }
        .key-areas {
          background: white;
          padding: 15px;
          border-radius: 6px;
          margin-top: 15px;
        }
        .key-areas-title {
          font-weight: 600;
          color: #4a5568;
          margin-bottom: 10px;
        }
        .key-areas ul {
          margin: 0;
          padding-left: 20px;
        }
        .key-areas li {
          color: #2d3748;
          margin: 6px 0;
        }
        .meet-button {
          display: inline-block;
          padding: 16px 40px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white !important;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          margin: 25px 0;
          text-align: center;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
          transition: all 0.3s ease;
        }
        .meet-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
        }
        .button-container {
          text-align: center;
          margin: 30px 0;
        }
        .reminder-note {
          background: #fff5f5;
          border-left: 4px solid #fc8181;
          padding: 15px;
          border-radius: 6px;
          margin: 20px 0;
          font-size: 14px;
          color: #742a2a;
        }
        .footer {
          background: #f7fafc;
          padding: 30px;
          text-align: center;
          color: #718096;
          font-size: 14px;
          border-top: 1px solid #e2e8f0;
        }
        .footer a {
          color: #667eea;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎯 {{#if (eq type 'reminder')}}Reminder: Meeting Tomorrow{{else}}New Event Scheduled{{/if}}</h1>
          <p>{{#if (eq type 'reminder')}}Don't forget about your upcoming meeting{{else}}You're invited to an event{{/if}}</p>
        </div>
        
        <div class="content">
          <div class="greeting">
            Hello {{recipientName}},
          </div>
          
          <p>
            {{#if (eq type 'reminder')}}
              This is a friendly reminder that you have a meeting scheduled for tomorrow:
            {{else}}
              {{organizerName}} has scheduled a meeting with you. Here are the details:
            {{/if}}
          </p>
          
          <div class="event-card">
            <div class="event-title">{{eventName}}</div>
            
            <div class="event-detail">
              <div class="event-detail-icon">📅</div>
              <div class="event-detail-label">Date & Time:</div>
              <div class="event-detail-value">{{scheduledTime}}</div>
            </div>
            
            <div class="event-detail">
              <div class="event-detail-icon">⏱️</div>
              <div class="event-detail-label">Duration:</div>
              <div class="event-detail-value">{{duration}} minutes</div>
            </div>
            
            {{#if eventField}}
            <div class="event-detail">
              <div class="event-detail-icon">🏢</div>
              <div class="event-detail-label">Field:</div>
              <div class="event-detail-value">{{eventField}}</div>
            </div>
            {{/if}}
            
            {{#if description}}
            <div class="event-detail">
              <div class="event-detail-icon">📝</div>
              <div class="event-detail-label">Description:</div>
              <div class="event-detail-value">{{description}}</div>
            </div>
            {{/if}}
            
            {{#if keyAreas}}
            <div class="key-areas">
              <div class="key-areas-title">📌 Key Discussion Areas:</div>
              <ul>
                {{#each keyAreas}}
                <li>{{this}}</li>
                {{/each}}
              </ul>
            </div>
            {{/if}}
          </div>
          
          {{#if googleMeetLink}}
          <div class="button-container">
            <a href="{{googleMeetLink}}" class="meet-button">
              🎥 Join Google Meet
            </a>
          </div>
          {{/if}}
          
          {{#unless (eq type 'reminder')}}
          <div class="reminder-note">
            💡 <strong>Reminder:</strong> You'll receive another email 24 hours before the meeting with the same joining details.
          </div>
          {{/unless}}
          
          <p style="margin-top: 30px; color: #4a5568;">
            {{#if (eq type 'reminder')}}
              See you tomorrow!
            {{else}}
              Looking forward to speaking with you!
            {{/if}}
          </p>
        </div>
        
        <div class="footer">
          <p>This event was scheduled via AI Outreach Platform</p>
          <p>
            <a href="#">Calendar Settings</a> • 
            <a href="#">Contact Support</a>
          </p>
          <p style="margin-top: 15px; font-size: 12px;">
            © 2024 AI Outreach Platform. All rights reserved.
          </p>
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
