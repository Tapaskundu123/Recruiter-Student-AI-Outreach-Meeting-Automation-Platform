import express from 'express';
import { google } from 'googleapis';
import prisma from '../db/client.js';
import config from '../config/index.js';

const router = express.Router();

// Shared OAuth2 client factory
const createOAuthClient = (redirectUri = config.GOOGLE.REDIRECT_URI) => {
    return new google.auth.OAuth2(
        config.GOOGLE.CLIENT_ID,
        config.GOOGLE.CLIENT_SECRET,
        redirectUri
    );
};

// Recommended scopes for calendar + basic profile
const SCOPES = [
    'https://www.googleapis.com/auth/calendar',           // Full calendar access (read + write events)
    'https://www.googleapis.com/auth/calendar.events',    // Explicit events permission
    'https://www.googleapis.com/auth/userinfo.email',     // Get user's email (useful for verification)
    'openid'                                              // Required for ID token (security best practice)
];

/**
 * GET /api/auth/google
 * Start Google OAuth flow - returns auth URL for frontend to redirect to
 */
router.get('/google', (req, res) => {
    const { recruiterId } = req.query;

    if (!recruiterId || typeof recruiterId !== 'string') {
        return res.status(400).json({ error: 'Valid recruiterId is required' });
    }

    const oauth2Client = createOAuthClient();

    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',     // Crucial: ensures refresh_token is returned
        prompt: 'consent',          // Forces consent screen → guarantees refresh_token even on re-auth
        scope: SCOPES,
        state: JSON.stringify({ recruiterId, origin: 'connect_calendar' }), // Securely pass data
        include_granted_scopes: true // Allows incremental auth if adding scopes later
    });

    res.json({ url: authUrl });
});

/**
 * GET /api/auth/google/callback
 * Handle OAuth callback from Google
 */
router.get('/google/callback', async (req, res) => {
    const { code, state, error } = req.query;

    // Handle user denial or Google error
    if (error) {
        console.error('Google OAuth denied:', error);
        return res.redirect(`${config.FRONTEND_URL}/dashboard?status=calendar_failed&error=user_denied`);
    }

    if (!code || !state) {
        return res.redirect(`${config.FRONTEND_URL}/dashboard?status=calendar_failed&error=missing_params`);
    }

    let recruiterId;
    try {
        const parsedState = JSON.parse(state);
        recruiterId = parsedState.recruiterId;
        if (!recruiterId) throw new Error('No recruiterId in state');
    } catch (err) {
        console.error('Invalid state parameter:', err);
        return res.redirect(`${config.FRONTEND_URL}/dashboard?status=calendar_failed&error=invalid_state`);
    }

    try {
        const oauth2Client = createOAuthClient();

        // Exchange code for tokens
        const { tokens } = await oauth2Client.getToken(code);
        if (!tokens.refresh_token && !tokens.access_token) {
            throw new Error('No tokens received from Google');
        }

        oauth2Client.setCredentials(tokens);

        // Optional: Verify user email matches (extra security)
        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
        const userInfo = await oauth2.userinfo.get();
        const googleEmail = userInfo.data.email;

        // Calculate expiry (access_token only)
        const tokenExpiry = tokens.expiry_date ? new Date(tokens.expiry_date) : null;

        // Save to database
        await prisma.recruiter.update({
            where: { id: recruiterId },
            data: {
                googleRefreshToken: tokens.refresh_token, // Store refresh token
                googleAccessToken: tokens.access_token,
                googleTokenExpiry: tokenExpiry
            }
        });

        console.log(`Calendar connected for recruiter ${recruiterId} (${googleEmail})`);

        // Success redirect
        res.redirect(`${config.FRONTEND_URL}/dashboard/${recruiterId}?status=calendar_connected`);

    } catch (err) {
        console.error('OAuth callback error:', err.message || err);

        // Differentiate errors in URL for better frontend handling
        const errorType = err.message?.includes('invalid_grant') ? 'expired_code' : 'unknown';
        res.redirect(`${config.FRONTEND_URL}/dashboard/${recruiterId}?status=calendar_failed&error=${errorType}`);
    }
});

export default router;