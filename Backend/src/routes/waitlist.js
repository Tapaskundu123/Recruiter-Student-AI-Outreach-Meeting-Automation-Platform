import express from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../db/client.js';
import { sendWelcomeEmail } from '../email/emailClient.js';

const router = express.Router();

/**
 * POST /api/waitlist
 * Add student to waitlist + send confirmation email
 */
router.post(
    '/',
    [
        body('name').trim().notEmpty().withMessage('Name is required'),
        body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
        body('phone').optional({ checkFalsy: true }).trim(),
        body('university').optional({ checkFalsy: true }).trim(),
        body('major').optional({ checkFalsy: true }).trim(),
        body('graduationYear').optional({ checkFalsy: true }).isInt({ min: 2020, max: 2035 }).toInt(),
        body('country').optional({ checkFalsy: true }).trim(),
        body('linkedin').optional({ checkFalsy: true }).isURL({ require_protocol: true }).withMessage('Valid LinkedIn URL required'),
        body('github').optional({ checkFalsy: true }).isURL({ require_protocol: true }).withMessage('Valid GitHub URL required')
    ],
    async (req, res) => {
        console.log('Waitlist execution body:', req.body);
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('Waitlist validation errors:', errors.array());
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
            linkedin, // Fixed key name to match frontend (was 'linkedIn' in old code)
            github
        } = req.body;

        try {
            // Check for duplicate email
            const existingStudent = await prisma.student.findUnique({
                where: { email }
            });

            if (existingStudent) {
                return res.status(409).json({
                    error: 'Already registered',
                    message: 'This email is already on the waitlist'
                });
            }

            // Create student in database
            const student = await prisma.student.create({
                data: {
                    name,
                    email,
                    phone: phone || null,
                    university: university || null,
                    major: major || null,
                    graduationYear: graduationYear || null,
                    country: country || null,
                    linkedIn: linkedin || null, // Matches your Prisma schema field name
                    github: github || null,
                    status: 'waitlist',
                    waitlistJoinedAt: new Date() // Explicitly set (though default exists)
                }
            });

            // Send confirmation email using Brevo (fire-and-forget)
            sendWelcomeEmail({
                to: student.email,
                name: student.name
            }).catch(emailError => {
                console.error('Failed to send waitlist confirmation email:', emailError);
                // Do NOT throw — we already succeeded in saving to DB
            });

            // Respond immediately with success
            return res.status(201).json({
                success: true,
                message: 'Successfully joined the waitlist! Check your email for confirmation.',
                data: {
                    id: student.id,
                    name: student.name,
                    email: student.email
                }
            });

        } catch (error) {
            console.error('Waitlist registration error:', error);

            // Handle unique constraint violation separately (in case of race condition)
            if (error.code === 'P2002') {
                return res.status(409).json({
                    error: 'Already registered',
                    message: 'This email is already on the waitlist'
                });
            }

            return res.status(500).json({
                error: 'Server error',
                message: 'Failed to join waitlist. Please try again later.'
            });
        }
    }
);

/**
 * GET /api/waitlist/count
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
        res.status(500).json({ error: 'Failed to fetch count' });
    }
});

/**
 * GET /api/waitlist/stats
 */
router.get('/stats', async (req, res) => {
    try {
        const [total, byCountry, byGraduationYear] = await Promise.all([
            prisma.student.count({ where: { status: 'waitlist' } }),
            prisma.student.groupBy({
                by: ['country'],
                where: { status: 'waitlist', country: { not: null } },
                _count: { country: true },
                orderBy: { _count: { country: 'desc' } },
                take: 10
            }),
            prisma.student.groupBy({
                by: ['graduationYear'],
                where: { status: 'waitlist', graduationYear: { not: null } },
                _count: { graduationYear: true },
                orderBy: { graduationYear: 'asc' }
            })
        ]);

        res.json({
            total,
            topCountries: byCountry.map(c => ({ country: c.country, count: c._count.country })),
            byGraduationYear: byGraduationYear.map(g => ({ year: g.graduationYear, count: g._count.graduationYear }))
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

export default router;