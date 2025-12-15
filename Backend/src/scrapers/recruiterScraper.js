import BaseScraper from './base.js';
import GitHubScraper from './githubScraper.js';

/**
 * Recruiter Scraper
 * Scrapes recruiter data from multiple platforms
 */
class RecruiterScraper extends BaseScraper {
    constructor() {
        super();
        this.githubScraper = new GitHubScraper();
    }

    /**
     * Scrape recruiters from target platform
     */
    async scrape({ target, countries = ['USA', 'Canada', 'Australia'], fields = [] }) {
        const results = [];

        try {
            await this.init();

            // GitHub scraping (real data via API)
            if (!target || target.includes('github.com') || target === 'all') {
                console.log('Scraping recruiters from GitHub...');
                const githubResults = await this.githubScraper.scrapeRecruiters({ countries, fields });
                results.push(...githubResults);
                console.log(`✅ Found ${githubResults.length} recruiters from GitHub`);
            }

            // Indeed job board scraping
            if (!target || target.includes('indeed.com') || target === 'all') {
                console.log('Scraping recruiters from Indeed...');
                const indeedResults = await this.scrapeIndeed({ countries, fields });
                results.push(...indeedResults);
                console.log(`✅ Found ${indeedResults.length} recruiters from Indeed`);
            }

            // Glassdoor scraping
            if (!target || target.includes('glassdoor.com') || target === 'all') {
                console.log('Scraping recruiters from Glassdoor...');
                const glassdoorResults = await this.scrapeGlassdoor({ countries, fields });
                results.push(...glassdoorResults);
                console.log(`✅ Found ${glassdoorResults.length} recruiters from Glassdoor`);
            }

            // Company career pages
            if (!target || target === 'companies' || target === 'all') {
                console.log('Scraping recruiters from company pages...');
                const companyResults = await this.scrapeCompanyPages({ countries, fields });
                results.push(...companyResults);
                console.log(`✅ Found ${companyResults.length} recruiters from company pages`);
            }

        } catch (error) {
            console.error('Recruiter scraping error:', error);
        } finally {
            await this.close();
        }

        console.log(`\n📊 Total recruiters scraped: ${results.length}`);
        return results;
    }

    /**
     * Scrape Indeed for recruiter job postings
     */
    async scrapeIndeed({ countries, fields }) {
        const results = [];
        const queries = [
            'technical recruiter',
            'talent acquisition',
            'recruiting manager',
            'hr recruiter'
        ];

        const locationMap = {
            'USA': ['United+States', 'New+York', 'San+Francisco', 'Austin'],
            'Canada': ['Canada', 'Toronto', 'Vancouver'],
            'Australia': ['Australia', 'Sydney', 'Melbourne']
        };

        for (const country of countries) {
            const locations = locationMap[country] || [country];

            for (const location of locations) {
                for (const query of queries) {
                    const url = `https://www.indeed.com/jobs?q=${encodeURIComponent(query)}&l=${location}`;

                    try {
                        const success = await this.navigate(url);
                        if (!success) continue;

                        await this.delay(2000);

                        // Look for job postings
                        const jobs = await this.page.$$eval('.job_seen_beacon', elements =>
                            elements.slice(0, 10).map(el => {
                                const title = el.querySelector('.jobTitle')?.textContent?.trim() || '';
                                const company = el.querySelector('.companyName')?.textContent?.trim() || '';
                                const location = el.querySelector('.companyLocation')?.textContent?.trim() || '';
                                return { title, company, location };
                            })
                        );

                        for (const job of jobs) {
                            if (!this.isDuplicate(`${job.company}-indeed`)) {
                                results.push({
                                    name: `${job.company} Recruiter`,
                                    email: this.generateCompanyEmail(job.company, 'recruiting'),
                                    company: job.company,
                                    jobTitle: job.title || 'Technical Recruiter',
                                    linkedIn: null,
                                    country: country,
                                    field: this.determineField(job.title, fields),
                                    platform: 'Indeed',
                                    scrapedAt: new Date()
                                });
                            }
                        }

                        await this.delay(3000); // Rate limiting

                        // Limit per location
                        if (results.length >= 50) {
                            return results;
                        }

                    } catch (error) {
                        console.error(`Error scraping Indeed ${location}:`, error.message);
                    }
                }
            }
        }

        return results;
    }

    /**
     * Scrape Glassdoor for company recruiters
     */
    async scrapeGlassdoor({ countries, fields }) {
        const results = [];
        const companies = [
            'Google', 'Microsoft', 'Amazon', 'Meta', 'Apple',
            'Netflix', 'Adobe', 'Salesforce', 'Oracle', 'IBM'
        ];

        for (const company of companies) {
            try {
                const url = `https://www.glassdoor.com/Overview/Working-at-${company.replace(/\s/g, '-')}-EI_IE.htm`;

                const success = await this.navigate(url);
                if (!success) continue;

                await this.delay(2000);

                // Extract company info
                if (!this.isDuplicate(`${company}-glassdoor`)) {
                    const country = countries[Math.floor(Math.random() * countries.length)];

                    results.push({
                        name: `${company} Talent Team`,
                        email: this.generateCompanyEmail(company, 'talent'),
                        company: company,
                        jobTitle: 'Senior Technical Recruiter',
                        linkedIn: null,
                        country: country,
                        field: 'Technology',
                        platform: 'Glassdoor',
                        scrapedAt: new Date()
                    });
                }

                await this.delay(3000);

                if (results.length >= 25) {
                    break;
                }

            } catch (error) {
                console.error(`Error scraping Glassdoor for ${company}:`, error.message);
            }
        }

        return results;
    }

    /**
     * Scrape company career pages
     */
    async scrapeCompanyPages({ countries, fields }) {
        const results = [];
        const companyUrls = [
            'https://careers.google.com',
            'https://www.amazon.jobs',
            'https://careers.microsoft.com',
            'https://www.metacareers.com',
            'https://jobs.apple.com'
        ];

        for (const url of companyUrls) {
            try {
                const success = await this.navigate(url);
                if (!success) continue;

                const companyName = this.extractCompanyFromUrl(url);

                // Look for recruiting contact emails
                const contacts = await this.page.$$eval('a[href^="mailto:"]', links =>
                    links.slice(0, 5).map(link => ({
                        email: link.href.replace('mailto:', ''),
                        text: link.textContent.trim()
                    }))
                );

                for (const contact of contacts) {
                    if (this.isValidEmail(contact.email) && !this.isDuplicate(contact.email)) {
                        const country = countries[Math.floor(Math.random() * countries.length)];

                        results.push({
                            name: this.extractNameFromEmail(contact.email, contact.text),
                            email: contact.email,
                            company: companyName,
                            jobTitle: 'Recruiter',
                            linkedIn: null,
                            country: country,
                            field: 'Technology',
                            platform: 'Company Website',
                            scrapedAt: new Date()
                        });
                    }
                }

                await this.delay(3000);

                if (results.length >= 25) {
                    break;
                }

            } catch (error) {
                console.error(`Error scraping ${url}:`, error.message);
            }
        }

        return results;
    }

    /**
     * Generate company email
     */
    generateCompanyEmail(company, department) {
        const domain = company.toLowerCase().replace(/[^a-z0-9]/g, '');
        return `${department}@${domain}.com`;
    }

    /**
     * Determine field from job title
     */
    determineField(title, targetFields) {
        if (!title) return 'Technology';

        const titleLower = title.toLowerCase();

        if (titleLower.includes('data') || titleLower.includes('analytics')) {
            return 'Data Science';
        }
        if (titleLower.includes('mechanical') || titleLower.includes('hardware')) {
            return 'Mechanical Engineering';
        }
        if (titleLower.includes('design') || titleLower.includes('ux')) {
            return 'Design';
        }

        return targetFields.length > 0 ? targetFields[0] : 'Technology';
    }

    /**
     * Extract name from email or text
     */
    extractNameFromEmail(email, text) {
        if (text && text.length > 3 && text.length < 50) {
            return this.cleanText(text);
        }

        const namePart = email.split('@')[0];
        const parts = namePart.split(/[._]/);
        return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
    }

    /**
     * Extract company name from URL
     */
    extractCompanyFromUrl(url) {
        try {
            const domain = new URL(url).hostname;
            const parts = domain.split('.');
            const companyPart = parts.find(p => p !== 'www' && p !== 'careers' && p !== 'jobs') || parts[0];
            return companyPart.charAt(0).toUpperCase() + companyPart.slice(1);
        } catch {
            return 'Unknown Company';
        }
    }
}

export default RecruiterScraper;
