import BaseScraper from './base.js';
import GitHubScraper from './githubScraper.js';

/**
 * Student Scraper
 * Scrapes student data from university directories and platforms
 */
class StudentScraper extends BaseScraper {
    constructor() {
        super();
        this.githubScraper = new GitHubScraper();
    }

    /**
     * Scrape students from target platform
     */
    async scrape({ target, countries = ['USA', 'Canada', 'Australia'], fields = [] }) {
        const results = [];

        try {
            await this.init();

            // GitHub scraping (real data via API)
            if (!target || target.includes('github.com') || target === 'all') {
                console.log('Scraping students from GitHub...');
                const githubResults = await this.githubScraper.scrapeStudents({ countries, fields });
                results.push(...githubResults);
                console.log(`✅ Found ${githubResults.length} students from GitHub`);
            }

            // University directory scraping
            if (!target || target.includes('edu') || target === 'all') {
                console.log('Scraping students from university directories...');
                const universityResults = await this.scrapeUniversityDirectories({ countries, fields });
                results.push(...universityResults);
                console.log(`✅ Found ${universityResults.length} students from universities`);
            }

        } catch (error) {
            console.error('Student scraping error:', error);
        } finally {
            await this.close();
        }

        console.log(`\n📊 Total students scraped: ${results.length}`);
        return results;
    }

    /**
     * Scrape multiple university student directories
     */
    async scrapeUniversityDirectories({ countries, fields }) {
        const results = [];

        const universities = [
            {
                name: 'MIT',
                url: 'https://www.eecs.mit.edu/people/students/',
                country: 'USA',
                field: 'Computer Science'
            },
            {
                name: 'Stanford University',
                url: 'https://cs.stanford.edu/people/grad-students',
                country: 'USA',
                field: 'Computer Science'
            },
            {
                name: 'UC Berkeley',
                url: 'https://eecs.berkeley.edu/students',
                country: 'USA',
                field: 'Computer Science'
            },
            {
                name: 'University of Toronto',
                url: 'https://web.cs.toronto.edu/people/students',
                country: 'Canada',
                field: 'Computer Science'
            },
            {
                name: 'Carnegie Mellon',
                url: 'https://www.cs.cmu.edu/directory/graduate-students',
                country: 'USA',
                field: 'Computer Science'
            }
        ];

        for (const university of universities) {
            // Skip if country not in target
            if (!countries.includes(university.country)) continue;

            try {
                const students = await this.scrapeUniversityDirectory(university);
                results.push(...students);

                await this.delay(3000); // Rate limiting

                if (results.length >= 100) {
                    break;
                }

            } catch (error) {
                console.error(`Error scraping ${university.name}:`, error.message);
            }
        }

        return results;
    }

    /**
     * Scrape single university student directory
     */
    async scrapeUniversityDirectory(university) {
        const results = [];

        try {
            const success = await this.navigate(university.url);
            if (!success) return results;

            await this.delay(2000);

            // Try multiple selectors for student information
            const students = await this.extractStudentsFromPage();

            for (const student of students) {
                if (this.isValidEmail(student.email) && !this.isDuplicate(student.email)) {
                    // Only include .edu emails
                    if (student.email.includes('.edu')) {
                        results.push({
                            name: this.cleanText(student.name) || this.extractNameFromEmail(student.email),
                            email: student.email,
                            phone: null,
                            university: university.name,
                            major: university.field,
                            graduationYear: this.extractGradYear(student.name) || 2025,
                            country: university.country,
                            platform: 'University Directory',
                            linkedIn: null,
                            resume: null,
                            scrapedAt: new Date()
                        });
                    }
                }

                if (results.length >= 20) {
                    break;
                }
            }

        } catch (error) {
            console.error(`Error processing ${university.name}:`, error.message);
        }

        return results;
    }

    /**
     * Extract students from page using multiple strategies
     */
    async extractStudentsFromPage() {
        try {
            // Strategy 1: Look for mailto links
            const mailtoStudents = await this.page.$$eval('a[href^="mailto:"]', links =>
                links.map(link => ({
                    email: link.href.replace('mailto:', ''),
                    name: link.textContent.trim() || link.closest('div, li, tr')?.textContent.trim() || ''
                }))
            );

            if (mailtoStudents.length > 0) {
                return mailtoStudents;
            }

            // Strategy 2: Look for email patterns in text
            const textContent = await this.page.evaluate(() => document.body.innerText);
            const emailRegex = /[\w.-]+@[\w.-]+\.edu/g;
            const emails = textContent.match(emailRegex) || [];

            return emails.map(email => ({
                email,
                name: ''
            }));

        } catch (error) {
            console.error('Error extracting students:', error.message);
            return [];
        }
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
     * Extract graduation year from text
     */
    extractGradYear(text) {
        if (!text) return null;

        const yearMatch = text.match(/20\d{2}|'\d{2}/);
        if (yearMatch) {
            let year = yearMatch[0];
            if (year.startsWith("'")) {
                year = '20' + year.slice(1);
            }
            const yearNum = parseInt(year);
            if (yearNum >= 2020 && yearNum <= 2030) {
                return yearNum;
            }
        }
        return null;
    }
}

export default StudentScraper;
