import OpenAI from 'openai';
import config from '../config/index.js';

const openai = new OpenAI({
    apiKey: config.OPENAI_API_KEY
});

/**
 * Clean and enrich scraped data using AI
 */
export async function cleanAndEnrichData(rawData, dataType) {
    const cleaned = [];

    for (const record of rawData) {
        try {
            const result = await cleanSingleRecord(record, dataType);
            if (result) {
                cleaned.push(result);
            }
        } catch (error) {
            console.error('Error cleaning record:', error.message);
        }
    }

    return cleaned;
}

/**
 * Clean a single record using GPT
 */
async function cleanSingleRecord(record, dataType) {
    try {
        const prompt = dataType === 'recruiter'
            ? createRecruiterPrompt(record)
            : createStudentPrompt(record);

        const response = await openai.chat.completions.create({
            model: config.OPENAI_MODEL,
            messages: [
                {
                    role: 'system',
                    content: 'You are a data cleaning assistant. Clean and normalize the provided data, fix any errors, and extract structured information. Return only valid JSON.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.3,
            response_format: { type: 'json_object' }
        });

        const cleanedData = JSON.parse(response.choices[0].message.content);

        // Validate required fields
        if (!cleanedData.email || !isValidEmail(cleanedData.email)) {
            return null;
        }

        return {
            ...cleanedData,
            scrapedAt: new Date()
        };
    } catch (error) {
        console.error('OpenAI cleaning error:', error.message);
        return null;
    }
}

/**
 * Create prompt for recruiter data
 */
function createRecruiterPrompt(record) {
    return `Clean and normalize this recruiter data:
${JSON.stringify(record, null, 2)}

Extract and return JSON with these fields:
- name: (properly capitalized full name)
- email: (validated email address)
- company: (company name)
- jobTitle: (job title/role)
- linkedIn: (LinkedIn URL if available)
- country: (country name)
- field: (industry/field like Technology, Finance, Healthcare)

If any field is missing or invalid, omit it or set to null.`;
}

/**
 * Create prompt for student data
 */
function createStudentPrompt(record) {
    return `Clean and normalize this student data:
${JSON.stringify(record, null, 2)}

Extract and return JSON with these fields:
- name: (properly capitalized full name)
- email: (validated email address)
- university: (university name)
- major: (field of study if available)
- graduationYear: (estimated graduation year as integer, if determinable)
- country: (country name if available)
- linkedIn: (LinkedIn URL if available)

If any field is missing or invalid, omit it or set to null.`;
}

/**
 * Validate email format
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Detect duplicate records
 */
export async function detectDuplicates(records) {
    const emailSet = new Set();
    const unique = [];

    for (const record of records) {
        if (!emailSet.has(record.email)) {
            emailSet.add(record.email);
            unique.push(record);
        }
    }

    return unique;
}

export default {
    cleanAndEnrichData,
    detectDuplicates
};
