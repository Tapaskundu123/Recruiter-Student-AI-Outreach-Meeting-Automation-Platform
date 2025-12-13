import BaseScraper from './base.js';

/**
 * Student Scraper
 * Scrapes student data from university directories and platforms
 */
class StudentScraper extends BaseScraper {
    constructor() {
        super();
    }

    /**
     * Scrape students from target platform
     */
    async scrape({ target, countries = [] }) {
        const results = [];

        try {
            await this.init();

            // University directory scraping
            if (target.includes('edu')) {
                const universityResults = await this.scrapeUniversityDirectory(target);
                results.push(...universityResults);
            }

            // LinkedIn student profiles
            if (target.includes('linkedin.com')) {
                console.log('LinkedIn student scraping - use LinkedIn API in production');
                // Use LinkedIn API for production
            }

        } catch (error) {
            console.error('Student scraping error:', error);
        } finally {
            await this.close();
        }

        return results;
    }

    /**
     * Scrape university student directories
     */
    async scrapeUniversityDirectory(url) {
        const results = [];

        try {
            const success = await this.navigate(url);
            if (!success) return results;

            // Look for student contact information
            const students = await this.page.$$eval('a[href^="mailto:"]', links =>
                links.map(link => ({
                    email: link.href.replace('mailto:', ''),
                    name: link.textContent.trim()
                }))
            );

            for (const student of students) {
                if (this.isValidEmail(student.email) && !this.isDuplicate(student.email)) {
                    // Only include .edu emails for students
                    if (student.email.includes('.edu')) {
                        results.push({
                            email: student.email,
                            name: this.cleanText(student.name) || this.extractNameFromEmail(student.email),
                            university: this.extractUniversityFromEmail(student.email),
                            scrapedAt: new Date()
                        });
                    }
                }
            }

        } catch (error) {
            console.error(`Error scraping university directory:`, error.message);
        }

        return results;
    }

    /**
     * Extract name from email
     */
    extractNameFromEmail(email) {
        const namePart = email.split('@')[0];
        const parts = namePart.split(/[._]/);
        return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
    }

    /**
     * Extract university name from email domain
     */
    extractUniversityFromEmail(email) {
        try {
            const domain = email.split('@')[1];
            const universityPart = domain.split('.')[0];

            // Common university name mappings
            const universityMap = {
                'mit': 'Massachusetts Institute of Technology',
                'stanford': 'Stanford University',
                'harvard': 'Harvard University',
                'berkeley': 'UC Berkeley',
                'ucla': 'UCLA'
            };

            return universityMap[universityPart.toLowerCase()] ||
                universityPart.charAt(0).toUpperCase() + universityPart.slice(1) + ' University';
        } catch {
            return 'Unknown University';
        }
    }
}

export default StudentScraper;
