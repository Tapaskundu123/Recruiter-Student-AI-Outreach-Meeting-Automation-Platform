import { chromium } from 'playwright';
import config from '../config/index.js';

/**
 * Base Scraper Class
 * Provides common scraping utilities
 */
class BaseScraper {
    constructor() {
        this.browser = null;
        this.page = null;
        this.seenEmails = new Set();
    }

    /**
     * Initialize browser
     */
    async init() {
        this.browser = await chromium.launch({
            headless: config.SCRAPING.HEADLESS,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        this.page = await this.browser.newPage();

        // Set user agent
        await this.page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        );
    }

    /**
     * Close browser
     */
    async close() {
        if (this.browser) {
            await this.browser.close();
        }
    }

    /**
     * Navigate to URL with retry
     */
    async navigate(url, options = {}) {
        try {
            await this.page.goto(url, {
                waitUntil: 'networkidle',
                timeout: 30000,
                ...options
            });
            return true;
        } catch (error) {
            console.error(`Navigation error for ${url}:`, error.message);
            return false;
        }
    }

    /**
     * Rate limiting delay
     */
    async delay(ms = 1000) {
        await new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Check for duplicate emails
     */
    isDuplicate(email) {
        if (this.seenEmails.has(email)) {
            return true;
        }
        this.seenEmails.add(email);
        return false;
    }

    /**
     * Extract email from text
     */
    extractEmail(text) {
        const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
        const match = text.match(emailRegex);
        return match ? match[0] : null;
    }

    /**
     * Validate email format
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Clean text data
     */
    cleanText(text) {
        if (!text) return '';
        return text.replace(/\s+/g, ' ').trim();
    }

    /**
     * Handle scraping errors
     */
    handleError(error, context = '') {
        console.error(`Scraping error ${context}:`, error.message);
        return {
            error: true,
            message: error.message,
            context
        };
    }
}

export default BaseScraper;
