
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../db/client.js';
import config from '../config/index.js';

const router = express.Router();

/**
 * POST /api/auth/admin/login
 * Admin login with cookie-based JWT
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email and password are required'
            });
        }

        // Find admin by email
        const admin = await prisma.admin.findUnique({
            where: { email: email.toLowerCase().trim() }
        });

        if (!admin) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
        }

        // Check if admin is active
        if (!admin.isActive) {
            return res.status(403).json({
                success: false,
                error: 'Account is deactivated. Please contact support.'
            });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, admin.passwordHash);

        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                id: admin.id,
                email: admin.email,
                role: admin.role
            },
            config.JWT_SECRET,
            { expiresIn: config.JWT_EXPIRES_IN || '7d' }
        );

        // Update last login
        await prisma.admin.update({
            where: { id: admin.id },
            data: { lastLoginAt: new Date() }
        });

        // Set HTTP-only cookie
        res.cookie('admin_token', token, {
            httpOnly: true,
            secure: config.NODE_ENV === 'production',
            sameSite: 'lax', // Changed from 'strict' for better compatibility
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        // Return admin data (without password)
        res.json({
            success: true,
            data: {
                id: admin.id,
                email: admin.email,
                name: admin.name,
                role: admin.role
            },
            message: 'Login successful'
        });

    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({
            success: false,
            error: 'Login failed. Please try again.'
        });
    }
});

/**
 * POST /api/auth/admin/logout
 * Logout admin - clear cookie
 */
router.post('/logout', (req, res) => {
    res.clearCookie('admin_token', {
        httpOnly: true,
        secure: config.NODE_ENV === 'production',
        sameSite: 'lax'
    });

    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

/**
 * GET /api/auth/admin/me
 * Get current logged-in admin
 */
router.get('/me', async (req, res) => {
    try {
        const token = req.cookies.admin_token;

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Not authenticated'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, config.JWT_SECRET);

        // Get admin from database
        const admin = await prisma.admin.findUnique({
            where: { id: decoded.id },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isActive: true,
                lastLoginAt: true
            }
        });

        if (!admin || !admin.isActive) {
            res.clearCookie('admin_token');
            return res.status(401).json({
                success: false,
                error: 'Admin not found or inactive'
            });
        }

        res.json({
            success: true,
            data: admin
        });

    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            res.clearCookie('admin_token');
            return res.status(401).json({
                success: false,
                error: 'Invalid or expired token'
            });
        }

        console.error('Get admin error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get admin data'
        });
    }
});

/**
 * POST /api/auth/admin/verify
 * Verify if token is valid
 */
router.post('/verify', async (req, res) => {
    try {
        const token = req.cookies.admin_token;

        if (!token) {
            return res.json({ success: false, authenticated: false });
        }

        const decoded = jwt.verify(token, config.JWT_SECRET);
        const admin = await prisma.admin.findUnique({
            where: { id: decoded.id },
            select: { id: true, isActive: true }
        });

        if (!admin || !admin.isActive) {
            res.clearCookie('admin_token');
            return res.json({ success: false, authenticated: false });
        }

        res.json({ success: true, authenticated: true });

    } catch (error) {
        res.clearCookie('admin_token');
        res.json({ success: false, authenticated: false });
    }
});

export default router;
