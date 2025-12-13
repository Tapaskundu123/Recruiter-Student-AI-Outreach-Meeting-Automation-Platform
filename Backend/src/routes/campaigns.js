import express from 'express';
import { body, query, param, validationResult } from 'express-validator';
import prisma from '../db/client.js';
import { addEmailCampaignJob } from '../jobs/emailJobs.js';

const router = express.Router();

/**
 * POST /api/campaigns
 * Create new email campaign
 */
router.post(
    '/',
    [
        body('name').trim().notEmpty().withMessage('Campaign name is required'),
        body('targetAudience')
            .isIn(['recruiters', 'students', 'both'])
            .withMessage('Invalid target audience'),
        body('subject').trim().notEmpty().withMessage('Email subject is required'),
        body('template').trim().notEmpty().withMessage('Email template is required'),
        body('scheduledAt').optional().isISO8601().withMessage('Invalid schedule date')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { name, targetAudience, subject, template, scheduledAt } = req.body;

            const campaign = await prisma.campaign.create({
                data: {
                    name,
                    targetAudience,
                    subject,
                    template,
                    scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
                    status: scheduledAt ? 'scheduled' : 'draft'
                }
            });

            // If scheduled, add to job queue
            if (scheduledAt) {
                await addEmailCampaignJob({
                    campaignId: campaign.id,
                    scheduledAt: new Date(scheduledAt)
                });
            }

            res.status(201).json({
                success: true,
                message: 'Campaign created successfully',
                data: campaign
            });
        } catch (error) {
            console.error('Campaign creation error:', error);
            res.status(500).json({
                error: 'Server error',
                message: 'Failed to create campaign'
            });
        }
    }
);

/**
 * GET /api/campaigns
 * List all campaigns with pagination
 */
router.get(
    '/',
    [
        query('page').optional().isInt({ min: 1 }),
        query('limit').optional().isInt({ min: 1, max: 100 }),
        query('status').optional().isIn(['draft', 'scheduled', 'sending', 'completed', 'paused'])
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const skip = (page - 1) * limit;
            const status = req.query.status;

            const where = status ? { status } : {};

            const [campaigns, total] = await Promise.all([
                prisma.campaign.findMany({
                    where,
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: limit,
                    include: {
                        _count: {
                            select: { recipients: true }
                        }
                    }
                }),
                prisma.campaign.count({ where })
            ]);

            res.json({
                data: campaigns,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            console.error('Campaigns fetch error:', error);
            res.status(500).json({
                error: 'Server error',
                message: 'Failed to fetch campaigns'
            });
        }
    }
);

/**
 * GET /api/campaigns/:id
 * Get campaign details
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const campaign = await prisma.campaign.findUnique({
            where: { id },
            include: {
                recipients: {
                    take: 100,
                    orderBy: { createdAt: 'desc' }
                },
                _count: {
                    select: { recipients: true }
                }
            }
        });

        if (!campaign) {
            return res.status(404).json({
                error: 'Not found',
                message: 'Campaign not found'
            });
        }

        res.json(campaign);
    } catch (error) {
        console.error('Campaign fetch error:', error);
        res.status(500).json({
            error: 'Server error',
            message: 'Failed to fetch campaign'
        });
    }
});

/**
 * PATCH /api/campaigns/:id
 * Update campaign
 */
router.patch(
    '/:id',
    [
        body('name').optional().trim(),
        body('subject').optional().trim(),
        body('template').optional().trim(),
        body('status')
            .optional()
            .isIn(['draft', 'scheduled', 'sending', 'completed', 'paused'])
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { id } = req.params;
            const updates = req.body;

            const campaign = await prisma.campaign.update({
                where: { id },
                data: updates
            });

            res.json({
                success: true,
                message: 'Campaign updated successfully',
                data: campaign
            });
        } catch (error) {
            if (error.code === 'P2025') {
                return res.status(404).json({
                    error: 'Not found',
                    message: 'Campaign not found'
                });
            }
            console.error('Campaign update error:', error);
            res.status(500).json({
                error: 'Server error',
                message: 'Failed to update campaign'
            });
        }
    }
);

/**
 * POST /api/campaigns/:id/send
 * Send campaign immediately
 */
router.post('/:id/send', async (req, res) => {
    try {
        const { id } = req.params;

        const campaign = await prisma.campaign.findUnique({
            where: { id }
        });

        if (!campaign) {
            return res.status(404).json({
                error: 'Not found',
                message: 'Campaign not found'
            });
        }

        if (campaign.status === 'sending' || campaign.status === 'completed') {
            return res.status(400).json({
                error: 'Invalid status',
                message: 'Campaign is already being sent or completed'
            });
        }

        // Update status and add to queue
        await prisma.campaign.update({
            where: { id },
            data: { status: 'sending' }
        });

        await addEmailCampaignJob({
            campaignId: id,
            immediate: true
        });

        res.json({
            success: true,
            message: 'Campaign is being sent'
        });
    } catch (error) {
        console.error('Campaign send error:', error);
        res.status(500).json({
            error: 'Server error',
            message: 'Failed to send campaign'
        });
    }
});

/**
 * DELETE /api/campaigns/:id
 * Delete campaign
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.campaign.delete({
            where: { id }
        });

        res.json({
            success: true,
            message: 'Campaign deleted successfully'
        });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({
                error: 'Not found',
                message: 'Campaign not found'
            });
        }
        console.error('Campaign delete error:', error);
        res.status(500).json({
            error: 'Server error',
            message: 'Failed to delete campaign'
        });
    }
});

export default router;
