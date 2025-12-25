import express from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../db/client.js';

const router = express.Router();

/**
 * POST /api/availability/mark
 * Recruiter marks their availability (no student assigned yet)
 */
router.post('/mark',
    [
        body('recruiterId').isUUID().withMessage('Valid recruiter ID required'),
        body('startTime').isISO8601().withMessage('Valid start time required'),
        body('endTime').isISO8601().withMessage('Valid end time required'),
        body('duration').isInt({ min: 15, max: 240 }).withMessage('Duration must be between 15 and 240 minutes')
    ],
    async (req, res) => {
        try {
            // detailed logging
            console.log('Received availability request:', req.body);

            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                console.log('Validation errors:', errors.array());
                return res.status(400).json({
                    error: 'Validation failed',
                    details: errors.array()
                });
            }

            const {
                recruiterId,
                startTime,
                endTime,
                duration,
                timezone
            } = req.body;

            console.log('Checking recruiter:', recruiterId);

            // Verify recruiter exists
            const recruiter = await prisma.recruiter.findUnique({
                where: { id: recruiterId }
            });

            if (!recruiter) {
                console.log('Recruiter not found');
                return res.status(404).json({ error: 'Recruiter not found' });
            }

            console.log('Creating availability slot...');
           const availability = await prisma.availabilitySlot.create({
                data: {
                    recruiterId,
                    startTime: new Date(startTime),
                    endTime: new Date(endTime),
                    duration,
                    timezone: timezone || 'America/New_York',
                    status: 'pending'
                },
                include: {
                    recruiter: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    }
                }
            });

            res.json({
                success: true,
                availability: {
                    id: availability.id,
                    recruiterId: availability.recruiterId,
                    recruiterName: recruiter.name,
                    recruiterEmail: recruiter.email,
                    startTime: availability.startTime,
                    endTime: availability.endTime,
                    duration: availability.duration,
                    status: availability.status
                }
            });

        } catch (error) {
            console.error('Availability marking error:', error);
            res.status(500).json({
                error: 'Failed to mark availability',
                message: error.message
            });
        }
    }
);

/**
 * GET /api/availability/pending
 * Get all pending availability slots (for admin panel)
 */
router.get('/pending', async (req, res) => {
    try {
        const availabilitySlots = await prisma.availabilitySlot.findMany({
            where: {
                status: 'pending'
            },
            include: {
                recruiter: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        company: true
                    }
                }
            },
            orderBy: {
                startTime: 'asc'
            }
        });

        res.json({
            success: true,
            slots: availabilitySlots
        });

    } catch (error) {
        console.error('Error fetching pending slots:', error);
        res.status(500).json({
            error: 'Failed to fetch availability slots',
            message: error.message
        });
    }
});

/**
 * GET /api/availability/recruiter/:recruiterId
 * Get all availability slots for a specific recruiter
 */
router.get('/recruiter/:recruiterId', async (req, res) => {
    try {
        const { recruiterId } = req.params;

        console.log('Fetching availability for', recruiterId);

        // Get all availability slots for this recruiter
        const availabilities = await prisma.availabilitySlot.findMany({
            where: {
                recruiterId
            },
            include: {
                meeting: {
                    include: {
                        student: true
                    }
                }
            },
            orderBy: {
                startTime: 'asc'
            }
        });

        res.json({
            success: true,
            availabilities
        });

    } catch (error) {
        console.error('Error fetching recruiter slots:', error);
        res.status(500).json({
            error: 'Failed to fetch recruiter availability',
            message: error.message
        });
    }
});

export default router;
