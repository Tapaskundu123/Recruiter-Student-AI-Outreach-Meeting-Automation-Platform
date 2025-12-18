import express from 'express';
import { body, query, validationResult } from 'express-validator';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import prisma from '../db/client.js';
import { personalizeEmail, generateSubject, refineEmailTemplate } from '../ai/emailPersonalizer.js';
import { sendEmail } from '../email/emailClient.js';
import { getEmailTemplate } from '../email/templates.js';

const router = express.Router();

// Configure multer for HTML file uploads
const storage = multer.memoryStorage(); // Store in memory for processing
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        // Only accept HTML files
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext === '.html' || ext === '.htm') {
            cb(null, true);
        } else {
            cb(new Error('Only HTML files are allowed'));
        }
    }
});

// TODO: Add authentication middleware for admin routes

/**
 * GET /api/email/templates
 * Get all email templates with optional filtering
 */
router.get('/templates', async (req, res) => {
    try {
        const { category, active } = req.query;

        const where = {};
        if (category && category !== 'all') {
            where.category = category;
        }
        if (active !== undefined) {
            where.isActive = active === 'true';
        }

        const templates = await prisma.emailTemplate.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });

        res.json({
            success: true,
            data: templates,
            count: templates.length
        });
    } catch (error) {
        console.error('Error fetching email templates:', error);
        res.status(500).json({
            error: 'Failed to fetch email templates',
            message: error.message
        });
    }
});

/**
 * POST /api/email/templates
 * Create a new email template
 */
router.post('/templates',
    [
        body('name').trim().notEmpty().withMessage('Template name is required'),
        body('category').isIn(['recruiter', 'student', 'both']).withMessage('Invalid category'),
        body('subject').trim().notEmpty().withMessage('Subject is required'),
        body('content').trim().notEmpty().withMessage('Content is required'),
        body('description').optional().trim(),
        body('isActive').optional().isBoolean()
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { name, category, subject, content, description, isActive } = req.body;

            const template = await prisma.emailTemplate.create({
                data: {
                    name,
                    category,
                    subject,
                    content,
                    description,
                    isActive: isActive !== undefined ? isActive : true
                }
            });

            res.status(201).json({
                success: true,
                data: template,
                message: 'Email template created successfully'
            });
        } catch (error) {
            console.error('Error creating email template:', error);
            res.status(500).json({
                error: 'Failed to create email template',
                message: error.message
            });
        }
    }
);

/**
 * PATCH /api/email/templates/:id
 * Update an email template
 */
router.patch('/templates/:id',
    [
        body('name').optional().trim().notEmpty(),
        body('category').optional().isIn(['recruiter', 'student', 'both']),
        body('subject').optional().trim().notEmpty(),
        body('content').optional().trim().notEmpty(),
        body('description').optional().trim(),
        body('isActive').optional().isBoolean()
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { id } = req.params;
            const updateData = {};

            // Only include provided fields
            ['name', 'category', 'subject', 'content', 'description', 'isActive'].forEach(field => {
                if (req.body[field] !== undefined) {
                    updateData[field] = req.body[field];
                }
            });

            const template = await prisma.emailTemplate.update({
                where: { id },
                data: updateData
            });

            res.json({
                success: true,
                data: template,
                message: 'Email template updated successfully'
            });
        } catch (error) {
            if (error.code === 'P2025') {
                return res.status(404).json({
                    error: 'Template not found'
                });
            }
            console.error('Error updating email template:', error);
            res.status(500).json({
                error: 'Failed to update email template',
                message: error.message
            });
        }
    }
);

/**
 * DELETE /api/email/templates/:id
 * Delete an email template
 */
router.delete('/templates/:id', async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.emailTemplate.delete({
            where: { id }
        });

        res.json({
            success: true,
            message: 'Email template deleted successfully'
        });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({
                error: 'Template not found'
            });
        }
        console.error('Error deleting email template:', error);
        res.status(500).json({
            error: 'Failed to delete email template',
            message: error.message
        });
    }
});

/**
 * POST /api/email/generate
 * Generate AI-powered email content
 */
router.post('/generate',
    [
        body('recipientType').isIn(['recruiter', 'student']).withMessage('Invalid recipient type'),
        body('recipientData').isObject().withMessage('Recipient data is required'),
        body('purpose').optional().trim(),
        body('tone').optional().trim(),
        body('templateId').optional().isUUID()
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { recipientType, recipientData, purpose, tone, templateId } = req.body;

            // Import the new generate function
            const { generateEmailContent } = await import('../ai/emailPersonalizer.js');

            let emailContent, subject;

            if (templateId) {
                // Use existing template and personalize it
                const template = await prisma.emailTemplate.findUnique({
                    where: { id: templateId }
                });

                if (!template) {
                    return res.status(404).json({ error: 'Template not found' });
                }

                // Personalize the template content
                emailContent = await personalizeEmail({
                    template: template.content,
                    recipientData
                });

                // Generate subject if template subject has placeholders
                if (template.subject.includes('{{')) {
                    const Handlebars = (await import('handlebars')).default;
                    const compiledSubject = Handlebars.compile(template.subject);
                    subject = compiledSubject(recipientData);
                } else {
                    subject = template.subject;
                }
            } else {
                // Generate from scratch using AI
                const result = await generateEmailContent({
                    recipientType,
                    recipientData,
                    purpose: purpose || 'professional outreach',
                    tone: tone || 'professional and friendly'
                });

                emailContent = result.content;
                subject = result.subject;
            }

            res.json({
                success: true,
                data: {
                    subject,
                    content: emailContent
                }
            });
        } catch (error) {
            console.error('Error generating email:', error);
            res.status(500).json({
                error: 'Failed to generate email',
                message: error.message
            });
        }
    }
);

/**
 * POST /api/email/send
 * Send emails to selected recipients
 */
router.post('/send',
    [
        body('subject').trim().notEmpty().withMessage('Subject is required'),
        body('content').trim().notEmpty().withMessage('Content is required'),
        body('recipients').isArray({ min: 1 }).withMessage('At least one recipient is required'),
        body('recipients.*.type').isIn(['recruiter', 'student']).withMessage('Invalid recipient type'),
        body('recipients.*.id').isUUID().withMessage('Valid recipient ID required')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { subject, content, recipients } = req.body;

            const results = {
                success: [],
                failed: []
            };

            // Send emails to all recipients
            for (const recipient of recipients) {
                try {
                    let recipientData;

                    // Fetch recipient details
                    if (recipient.type === 'recruiter') {
                        recipientData = await prisma.recruiter.findUnique({
                            where: { id: recipient.id }
                        });
                    } else {
                        recipientData = await prisma.student.findUnique({
                            where: { id: recipient.id }
                        });
                    }

                    if (!recipientData) {
                        results.failed.push({
                            id: recipient.id,
                            type: recipient.type,
                            error: 'Recipient not found'
                        });
                        continue;
                    }

                    // Personalize content for this specific recipient
                    const Handlebars = (await import('handlebars')).default;
                    const compiledContent = Handlebars.compile(content);
                    const personalizedContent = compiledContent({
                        name: recipientData.name,
                        email: recipientData.email,
                        company: recipientData.company,
                        university: recipientData.university,
                        ...recipientData
                    });

                    // Send email
                    await sendEmail({
                        to: recipientData.email,
                        subject,
                        html: personalizedContent
                    });

                    results.success.push({
                        id: recipient.id,
                        type: recipient.type,
                        email: recipientData.email,
                        name: recipientData.name
                    });
                } catch (sendError) {
                    console.error(`Failed to send email to ${recipient.type} ${recipient.id}:`, sendError);
                    results.failed.push({
                        id: recipient.id,
                        type: recipient.type,
                        error: sendError.message
                    });
                }
            }

            res.json({
                success: true,
                message: `Emails sent: ${results.success.length} successful, ${results.failed.length} failed`,
                results
            });
        } catch (error) {
            console.error('Error sending emails:', error);
            res.status(500).json({
                error: 'Failed to send emails',
                message: error.message
            });
        }
    }
);

/**
 * POST /api/email/upload
 * Upload an HTML email template file (simplified - auto-extracts data from HTML)
 */
router.post('/upload', upload.single('template'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                error: 'No file uploaded',
                message: 'Please upload an HTML file'
            });
        }

        const { refineWithAI } = req.body;

        // Convert buffer to string
        let htmlContent = req.file.buffer.toString('utf-8');

        // Auto-extract template name from filename (remove extension and clean up)
        const templateName = req.file.originalname
            .replace(/\.[^/.]+$/, '') // Remove extension
            .replace(/[-_]/g, ' ') // Replace dashes and underscores with spaces
            .replace(/\b\w/g, l => l.toUpperCase()); // Capitalize first letter of each word

        // Try to extract subject from HTML (look for title or first h1)
        let subject = 'Email Template';
        const titleMatch = htmlContent.match(/<title[^>]*>(.*?)<\/title>/i);
        const h1Match = htmlContent.match(/<h1[^>]*>(.*?)<\/h1>/i);

        if (titleMatch && titleMatch[1]) {
            subject = titleMatch[1].replace(/<[^>]*>/g, '').trim(); // Remove any HTML tags
        } else if (h1Match && h1Match[1]) {
            subject = h1Match[1].replace(/<[^>]*>/g, '').trim();
        }

        // Auto-detect category based on content keywords (simple heuristic)
        let category = 'both';
        const contentLower = htmlContent.toLowerCase();
        if (contentLower.includes('recruiter') || contentLower.includes('company') || contentLower.includes('hiring')) {
            category = 'recruiter';
        } else if (contentLower.includes('student') || contentLower.includes('university') || contentLower.includes('degree')) {
            category = 'student';
        }

        // Optionally refine with AI
        if (refineWithAI === 'true') {
            try {
                console.log('Refining template with AI...');
                htmlContent = await refineEmailTemplate(htmlContent);
                console.log('Template refined successfully');
            } catch (refineError) {
                console.error('AI refinement failed, using original template:', refineError);
                // Continue with original template if refinement fails
            }
        }

        // Create template in database
        const template = await prisma.emailTemplate.create({
            data: {
                name: templateName,
                category,
                subject,
                content: htmlContent,
                description: `Uploaded from ${req.file.originalname}`,
                isActive: true
            }
        });

        res.status(201).json({
            success: true,
            data: template,
            message: refineWithAI === 'true'
                ? 'Template uploaded and refined with AI successfully'
                : 'Template uploaded successfully',
            refined: refineWithAI === 'true',
            extracted: {
                name: templateName,
                subject,
                category
            }
        });

    } catch (error) {
        console.error('Error uploading template:', error);
        res.status(500).json({
            error: 'Failed to upload template',
            message: error.message
        });
    }
});

/**
 * POST /api/email/refine
 * Refine an existing template with AI
 */
router.post('/refine/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Fetch existing template
        const template = await prisma.emailTemplate.findUnique({
            where: { id }
        });

        if (!template) {
            return res.status(404).json({
                error: 'Template not found'
            });
        }

        // Refine with AI
        const refinedContent = await refineEmailTemplate(template.content);

        // Update template
        const updatedTemplate = await prisma.emailTemplate.update({
            where: { id },
            data: {
                content: refinedContent
            }
        });

        res.json({
            success: true,
            data: updatedTemplate,
            message: 'Template refined with AI successfully'
        });

    } catch (error) {
        console.error('Error refining template:', error);
        res.status(500).json({
            error: 'Failed to refine template',
            message: error.message
        });
    }
});

export default router;
