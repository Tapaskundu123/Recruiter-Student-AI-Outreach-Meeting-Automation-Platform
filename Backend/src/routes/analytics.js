import express from 'express';
import prisma from '../db/client.js';

const router = express.Router();

/**
 * GET /api/analytics/dashboard
 * Get dashboard overview statistics
 */
router.get('/dashboard', async (req, res) => {
    try {
        const [
            totalRecruiters,
            totalStudents,
            totalCampaigns,
            totalMeetings,
            activeCampaigns,
            upcomingMeetings,
            recentScraping
        ] = await Promise.all([
            prisma.recruiter.count(),
            prisma.student.count(),
            prisma.campaign.count(),
            prisma.meeting.count(),
            prisma.campaign.count({ where: { status: { in: ['scheduled', 'sending'] } } }),
            prisma.meeting.count({
                where: {
                    scheduledTime: { gte: new Date() },
                    status: { in: ['scheduled', 'confirmed'] }
                }
            }),
            prisma.scrapingLog.count({
                where: {
                    startedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
                }
            })
        ]);

        // Campaign performance
        const campaignStats = await prisma.campaign.aggregate({
            _sum: {
                sentCount: true,
                openedCount: true,
                clickedCount: true
            },
            _avg: {
                openedCount: true,
                clickedCount: true
            }
        });

        res.json({
            overview: {
                totalRecruiters,
                totalStudents,
                waitlistCount: await prisma.student.count({ where: { status: 'waitlist' } }),
                totalCampaigns,
                totalMeetings,
                activeCampaigns,
                upcomingMeetings,
                recentScrapingJobs: recentScraping
            },
            campaignMetrics: {
                totalSent: campaignStats._sum.sentCount || 0,
                totalOpened: campaignStats._sum.openedCount || 0,
                totalClicked: campaignStats._sum.clickedCount || 0,
                avgOpenRate: campaignStats._sum.sentCount
                    ? ((campaignStats._sum.openedCount / campaignStats._sum.sentCount) * 100).toFixed(2)
                    : 0,
                avgClickRate: campaignStats._sum.sentCount
                    ? ((campaignStats._sum.clickedCount / campaignStats._sum.sentCount) * 100).toFixed(2)
                    : 0
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Dashboard analytics error:', error);
        res.status(500).json({
            error: 'Server error',
            message: 'Failed to fetch dashboard analytics'
        });
    }
});

/**
 * GET /api/analytics/campaigns
 * Get campaign performance analytics
 */
router.get('/campaigns', async (req, res) => {
    try {
        const campaigns = await prisma.campaign.findMany({
            where: { status: 'completed' },
            select: {
                id: true,
                name: true,
                targetAudience: true,
                sentCount: true,
                openedCount: true,
                clickedCount: true,
                bouncedCount: true,
                completedAt: true
            },
            orderBy: { completedAt: 'desc' },
            take: 20
        });

        const analyticsData = campaigns.map(campaign => ({
            ...campaign,
            openRate: campaign.sentCount
                ? ((campaign.openedCount / campaign.sentCount) * 100).toFixed(2)
                : 0,
            clickRate: campaign.sentCount
                ? ((campaign.clickedCount / campaign.sentCount) * 100).toFixed(2)
                : 0,
            bounceRate: campaign.sentCount
                ? ((campaign.bouncedCount / campaign.sentCount) * 100).toFixed(2)
                : 0
        }));

        res.json({
            data: analyticsData,
            summary: {
                totalCampaigns: campaigns.length,
                avgOpenRate: (
                    analyticsData.reduce((sum, c) => sum + parseFloat(c.openRate), 0) / campaigns.length
                ).toFixed(2),
                avgClickRate: (
                    analyticsData.reduce((sum, c) => sum + parseFloat(c.clickRate), 0) / campaigns.length
                ).toFixed(2)
            }
        });
    } catch (error) {
        console.error('Campaign analytics error:', error);
        res.status(500).json({
            error: 'Server error',
            message: 'Failed to fetch campaign analytics'
        });
    }
});

/**
 * GET /api/analytics/meetings
 * Get meeting statistics
 */
router.get('/meetings', async (req, res) => {
    try {
        const [
            totalScheduled,
            completed,
            cancelled,
            noShows,
            upcoming
        ] = await Promise.all([
            prisma.meeting.count(),
            prisma.meeting.count({ where: { status: 'completed' } }),
            prisma.meeting.count({ where: { status: 'cancelled' } }),
            prisma.meeting.count({ where: { status: 'no-show' } }),
            prisma.meeting.count({
                where: {
                    scheduledTime: { gte: new Date() },
                    status: { in: ['scheduled', 'confirmed'] }
                }
            })
        ]);

        const completionRate = totalScheduled
            ? ((completed / totalScheduled) * 100).toFixed(2)
            : 0;

        const noShowRate = totalScheduled
            ? ((noShows / totalScheduled) * 100).toFixed(2)
            : 0;

        res.json({
            stats: {
                totalScheduled,
                completed,
                cancelled,
                noShows,
                upcoming,
                completionRate: parseFloat(completionRate),
                noShowRate: parseFloat(noShowRate)
            }
        });
    } catch (error) {
        console.error('Meeting analytics error:', error);
        res.status(500).json({
            error: 'Server error',
            message: 'Failed to fetch meeting analytics'
        });
    }
});

/**
 * GET /api/analytics/scraping
 * Get scraping performance analytics
 */
router.get('/scraping', async (req, res) => {
    try {
        const logs = await prisma.scrapingLog.findMany({
            where: {
                startedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
            },
            orderBy: { startedAt: 'desc' }
        });

        const byType = {
            recruiter: logs.filter(l => l.jobType === 'recruiter'),
            student: logs.filter(l => l.jobType === 'student')
        };

        const summary = {
            total: logs.length,
            completed: logs.filter(l => l.status === 'completed').length,
            failed: logs.filter(l => l.status === 'failed').length,
            running: logs.filter(l => l.status === 'running').length,
            totalRecordsFound: logs.reduce((sum, l) => sum + l.recordsFound, 0),
            totalRecordsSaved: logs.reduce((sum, l) => sum + l.recordsSaved, 0)
        };

        res.json({
            summary,
            byType: {
                recruiter: {
                    total: byType.recruiter.length,
                    recordsFound: byType.recruiter.reduce((sum, l) => sum + l.recordsFound, 0),
                    recordsSaved: byType.recruiter.reduce((sum, l) => sum + l.recordsSaved, 0)
                },
                student: {
                    total: byType.student.length,
                    recordsFound: byType.student.reduce((sum, l) => sum + l.recordsFound, 0),
                    recordsSaved: byType.student.reduce((sum, l) => sum + l.recordsSaved, 0)
                }
            },
            recentLogs: logs.slice(0, 10)
        });
    } catch (error) {
        console.error('Scraping analytics error:', error);
        res.status(500).json({
            error: 'Server error',
            message: 'Failed to fetch scraping analytics'
        });
    }
});

export default router;
