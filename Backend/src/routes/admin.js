import express from 'express';
import { body, query, validationResult } from 'express-validator';
import prisma from '../db/client.js';

const router = express.Router();

// TODO: Add authentication middleware for admin routes

/**
 * GET /api/admin/recruiters
 * Get all recruiters with pagination
 */
router.get('/recruiters', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;
        const search = req.query.search;

        const where = search
            ? {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                    { company: { contains: search, mode: 'insensitive' } }
                ]
            }
            : {};

        const [recruiters, total] = await Promise.all([
            prisma.recruiter.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.recruiter.count({ where })
        ]);

        res.json({
            data: recruiters,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Recruiters fetch error:', error);
        res.status(500).json({
            error: 'Server error',
            message: 'Failed to fetch recruiters'
        });
    }
});

/**
 * GET /api/admin/students
 * Get all students with pagination
 */
router.get('/students', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;
        const search = req.query.search;

        const where = search
            ? {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                    { university: { contains: search, mode: 'insensitive' } }
                ]
            }
            : {};

        const [students, total] = await Promise.all([
            prisma.student.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.student.count({ where })
        ]);

        res.json({
            data: students,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Students fetch error:', error);
        res.status(500).json({
            error: 'Server error',
            message: 'Failed to fetch students'
        });
    }
});

/**
 * POST /api/admin/export/recruiters
 * Export recruiters to CSV/JSON
 */
router.post('/export/recruiters', async (req, res) => {
    try {
        const format = req.body.format || 'json'; // json or csv
        const recruiters = await prisma.recruiter.findMany({
            orderBy: { createdAt: 'desc' }
        });

        if (format === 'json') {
            res.json({ data: recruiters, count: recruiters.length });
        } else {
            // CSV export
            // TODO: Implement CSV conversion
            res.json({ message: 'CSV export coming soon', data: recruiters });
        }
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({
            error: 'Server error',
            message: 'Failed to export recruiters'
        });
    }
});

/**
 * POST /api/admin/export/students
 * Export students to CSV/JSON
 */
router.post('/export/students', async (req, res) => {
    try {
        const format = req.body.format || 'json';
        const students = await prisma.student.findMany({
            orderBy: { createdAt: 'desc' }
        });

        if (format === 'json') {
            res.json({ data: students, count: students.length });
        } else {
            // CSV export
            res.json({ message: 'CSV export coming soon', data: students });
        }
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({
            error: 'Server error',
            message: 'Failed to export students'
        });
    }
});

/**
 * DELETE /api/admin/recruiters/:id
 * Delete a recruiter
 */
router.delete('/recruiters/:id', async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.recruiter.delete({
            where: { id }
        });

        res.json({
            success: true,
            message: 'Recruiter deleted successfully'
        });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({
                error: 'Not found',
                message: 'Recruiter not found'
            });
        }
        console.error('Delete error:', error);
        res.status(500).json({
            error: 'Server error',
            message: 'Failed to delete recruiter'
        });
    }
});

/**
 * DELETE /api/admin/students/:id
 * Delete a student
 */
router.delete('/students/:id', async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.student.delete({
            where: { id }
        });

        res.json({
            success: true,
            message: 'Student deleted successfully'
        });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({
                error: 'Not found',
                message: 'Student not found'
            });
        }
        console.error('Delete error:', error);
        res.status(500).json({
            error: 'Server error',
            message: 'Failed to delete student'
        });
    }
});

export default router;
