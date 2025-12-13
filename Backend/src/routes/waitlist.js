import express from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../db/client.js';

const router = express.Router();

/**
 * POST /api/waitlist
 * Add student to waitlist
 */
router.post(
    '/',
    [
        body('name').trim().notEmpty().withMessage('Name is required'),
        body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
        body('phone').optional().trim(),
        body('university').optional().trim(),
        body('major').optional().trim(),
        body('graduationYear').optional().isInt({ min: 2020, max: 2030 }),
        body('country').optional().trim(),
        body('linkedIn').optional().isURL().withMessage('LinkedIn must be a valid URL')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const {
                name,
                email,
                phone,
                university,
                major,
                graduationYear,
                country,
                linkedIn
            } = req.body;

            // Check if student already exists
            const existingStudent = await prisma.student.findUnique({
                where: { email }
            });

            if (existingStudent) {
                return res.status(409).json({
                    error: 'Already registered',
                    message: 'This email is already on the waitlist'
                });
            }

            // Create new student
            const student = await prisma.student.create({
                data: {
                    name,
                    email,
                    phone,
                    university,
                    major,
                    graduationYear: graduationYear ? parseInt(graduationYear) : null,
                    country,
                    linkedIn,
                    status: 'waitlist'
                }
            });

            res.status(201).json({
                success: true,
                message: 'Successfully joined the waitlist!',
                data: {
                    id: student.id,
                    name: student.name,
                    email: student.email
                }
            });
        } catch (error) {
            console.error('Waitlist error:', error);
            res.status(500).json({
                error: 'Server error',
                message: 'Failed to join waitlist. Please try again.'
            });
        }
    }
);

/**
 * GET /api/waitlist/count
 * Get total waitlist count
 */
router.get('/count', async (req, res) => {
    try {
        const count = await prisma.student.count({
            where: { status: 'waitlist' }
        });

        res.json({
            count,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Count error:', error);
        res.status(500).json({
            error: 'Server error',
            message: 'Failed to fetch waitlist count'
        });
    }
});

/**
 * GET /api/waitlist/stats
 * Get waitlist statistics (optional - for landing page)
 */
router.get('/stats', async (req, res) => {
    try {
        const [total, byCountry, byGraduationYear] = await Promise.all([
            prisma.student.count({ where: { status: 'waitlist' } }),
            prisma.student.groupBy({
                by: ['country'],
                where: { status: 'waitlist', country: { not: null } },
                _count: true,
                orderBy: { _count: { country: 'desc' } },
                take: 10
            }),
            prisma.student.groupBy({
                by: ['graduationYear'],
                where: { status: 'waitlist', graduationYear: { not: null } },
                _count: true,
                orderBy: { graduationYear: 'asc' }
            })
        ]);

        res.json({
            total,
            topCountries: byCountry.map(item => ({
                country: item.country,
                count: item._count
            })),
            byGraduationYear: byGraduationYear.map(item => ({
                year: item.graduationYear,
                count: item._count
            }))
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({
            error: 'Server error',
            message: 'Failed to fetch statistics'
        });
    }
});

export default router;
