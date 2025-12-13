import OpenAI from 'openai';
import config from '../config/index.js';
import Handlebars from 'handlebars';

const openai = new OpenAI({
    apiKey: config.OPENAI_API_KEY
});

/**
 * Personalize email template using AI
 */
export async function personalizeEmail({ template, recipientData }) {
    try {
        // First, compile Handlebars template with basic data
        const compiledTemplate = Handlebars.compile(template);
        const basicEmail = compiledTemplate(recipientData);

        // Then enhance with AI personalization
        const prompt = `Personalize this email for the recipient. Make it engaging and natural while maintaining professionalism.

Recipient Information:
${JSON.stringify(recipientData, null, 2)}

Email Template:
${basicEmail}

Instructions:
- Add a personalized greeting
- Reference specific details about the recipient (company, university, role, etc.)
- Keep the core message intact
- Make it feel personal, not automated
- Return only the personalized email content (HTML format)`;

        const response = await openai.chat.completions.create({
            model: config.OPENAI_MODEL,
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert email copywriter. Personalize emails to make them engaging and relevant to each recipient.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 1000
        });

        return response.choices[0].message.content;
    } catch (error) {
        console.error('Email personalization error:', error.message);
        // Fallback to basic template if AI fails
        const compiledTemplate = Handlebars.compile(template);
        return compiledTemplate(recipientData);
    }
}

/**
 * Generate email subject line using AI
 */
export async function generateSubject({ recipientData, campaignGoal }) {
    try {
        const prompt = `Generate a compelling email subject line.

Recipient: ${recipientData.name}
${recipientData.company ? `Company: ${recipientData.company}` : ''}
${recipientData.university ? `University: ${recipientData.university}` : ''}
Campaign Goal: ${campaignGoal}

Create a short, engaging subject line (under 60 characters) that will make them want to open the email.`;

        const response = await openai.chat.completions.create({
            model: config.OPENAI_MODEL,
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert email marketer. Create compelling subject lines that drive opens.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.8,
            max_tokens: 50
        });

        return response.choices[0].message.content.replace(/"/g, '').trim();
    } catch (error) {
        console.error('Subject generation error:', error.message);
        return `Hello ${recipientData.name}`;
    }
}

export default {
    personalizeEmail,
    generateSubject
};
