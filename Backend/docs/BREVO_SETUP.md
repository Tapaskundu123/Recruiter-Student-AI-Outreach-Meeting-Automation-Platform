# Brevo SMTP Setup Guide

Complete guide for configuring Brevo (formerly Sendinblue) SMTP to send meeting confirmation emails.

## Prerequisites

- Active Brevo account (free tier available)
- Verified sender email address
- Node.js backend running

## Step 1: Create Brevo Account

1. Visit [Brevo](https://www.brevo.com) and sign up
2. Verify your email address
3. Complete the onboarding process

## Step 2: Verify Sender Email

Before sending emails, you must verify your sender email address:

1. Log in to Brevo dashboard
2. Navigate to **Settings** → **Senders & IP**
3. Click **Add a Sender**
4. Enter your email address and display name
5. Click the verification link sent to your email

## Step 3: Get SMTP Credentials

1. In Brevo dashboard, navigate to **Settings** → **SMTP & API**
2. Click on **SMTP** tab
3. You'll see your SMTP credentials:
   - **SMTP Server**: `smtp-relay.brevo.com`
   - **Port**: `587` (recommended) or `465`
   - **Login**: Your Brevo account email
   - **SMTP Key**: Click "Generate SMTP key" if you don't have one

## Step 4: Configure Environment Variables

Update your `.env` file with Brevo credentials:

```bash
# Email Service - Brevo SMTP
EMAIL_SERVICE=smtp
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your_brevo_email@example.com
SMTP_PASS=your_brevo_smtp_key_here
SMTP_FROM=your_verified_sender@example.com
SMTP_FROM_NAME=AI Outreach Platform
```

### Important Notes:

- `SMTP_USER`: Your Brevo account login email
- `SMTP_PASS`: The SMTP key from Step 3 (NOT your account password)
- `SMTP_FROM`: Must be a verified sender email (from Step 2)
- `SMTP_FROM_NAME`: Display name shown to recipients

## Step 5: Test Configuration

### Restart Backend Server

```bash
cd Backend
npm start
```

You should see:
```
📧 Initializing Brevo SMTP transporter...
   Host: smtp-relay.brevo.com
   Port: 587
   User: your_email@example.com
   From: your_email@example.com
✅ Brevo SMTP configuration verified successfully!
   Ready to send meeting confirmation emails
```

### Test Meeting Confirmation Email

Run the test script:

```bash
node scripts/testBrevoEmail.js
```

## Verify Email Delivery

### Check Brevo Dashboard

1. Navigate to **Statistics** → **Email Activity**
2. View sent emails in real-time
3. Track delivery status, opens, and clicks

### Check Email Logs

The backend will log each email sent:

```
✅ Email sent via Brevo SMTP
   To: recipient@example.com
   Subject: Meeting Confirmed: Technical Interview
   Message ID: <message-id@brevo.com>
```

## Brevo Free Tier Limits

- **300 emails/day**
- Unlimited email addresses
- All features included
- Brevo branding in emails (can be removed with paid plan)

For production use with higher volume, consider upgrading to a paid plan.

## Troubleshooting

### Error: "Invalid credentials"

- Verify `SMTP_USER` is your Brevo login email
- Ensure `SMTP_PASS` is the SMTP key (not account password)
- Regenerate SMTP key if needed

### Error: "Sender not verified"

- Check sender email is verified in Brevo dashboard
- Ensure `SMTP_FROM` matches a verified sender

### Email not received

1. Check spam/junk folder
2. Verify email in Brevo dashboard statistics
3. Check recipient email address is correct
4. Ensure Brevo account is active

### Connection timeout

- Check firewall allows outbound connections on port 587
- Try port 465 with `secure: true`
- Verify network connectivity

## API Endpoint Testing

### Using cURL

```bash
curl -X POST http://localhost:5000/api/admin/confirm-meeting \
  -H "Content-Type: application/json" \
  -d '{
    "availabilitySlotId": "valid-slot-uuid",
    "studentId": "valid-student-uuid",
    "agenda": "Technical interview discussion"
  }'
```

### Expected Response

```json
{
  "success": true,
  "meeting": {
    "id": "meeting-uuid",
    "title": "Meeting Discussion",
    "scheduledTime": "2024-12-20T10:00:00.000Z",
    "duration": 30,
    "googleMeetLink": "https://meet.google.com/xxx-xxxx-xxx",
    "recruiter": {
      "name": "John Recruiter",
      "email": "recruiter@company.com"
    },
    "student": {
      "name": "Jane Student",
      "email": "student@university.edu"
    }
  }
}
```

## Email Flow

When admin confirms a meeting:

1. **Immediate Confirmation**
   - Both recruiter and student receive confirmation emails
   - Email includes meeting time, Google Meet link, and agenda
   
2. **24-Hour Reminder**
   - Sent 24 hours before meeting
   - Same email template with "Reminder" subject
   
3. **1-Hour Reminder**
   - Sent 1 hour before meeting
   - Final reminder with meeting link

## Support

- **Brevo Support**: https://help.brevo.com
- **SMTP Documentation**: https://developers.brevo.com/docs/send-emails-through-smtp
- **API Rate Limits**: https://developers.brevo.com/docs/api-limits

## Security Best Practices

1. Never commit `.env` file to version control
2. Use strong SMTP keys
3. Rotate SMTP keys periodically
4. Monitor email sending activity in Brevo dashboard
5. Enable 2FA on Brevo account
