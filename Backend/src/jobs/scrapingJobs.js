import { scrapingQueue } from '../queue/index.js';
import prisma from '../db/client.js';
import RecruiterScraper from '../scrapers/recruiterScraper.js';
import StudentScraper from '../scrapers/studentScraper.js';
import { cleanAndEnrichData } from '../ai/dataCleaner.js';

/**
 * Add scraping job to queue
 */
export async function addScrapingJob(data) {
    return scrapingQueue.add('scrape', data, {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 5000
        },
        removeOnComplete: 100,
        removeOnFail: 50
    });
}

/**
 * Process scraping jobs
 */
scrapingQueue.process('scrape', async (job) => {
    const { type, logId, target, countries, fields } = job.data;

    try {
        job.log(`Starting ${type} scraping for ${target}`);

        let scraper;
        let rawData;

        if (type === 'recruiter') {
            scraper = new RecruiterScraper();
            rawData = await scraper.scrape({ target, countries, fields });
        } else if (type === 'student') {
            scraper = new StudentScraper();
            rawData = await scraper.scrape({ target, countries });
        } else {
            throw new Error(`Unknown scraper type: ${type}`);
        }

        job.log(`Found ${rawData.length} records`);
        await job.progress(30);

        // Clean and enrich data using AI
        job.log('Cleaning and enriching data with AI...');
        const cleanedData = await cleanAndEnrichData(rawData, type);
        await job.progress(60);

        // Save to database
        job.log('Saving to database...');
        let savedCount = 0;

        for (const record of cleanedData) {
            try {
                if (type === 'recruiter') {
                    await prisma.recruiter.upsert({
                        where: { email: record.email },
                        update: record,
                        create: record
                    });
                } else {
                    await prisma.student.upsert({
                        where: { email: record.email },
                        update: record,
                        create: record
                    });
                }
                savedCount++;
            } catch (error) {
                job.log(`Error saving record: ${error.message}`);
            }
        }

        await job.progress(100);

        // Update scraping log
        await prisma.scrapingLog.update({
            where: { id: logId },
            data: {
                status: 'completed',
                recordsFound: rawData.length,
                recordsSaved: savedCount,
                completedAt: new Date()
            }
        });

        job.log(`Completed: ${savedCount} records saved`);

        return {
            success: true,
            recordsFound: rawData.length,
            recordsSaved: savedCount
        };
    } catch (error) {
        // Update log with error
        await prisma.scrapingLog.update({
            where: { id: logId },
            data: {
                status: 'failed',
                errors: { message: error.message, stack: error.stack },
                completedAt: new Date()
            }
        });

        throw error;
    }
});

export default {
    addScrapingJob
};
