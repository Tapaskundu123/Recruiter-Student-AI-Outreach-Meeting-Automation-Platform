import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import config, { validateConfig } from './config/index.js';
import prisma from './db/client.js';

// Import routes
import waitlistRoutes from './routes/waitlist.js';
import scrapersRoutes from './routes/scrapers.js';
import campaignsRoutes from './routes/campaigns.js';
import meetingsRoutes from './routes/meetings.js';
import analyticsRoutes from './routes/analytics.js';
import adminRoutes from './routes/admin.js';
import authRoutes from './routes/auth.js';
import publicRoutes from './routes/public.js';
import calendarRoutes from './routes/calendar.js';
import dashboardRoutes from './routes/dashboard.js';
import eventsRoutes from './routes/events.js';

const app = express();

// Validate configuration
try {
    validateConfig();
} catch (error) {
    console.error('Configuration validation failed:', error.message);
    process.exit(1);
}

// Middleware
app.use(helmet());
app.use(cors({
    origin: config.FRONTEND_URL,
    credentials: true
}));
app.use(morgan(config.NODE_ENV === 'development' ? 'dev' : 'combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', async (req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            database: 'connected',
            version: '1.0.0'
        });
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            database: 'disconnected',
            error: error.message
        });
    }
});

// API Routes
app.use(`${config.API_PREFIX}/waitlist`, waitlistRoutes);
app.use(`${config.API_PREFIX}/scrapers`, scrapersRoutes);
app.use(`${config.API_PREFIX}/campaigns`, campaignsRoutes);
app.use(`${config.API_PREFIX}/meetings`, meetingsRoutes);
app.use(`${config.API_PREFIX}/analytics`, analyticsRoutes);
app.use(`${config.API_PREFIX}/admin`, adminRoutes);
app.use(`${config.API_PREFIX}/auth`, authRoutes);
app.use(`${config.API_PREFIX}/public`, publicRoutes);
app.use(`${config.API_PREFIX}/calendar`, calendarRoutes);
app.use(`${config.API_PREFIX}/dashboard`, dashboardRoutes);
app.use(`${config.API_PREFIX}/events`, eventsRoutes);

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.originalUrl} not found`,
        path: req.originalUrl,
        method: req.method
    });
});

// Error Handler
app.use((err, req, res, next) => {
    console.error('Error:', err);

    const status = err.status || err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    res.status(status).json({
        error: config.NODE_ENV === 'development' ? err.name : 'Error',
        message,
        ...(config.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Start server
const PORT = config.PORT;

app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════╗
║   AI Outreach Platform - Backend Server      ║
╠═══════════════════════════════════════════════╣
║  Environment: ${config.NODE_ENV.padEnd(31)}║
║  Port: ${PORT.toString().padEnd(38)}║
║  API Prefix: ${config.API_PREFIX.padEnd(33)}║
║  Status: Running ✓                            ║
╚═══════════════════════════════════════════════╝
  `);
});

export default app;
