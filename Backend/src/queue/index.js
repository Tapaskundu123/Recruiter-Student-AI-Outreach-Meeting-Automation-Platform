import Queue from 'bull';
import config from '../config/index.js';

// Initialize Redis connection for Bull
const redisConfig = {
    redis: {
        host: config.REDIS_HOST,
        port: config.REDIS_PORT
    }
};

// Create queues
export const scrapingQueue = new Queue('scraping-jobs', redisConfig);
export const emailQueue = new Queue('email-jobs', redisConfig);
export const meetingQueue = new Queue('meeting-jobs', redisConfig);

// Queue event handlers
scrapingQueue.on('completed', (job, result) => {
    console.log(`Scraping job ${job.id} completed`);
});

scrapingQueue.on('failed', (job, err) => {
    console.error(`Scraping job ${job.id} failed:`, err.message);
});

emailQueue.on('completed', (job, result) => {
    console.log(`Email job ${job.id} completed`);
});

emailQueue.on('failed', (job, err) => {
    console.error(`Email job ${job.id} failed:`, err.message);
});

meetingQueue.on('completed', (job, result) => {
    console.log(`Meeting job ${job.id} completed`);
});

meetingQueue.on('failed', (job, err) => {
    console.error(`Meeting job ${job.id} failed:`, err.message);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    await Promise.all([
        scrapingQueue.close(),
        emailQueue.close(),
        meetingQueue.close()
    ]);
});

export default {
    scrapingQueue,
    emailQueue,
    meetingQueue
};
