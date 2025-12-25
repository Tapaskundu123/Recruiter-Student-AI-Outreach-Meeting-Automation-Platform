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
            totalEmailTemplates
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
            prisma.emailTemplate.count()
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
                totalEmailTemplates
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
 * Get campaign performance analytics with optional date range
 */
router.get('/campaigns', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // Build where clause with date filtering
        const whereClause = { status: 'completed' };
        if (startDate || endDate) {
            whereClause.completedAt = {};
            if (startDate) whereClause.completedAt.gte = new Date(startDate);
            if (endDate) whereClause.completedAt.lte = new Date(endDate);
        }

        const campaigns = await prisma.campaign.findMany({
            where: whereClause,
            select: {
                id: true,
                name: true,
                targetAudience: true,
                sentCount: true,
                openedCount: true,
                clickedCount: true,
                bouncedCount: true,
                completedAt: true,
                createdAt: true
            },
            orderBy: { completedAt: 'desc' },
            take: 50
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
                avgOpenRate: campaigns.length > 0
                    ? (analyticsData.reduce((sum, c) => sum + parseFloat(c.openRate), 0) / campaigns.length).toFixed(2)
                    : '0',
                avgClickRate: campaigns.length > 0
                    ? (analyticsData.reduce((sum, c) => sum + parseFloat(c.clickRate), 0) / campaigns.length).toFixed(2)
                    : '0'
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
 * GET /api/analytics/leads
 * Get CSV upload (leads) analytics - replaces scraping analytics
 */
router.get('/leads', async (req, res) => {
    try {
        const [totalRecruiters, totalStudents, totalEmailTemplates] = await Promise.all([
            prisma.recruiter.count(),
            prisma.student.count(),
            prisma.emailTemplate.count()
        ]);

        const summary = {
            totalRecruiters,
            totalStudents,
            totalLeads: totalRecruiters + totalStudents,
            totalEmailTemplates
        };

        res.json({
            summary,
            byType: {
                recruiter: {
                    total: totalRecruiters,
                    recordsSaved: totalRecruiters
                },
                student: {
                    total: totalStudents,
                    recordsSaved: totalStudents
                }
            },
            templates: {
                total: totalEmailTemplates
            }
        });
    } catch (error) {
        console.error('Leads analytics error:', error);
        res.status(500).json({
            error: 'Server error',
            message: 'Failed to fetch leads analytics'
        });
    }
});

/**
 * GET /api/analytics/trends
 * Get time-series trends for campaigns
 */
router.get('/trends', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const whereClause = {};
        if (startDate || endDate) {
            whereClause.completedAt = {};
            if (startDate) whereClause.completedAt.gte = new Date(startDate);
            if (endDate) whereClause.completedAt.lte = new Date(endDate);
        }

        const campaigns = await prisma.campaign.findMany({
            where: {
                ...whereClause,
                status: 'completed'
            },
            select: {
                completedAt: true,
                sentCount: true,
                openedCount: true,
                clickedCount: true
            },
            orderBy: { completedAt: 'asc' }
        });

        // Group by day
        const trendData = campaigns.reduce((acc, campaign) => {
            const date = new Date(campaign.completedAt).toISOString().split('T')[0];
            if (!acc[date]) {
                acc[date] = {
                    date,
                    sent: 0,
                    opened: 0,
                    clicked: 0
                };
            }
            acc[date].sent += campaign.sentCount;
            acc[date].opened += campaign.openedCount;
            acc[date].clicked += campaign.clickedCount;
            return acc;
        }, {});

        const trends = Object.values(trendData).map(day => ({
            ...day,
            openRate: day.sent > 0 ? ((day.opened / day.sent) * 100).toFixed(2) : 0,
            clickRate: day.sent > 0 ? ((day.clicked / day.sent) * 100).toFixed(2) : 0
        }));

        res.json({ data: trends });
    } catch (error) {
        console.error('Trends analytics error:', error);
        res.status(500).json({
            error: 'Server error',
            message: 'Failed to fetch trends analytics'
        });
    }
});

/**
 * GET /api/analytics/engagement-heatmap
 * Get email engagement patterns by day and hour
 */
router.get('/engagement-heatmap', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const whereClause = { status: 'completed' };
        if (startDate || endDate) {
            whereClause.completedAt = {};
            if (startDate) whereClause.completedAt.gte = new Date(startDate);
            if (endDate) whereClause.completedAt.lte = new Date(endDate);
        }

        const campaigns = await prisma.campaign.findMany({
            where: whereClause,
            select: {
                completedAt: true,
                openedCount: true,
                clickedCount: true
            }
        });

        // Create heatmap data structure (7 days × 24 hours)
        const heatmap = Array(7).fill(null).map(() => Array(24).fill(0));

        campaigns.forEach(campaign => {
            const date = new Date(campaign.completedAt);
            const day = date.getDay(); // 0-6 (Sunday-Saturday)
            const hour = date.getHours(); // 0-23
            heatmap[day][hour] += campaign.openedCount + campaign.clickedCount;
        });

        const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const formattedData = heatmap.map((dayData, dayIndex) => ({
            day: dayLabels[dayIndex],
            hours: dayData
        }));

        res.json({ data: formattedData });
    } catch (error) {
        console.error('Engagement heatmap error:', error);
        res.status(500).json({
            error: 'Server error',
            message: 'Failed to fetch engagement heatmap'
        });
    }
});

export default router;
