import dotenv from 'dotenv';

dotenv.config();

const config = {
    // Server
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT, 10) || 5000,
    API_PREFIX: process.env.API_PREFIX || '/api',

    // Database
    DATABASE_URL: process.env.DATABASE_URL,

    // Redis
    REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
    REDIS_HOST: process.env.REDIS_HOST || 'localhost',
    REDIS_PORT: parseInt(process.env.REDIS_PORT, 10) || 6379,

    // OpenAI
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',

    // Email
    EMAIL_SERVICE: process.env.EMAIL_SERVICE || 'smtp',
    SMTP: {
        HOST: process.env.SMTP_HOST,
        PORT: parseInt(process.env.SMTP_PORT, 10) || 587,
        USER: process.env.SMTP_USER,
        PASS: process.env.SMTP_PASS,
        FROM: process.env.SMTP_FROM,
        FROM_NAME: process.env.SMTP_FROM_NAME || 'AI Outreach Platform'
    },
    POSTMARK_API_KEY: process.env.POSTMARK_API_KEY,
    POSTMARK_FROM: process.env.POSTMARK_FROM,
    SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
    SENDGRID_FROM: process.env.SENDGRID_FROM,

    // Google Calendar
    GOOGLE: {
        CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
        CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
        REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
        REFRESH_TOKEN: process.env.GOOGLE_REFRESH_TOKEN
    },

    // JWT
    JWT_SECRET: process.env.JWT_SECRET || 'change-this-in-production',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

    // URLs
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
    BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:5000',

    // Scraping
    SCRAPING: {
        CONCURRENCY: parseInt(process.env.SCRAPING_CONCURRENCY, 10) || 3,
        RATE_LIMIT: parseInt(process.env.SCRAPING_RATE_LIMIT, 10) || 100,
        HEADLESS: process.env.SCRAPING_HEADLESS === 'true'
    },

    // Email Campaign
    EMAIL_CAMPAIGN: {
        BATCH_SIZE: parseInt(process.env.EMAIL_BATCH_SIZE, 10) || 50,
        RATE_LIMIT: parseInt(process.env.EMAIL_RATE_LIMIT, 10) || 100,
        RETRY_ATTEMPTS: parseInt(process.env.EMAIL_RETRY_ATTEMPTS, 10) || 3
    },

    // Meeting
    MEETING: {
        DURATION: parseInt(process.env.MEETING_DURATION, 10) || 30,
        BUFFER: parseInt(process.env.MEETING_BUFFER, 10) || 15,
        TIMEZONE: process.env.TIMEZONE || 'America/New_York'
    }
};

// Validation function
export function validateConfig() {
    const required = [
        'DATABASE_URL',
        'OPENAI_API_KEY'
    ];

    const missing = required.filter(key => {
        const keys = key.split('.');
        let value = config;
        for (const k of keys) {
            value = value[k];
            if (!value) return true;
        }
        return false;
    });

    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    return true;
}

export default config;
