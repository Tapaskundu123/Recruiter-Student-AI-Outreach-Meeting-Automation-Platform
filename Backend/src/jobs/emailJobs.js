import { emailQueue } from '../queue/index.js';
import prisma from '../db/client.js';
import { sendEmail } from '../email/emailClient.js';
import { personalizeEmail } from '../ai/emailPersonalizer.js';

/**
 * Add email campaign job to queue
 */
export async function addEmailCampaignJob(data) {
    const delay = data.scheduledAt
        ? new Date(data.scheduledAt).getTime() - Date.now()
        : 0;

    return emailQueue.add('send-campaign', data, {
        delay: delay > 0 ? delay : 0,
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 10000
        }
    });
}

/**
 * Process email campaign jobs
 */
emailQueue.process('send-campaign', async (job) => {
    const { campaignId } = job.data;

    try {
        job.log(`Starting campaign ${campaignId}`);

        const campaign = await prisma.campaign.findUnique({
            where: { id: campaignId }
        });

        if (!campaign) {
            throw new Error('Campaign not found');
        }

        // Get recipients based on target audience
        let recruiters = [];
        let students = [];

        if (campaign.targetAudience === 'recruiters' || campaign.targetAudience === 'both') {
            recruiters = await prisma.recruiter.findMany({
                where: { status: 'active' }
            });
        }

        if (campaign.targetAudience === 'students' || campaign.targetAudience === 'both') {
            students = await prisma.student.findMany({
                where: { status: 'waitlist' }
            });
        }

        const totalRecipients = recruiters.length + students.length;
        job.log(`Found ${totalRecipients} recipients`);

        // Update campaign
        await prisma.campaign.update({
            where: { id: campaignId },
            data: {
                status: 'sending',
                totalRecipients
            }
        });

        let sentCount = 0;
        let deliveredCount = 0;
        let bouncedCount = 0;

        // Send to recruiters
        for (const recruiter of recruiters) {
            try {
                // Personalize email using AI
                const personalizedContent = await personalizeEmail({
                    template: campaign.template,
                    recipientData: {
                        name: recruiter.name,
                        email: recruiter.email,
                        company: recruiter.company,
                        jobTitle: recruiter.jobTitle
                    }
                });

                // Send email
                const result = await sendEmail({
                    to: recruiter.email,
                    subject: campaign.subject,
                    html: personalizedContent
                });

                // Track in database
                await prisma.campaignRecipient.create({
                    data: {
                        campaignId,
                        recipientType: 'recruiter',
                        recruiterId: recruiter.id,
                        personalizedContent,
                        sentAt: new Date(),
                        status: result.success ? 'sent' : 'failed'
                    }
                });

                if (result.success) {
                    sentCount++;
                    deliveredCount++;
                }
            } catch (error) {
                job.log(`Error sending to ${recruiter.email}: ${error.message}`);
                bouncedCount++;
            }

            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        // Send to students
        for (const student of students) {
            try {
                const personalizedContent = await personalizeEmail({
                    template: campaign.template,
                    recipientData: {
                        name: student.name,
                        email: student.email,
                        university: student.university,
                        major: student.major
                    }
                });

                const result = await sendEmail({
                    to: student.email,
                    subject: campaign.subject,
                    html: personalizedContent
                });

                await prisma.campaignRecipient.create({
                    data: {
                        campaignId,
                        recipientType: 'student',
                        studentId: student.id,
                        personalizedContent,
                        sentAt: new Date(),
                        status: result.success ? 'sent' : 'failed'
                    }
                });

                if (result.success) {
                    sentCount++;
                    deliveredCount++;
                }
            } catch (error) {
                job.log(`Error sending to ${student.email}: ${error.message}`);
                bouncedCount++;
            }

            await new Promise(resolve => setTimeout(resolve, 200));
        }

        // Update campaign with final stats
        await prisma.campaign.update({
            where: { id: campaignId },
            data: {
                status: 'completed',
                sentCount,
                deliveredCount,
                bouncedCount,
                completedAt: new Date()
            }
        });

        job.log(`Campaign completed: ${sentCount} sent, ${deliveredCount} delivered`);

        return {
            success: true,
            sentCount,
            deliveredCount,
            bouncedCount
        };
    } catch (error) {
        await prisma.campaign.update({
            where: { id: campaignId },
            data: { status: 'failed' }
        });

        throw error;
    }
});

export default {
    addEmailCampaignJob
};
