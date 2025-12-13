import OpenAI from 'openai';
import config from '../config/index.js';

const openai = new OpenAI({
    apiKey: config.OPENAI_API_KEY
});

/**
 * Enrich profile data with additional context
 */
export async function enrichProfile(profileData, profileType) {
    try {
        const prompt = profileType === 'recruiter'
            ? createRecruiterEnrichmentPrompt(profileData)
            : createStudentEnrichmentPrompt(profileData);

        const response = await openai.chat.completions.create({
            model: config.OPENAI_MODEL,
            messages: [
                {
                    role: 'system',
                    content: 'You are a research assistant. Provide additional context and insights about profiles based on available information.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.5,
            response_format: { type: 'json_object' }
        });

        const enrichedData = JSON.parse(response.choices[0].message.content);

        return {
            ...profileData,
            enrichedData: enrichedData
        };
    } catch (error) {
        console.error('Profile enrichment error:', error.message);
        return profileData;
    }
}

/**
 * Create enrichment prompt for recruiter
 */
function createRecruiterEnrichmentPrompt(profile) {
    return `Based on this recruiter profile, infer additional context:

Profile:
${JSON.stringify(profile, null, 2)}

Return JSON with:
- industry: (likely industry based on company/title)
- seniority: (entry/mid/senior/executive level)
- specializations: (array of recruiting specializations like "tech", "executive", etc.)
- companySize: (startup/small/medium/large/enterprise - if company is known)
- likelyInterests: (array of professional interests)
- outreachTips: (brief tips for effective outreach)

Only include what can be reasonably inferred. Use null for unknowns.`;
}

/**
 * Create enrichment prompt for student
 */
function createStudentEnrichmentPrompt(profile) {
    return `Based on this student profile, infer additional context:

Profile:
${JSON.stringify(profile, null, 2)}

Return JSON with:
- academicLevel: (undergraduate/graduate/phd)
- careerInterests: (array of likely career interests based on major)
- skills: (array of likely skills based on major/university)
- industryFit: (array of industries that match their background)
- outreachTips: (brief tips for effective outreach to this student)

Only include what can be reasonably inferred. Use null for unknowns.`;
}

export default {
    enrichProfile
};
