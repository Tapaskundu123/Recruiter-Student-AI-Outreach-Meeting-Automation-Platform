import axios from 'axios';

/**
 * GitHub API Scraper
 * Scrapes real data from GitHub using official API
 */
class GitHubScraper {
    constructor() {
        this.token = process.env.GITHUB_TOKEN;
        this.baseUrl = 'https://api.github.com';
        this.headers = {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'AI-Outreach-Platform'
        };

        if (this.token) {
            this.headers['Authorization'] = `token ${this.token}`;
        }
    }

    /**
     * Search GitHub users by location and keywords
     */
    async searchUsers(query, perPage = 30, maxPages = 3) {
        const results = [];

        try {
            for (let page = 1; page <= maxPages; page++) {
                const response = await axios.get(`${this.baseUrl}/search/users`, {
                    headers: this.headers,
                    params: {
                        q: query,
                        per_page: perPage,
                        page: page
                    }
                });

                if (response.data.items && response.data.items.length > 0) {
                    results.push(...response.data.items);
                }

                // Rate limiting - wait 1 second between requests
                await this.delay(1000);

                // Stop if no more results
                if (response.data.items.length < perPage) {
                    break;
                }
            }
        } catch (error) {
            console.error('GitHub search error:', error.message);
        }

        return results;
    }

    /**
     * Get detailed user profile
     */
    async getUserProfile(username) {
        try {
            const response = await axios.get(`${this.baseUrl}/users/${username}`, {
                headers: this.headers
            });

            await this.delay(500);
            return response.data;
        } catch (error) {
            console.error(`Error fetching profile for ${username}:`, error.message);
            return null;
        }
    }

    /**
     * Scrape tech recruiters from GitHub
     */
    async scrapeRecruiters({ countries = ['USA', 'Canada', 'Australia'], fields = [] }) {
        const results = [];
        const seenEmails = new Set();

        // Search queries for recruiters
        const queries = [
            ...countries.map(country => `location:${country} recruiter`),
            ...countries.map(country => `location:${country} talent acquisition`),
            ...countries.map(country => `location:${country} hiring manager`),
            'location:"New York" recruiter type:user',
            'location:"San Francisco" talent type:user',
            'location:Toronto recruiter type:user',
            'location:Sydney hiring type:user'
        ];

        for (const query of queries) {
            console.log(`Searching GitHub: ${query}`);
            const users = await this.searchUsers(query, 30, 2);

            for (const user of users) {
                const profile = await this.getUserProfile(user.login);

                if (!profile) continue;

                // Extract email if available
                const email = profile.email || this.generateEmail(profile.login, profile.company);

                // Skip duplicates
                if (seenEmails.has(email)) continue;
                seenEmails.add(email);

                // Determine field from bio
                const field = this.extractField(profile.bio, fields);
                const country = this.normalizeCountry(profile.location);

                // Only include if country matches
                if (countries.some(c => country?.includes(c))) {
                    results.push({
                        name: profile.name || profile.login,
                        email: email,
                        company: profile.company || 'Tech Company',
                        jobTitle: this.extractJobTitle(profile.bio, 'recruiter'),
                        linkedIn: null,
                        country: country,
                        field: field || 'Technology',
                        platform: 'GitHub',
                        scrapedAt: new Date()
                    });
                }

                // Limit to prevent excessive API calls
                if (results.length >= 150) {
                    console.log('Reached recruiter limit from GitHub');
                    return results;
                }
            }
        }

        return results;
    }

    /**
     * Scrape students from GitHub (users with .edu emails or university repos)
     */
    async scrapeStudents({ countries = ['USA', 'Canada', 'Australia'], fields = [] }) {
        const results = [];
        const seenEmails = new Set();

        // Search queries for students with specific degrees
        const queries = [
            ...countries.map(country => `location:${country} "B.Tech" student type:user`),
            ...countries.map(country => `location:${country} "M.Tech" student type:user`),
            ...countries.map(country => `location:${country} "BCA" student type:user`),
            ...countries.map(country => `location:${country} "MCA" student type:user`),
            ...countries.map(country => `location:${country} "Computer Science" student type:user`),
            ...countries.map(country => `location:${country} "Data Science" student type:user`)
        ];

        for (const query of queries) {
            console.log(`Searching GitHub: ${query}`);
            const users = await this.searchUsers(query, 30, 2);

            for (const user of users) {
                const profile = await this.getUserProfile(user.login);

                if (!profile) continue;

                // Check for specific degrees in bio
                const degree = this.extractDegree(profile.bio);

                // Get user repos to check for .edu or university affiliation
                const repos = await this.getUserRepos(user.login);
                const isStudent = this.isLikelyStudent(profile, repos) || !!degree;

                if (!isStudent) continue;

                const email = profile.email || this.generateEduEmail(profile.login, profile.location);

                if (seenEmails.has(email)) continue;
                seenEmails.add(email);

                const country = this.normalizeCountry(profile.location);
                const major = this.extractMajor(profile.bio, repos);
                const university = this.extractUniversity(profile.bio, profile.location);

                // Only include if country matches
                if (countries.some(c => country?.includes(c))) {
                    results.push({
                        name: profile.name || profile.login,
                        email: email,
                        phone: null,
                        university: university,
                        major: major,
                        degree: degree || 'Unknown Degree',
                        graduationYear: this.extractGradYear(profile.bio),
                        country: country,
                        platform: 'GitHub',
                        linkedIn: null,
                        resume: null,
                        scrapedAt: new Date()
                    });
                }

                if (results.length >= 150) {
                    console.log('Reached student limit from GitHub');
                    return results;
                }
            }
        }

        return results;
    }

    /**
     * Get user repositories
     */
    async getUserRepos(username) {
        try {
            const response = await axios.get(`${this.baseUrl}/users/${username}/repos`, {
                headers: this.headers,
                params: { per_page: 10, sort: 'updated' }
            });

            await this.delay(500);
            return response.data;
        } catch (error) {
            return [];
        }
    }

    /**
     * Check if user is likely a student
     */
    isLikelyStudent(profile, repos) {
        const bio = (profile.bio || '').toLowerCase();
        const studentKeywords = ['student', 'university', 'college', 'undergraduate', 'graduate', 'phd', 'master', 'bachelor'];

        // Check bio
        if (studentKeywords.some(keyword => bio.includes(keyword))) {
            return true;
        }

        // Check repos for academic projects
        const hasAcademicRepos = repos.some(repo => {
            const name = repo.name.toLowerCase();
            const desc = (repo.description || '').toLowerCase();
            return studentKeywords.some(keyword => name.includes(keyword) || desc.includes(keyword));
        });

        return hasAcademicRepos;
    }

    /**
     * Extract field/major from bio and repos
     */
    extractField(bio, targetFields = []) {
        if (!bio) return null;

        const bioLower = bio.toLowerCase();
        const fieldMap = {
            'computer science': ['cs', 'computer science', 'software', 'programming'],
            'data science': ['data science', 'machine learning', 'ml', 'ai', 'analytics'],
            'mechanical': ['mechanical', 'robotics', 'mechatronics'],
            'design': ['design', 'ui', 'ux', 'graphic']
        };

        for (const [field, keywords] of Object.entries(fieldMap)) {
            if (keywords.some(keyword => bioLower.includes(keyword))) {
                return field.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            }
        }

        return targetFields.length > 0 ? targetFields[0] : 'Computer Science';
    }

    /**
     * Extract major from bio and repos
     */
    extractMajor(bio, repos) {
        const field = this.extractField(bio);
        if (field) return field;

        // Check repo topics
        const topics = repos.flatMap(r => r.topics || []);
        const majorKeywords = {
            'Computer Science': ['javascript', 'python', 'java', 'cpp', 'web'],
            'Data Science': ['machine-learning', 'data-science', 'tensorflow', 'pytorch'],
            'Mechanical Engineering': ['robotics', 'cad', 'mechanical'],
            'Interior Design': ['design', '3d-modeling', 'architecture']
        };

        for (const [major, keywords] of Object.entries(majorKeywords)) {
            if (keywords.some(keyword => topics.includes(keyword))) {
                return major;
            }
        }

        return 'Computer Science';
    }

    /**
     * Extract university from bio or location
     */
    extractUniversity(bio, location) {
        const text = `${bio} ${location}`.toLowerCase();

        const universities = {
            'MIT': ['mit', 'massachusetts institute'],
            'Stanford University': ['stanford'],
            'UC Berkeley': ['berkeley', 'ucb'],
            'Harvard University': ['harvard'],
            'University of Toronto': ['toronto', 'uoft'],
            'University of Melbourne': ['melbourne'],
            'Carnegie Mellon': ['carnegie mellon', 'cmu'],
            'Caltech': ['caltech', 'california institute']
        };

        for (const [name, keywords] of Object.entries(universities)) {
            if (keywords.some(keyword => text.includes(keyword))) {
                return name;
            }
        }

        return 'Unknown University';
    }

    /**
     * Extract graduation year from bio
     */
    extractGradYear(bio) {
        if (!bio) return null;

        const yearMatch = bio.match(/20\d{2}|'\d{2}/);
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

    /**
     * Extract degree from bio
     */
    extractDegree(bio) {
        if (!bio) return null;
        const bioLower = bio.toLowerCase();

        if (bioLower.includes('b.tech') || bioLower.includes('btech')) return 'B.Tech';
        if (bioLower.includes('m.tech') || bioLower.includes('mtech')) return 'M.Tech';
        if (bioLower.includes('bca')) return 'BCA';
        if (bioLower.includes('mca')) return 'MCA';
        if (bioLower.includes('phd')) return 'PhD';
        if (bioLower.includes('bachelor')) return 'Bachelor';
        if (bioLower.includes('master')) return 'Master';

        return null;
    }

    /**
     * Extract job title from bio
     */
    extractJobTitle(bio, defaultTitle) {
        if (!bio) return defaultTitle;

        const titles = ['technical recruiter', 'talent acquisition', 'hiring manager', 'hr manager', 'recruitment specialist'];
        const bioLower = bio.toLowerCase();

        for (const title of titles) {
            if (bioLower.includes(title)) {
                return title.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            }
        }

        return 'Technical Recruiter';
    }

    /**
     * Normalize country from location string
     */
    normalizeCountry(location) {
        if (!location) return null;

        const locationLower = location.toLowerCase();

        if (locationLower.includes('usa') || locationLower.includes('united states') ||
            locationLower.includes('new york') || locationLower.includes('san francisco') ||
            locationLower.includes('california') || locationLower.includes('texas')) {
            return 'USA';
        }
        if (locationLower.includes('canada') || locationLower.includes('toronto') ||
            locationLower.includes('vancouver') || locationLower.includes('montreal')) {
            return 'Canada';
        }
        if (locationLower.includes('australia') || locationLower.includes('sydney') ||
            locationLower.includes('melbourne') || locationLower.includes('brisbane')) {
            return 'Australia';
        }

        return location;
    }

    /**
     * Generate email from username and company
     */
    generateEmail(username, company) {
        const domain = company ?
            `${company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com` :
            'github-user.com';
        return `${username.toLowerCase()}@${domain}`;
    }

    /**
     * Generate .edu email for students
     */
    generateEduEmail(username, location) {
        const university = this.extractUniversity('', location);
        const domain = university !== 'Unknown University' ?
            `${university.toLowerCase().split(' ')[0]}.edu` :
            'university.edu';
        return `${username.toLowerCase()}@${domain}`;
    }

    /**
     * Delay helper
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

export default GitHubScraper;
