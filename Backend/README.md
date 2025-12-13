# AI Outreach Platform - Backend

Backend server for the Recruiter-Student AI Outreach & Meeting Automation Platform.

## 🚀 Features

- **RESTful API** with Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Job Queue**: Bull with Redis for background tasks
- **AI Integration**: OpenAI GPT for data cleaning and personalization
- **Web Scraping**: Playwright for recruiter/student data collection
- **Email Automation**: Nodemailer with SMTP/Postmark/SendGrid support
- **Calendar Integration**: Google Calendar API with Google Meet
- **Real-time Analytics**: Campaign and meeting performance tracking

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Redis server
- OpenAI API key
- Google Cloud project with Calendar API enabled
- SMTP email credentials (Gmail, Postmark, or SendGrid)

## 🛠️ Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your credentials:
   - DATABASE_URL
   - REDIS_URL
   - OPENAI_API_KEY
   - SMTP credentials or Postmark/SendGrid API keys
   - Google Calendar API credentials

3. **Set up database:**
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

4. **Start Redis** (if running locally):
   ```bash
   redis-server
   ```

## 🏃 Running the Application

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

The server will start on `http://localhost:5000` (or your configured PORT).

## 📁 Project Structure

```
Backend/
├── src/
│   ├── server.js              # Express app entry point
│   ├── config/                # Configuration management
│   ├── db/                    # Database client
│   ├── routes/                # API route handlers
│   │   ├── waitlist.js
│   │   ├── scrapers.js
│   │   ├── campaigns.js
│   │   ├── meetings.js
│   │   ├── analytics.js
│   │   └── admin.js
│   ├── jobs/                  # Bull job processors
│   │   ├── scrapingJobs.js
│   │   ├── emailJobs.js
│   │   └── meetingJobs.js
│   ├── scrapers/              # Web scraping services
│   │   ├── base.js
│   │   ├── recruiterScraper.js
│   │   └── studentScraper.js
│   ├── ai/                    # AI/ML services
│   │   ├── dataCleaner.js
│   │   ├── emailPersonalizer.js
│   │   └── dataEnricher.js
│   ├── email/                 # Email services
│   │   ├── emailClient.js
│   │   └── templates.js
│   ├── calendar/              # Calendar integration
│   │   ├── googleCalendar.js
│   │   └── scheduler.js
│   └── queue/                 # Bull queue setup
└── prisma/
    └── schema.prisma          # Database schema
```

## 🔌 API Endpoints

### Public Endpoints
- `GET /health` - Health check
- `POST /api/waitlist` - Join waitlist
- `GET /api/waitlist/count` - Get waitlist count

### Scraper Endpoints
- `POST /api/scrapers/recruiters` - Start recruiter scraping
- `POST /api/scrapers/students` - Start student scraping
- `GET /api/scrapers/status/:logId` - Get scraping status
- `GET /api/scrapers/logs` - List scraping logs

### Campaign Endpoints
- `POST /api/campaigns` - Create campaign
- `GET /api/campaigns` - List campaigns
- `GET /api/campaigns/:id` - Get campaign details
- `PATCH /api/campaigns/:id` - Update campaign
- `POST /api/campaigns/:id/send` - Send campaign
- `DELETE /api/campaigns/:id` - Delete campaign

### Meeting Endpoints
- `POST /api/meetings` - Schedule meeting
- `GET /api/meetings` - List meetings
- `GET /api/meetings/:id` - Get meeting details
- `PATCH /api/meetings/:id` - Update meeting
- `DELETE /api/meetings/:id` - Cancel meeting

### Analytics Endpoints
- `GET /api/analytics/dashboard` - Dashboard statistics
- `GET /api/analytics/campaigns` - Campaign performance
- `GET /api/analytics/meetings` - Meeting statistics
- `GET /api/analytics/scraping` - Scraping performance

### Admin Endpoints
- `GET /api/admin/recruiters` - List recruiters
- `GET /api/admin/students` - List students
- `POST /api/admin/export/recruiters` - Export recruiters
- `POST /api/admin/export/students` - Export students
- `DELETE /api/admin/recruiters/:id` - Delete recruiter
- `DELETE /api/admin/students/:id` - Delete student

## 🔐 Google Calendar Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google Calendar API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs
6. Get your refresh token using the OAuth playground
7. Add credentials to `.env`

## 📧 Email Configuration

### SMTP (Gmail)
1. Enable 2FA on your Google account
2. Generate an App Password
3. Use it in `.env` as `SMTP_PASS`

### Postmark
1. Sign up at [Postmark](https://postmarkapp.com/)
2. Get your Server API Token
3. Add to `.env` as `POSTMARK_API_KEY`

### SendGrid
1. Sign up at [SendGrid](https://sendgrid.com/)
2. Create an API key
3. Add to `.env` as `SENDGRID_API_KEY`

## 🛡️ Security Notes

- Always use HTTPS in production
- Keep API keys secure and never commit `.env`
- Implement authentication for admin endpoints
- Rate limit public endpoints
- Validate and sanitize all inputs

## 📝 License

MIT
