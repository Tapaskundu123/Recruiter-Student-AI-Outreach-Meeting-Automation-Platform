import { GoogleGenerativeAI } from "@google/generative-ai";
import config from "../config/index.js"; import Handlebars from "handlebars";

const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: config.GEMINI_MODEL || "gemini-1.5-flash",
});

/**
 * Personalize email template using Gemini AI
 */
export async function personalizeEmail({ template, recipientData }) {
  try {
    // Compile Handlebars template first
    const compiledTemplate = Handlebars.compile(template);
    const basicEmail = compiledTemplate(recipientData);

    const prompt = `
You are an expert email copywriter.
Personalize the following email while keeping it professional and natural.

Recipient Information:
${JSON.stringify(recipientData, null, 2)}

Email Template:
${basicEmail}

Instructions:
- Add a personalized greeting
- Reference recipient-specific details (company, university, role, etc.)
- Keep the core message intact
- Make it feel human, not automated
- Return ONLY the personalized email content in valid HTML
`;

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      },
    });

    return result.response.text().trim();
  } catch (error) {
    console.error("Email personalization error (Gemini):", error.message);

    // Fallback → basic Handlebars template
    const compiledTemplate = Handlebars.compile(template);
    return compiledTemplate(recipientData);
  }
}

/**
 * Generate email subject line using Gemini
 */
export async function generateSubject({ recipientData, campaignGoal }) {
  try {
    const prompt = `
You are an expert email marketer.
Generate a short, compelling email subject line (under 60 characters).

Recipient:
Name: ${recipientData.name || "Recipient"}
${recipientData.company ? `Company: ${recipientData.company}` : ""}
${recipientData.university ? `University: ${recipientData.university}` : ""}

Campaign Goal:
${campaignGoal}

Rules:
- Keep it engaging
- No emojis unless professional
- Return ONLY the subject line
`;

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 50,
      },
    });

    return result.response.text().replace(/"/g, "").trim();
  } catch (error) {
    console.error("Subject generation error (Gemini):", error.message);
    return `Hello ${recipientData.name || ""}`.trim();
  }
}

/**
 * Generate complete email content from scratch using Gemini AI
 */
export async function generateEmailContent({ recipientType, recipientData, purpose, tone }) {
  try {
    const prompt = `
You are an expert email copywriter specializing in professional outreach.

Generate a complete, professional email for the following scenario:

RECIPIENT TYPE: ${recipientType}
RECIPIENT INFO:
${JSON.stringify(recipientData, null, 2)}

EMAIL PURPOSE: ${purpose}
TONE: ${tone}

REQUIREMENTS:
1. Generate an engaging subject line (under 60 characters)
2. Write a personalized email body that:
   - Starts with a warm, personalized greeting
   - References specific details about the recipient (company, university, role, etc.)
   - Clearly communicates the purpose
   - Includes a clear call-to-action
   - Ends professionally
3. The email should feel human and genuine, not automated
4. Use proper HTML formatting for the email body

OUTPUT FORMAT (JSON):
{
  "subject": "Your subject line here",
  "content": "<html email content here with proper tags>"
}

Return ONLY the JSON object, no other text.
`;

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1500,
      },
    });

    const responseText = result.response.text().trim();

    // Try to parse JSON response
    let jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        subject: parsed.subject || "Follow-up",
        content: parsed.content || responseText
      };
    }

    // Fallback: treat entire response as content
    return {
      subject: `Regarding ${purpose}`,
      content: responseText
    };

  } catch (error) {
    console.error("Email generation error (Gemini):", error.message);

    // Fallback to basic template
    return {
      subject: `Hello ${recipientData.name || ""}`,
      content: `
        <p>Hi ${recipientData.name || "there"},</p>
        <p>I hope this email finds you well.</p>
        <p>${purpose}</p>
        <p>Looking forward to connecting with you.</p>
        <p>Best regards</p>
      `
    };
  }
}

/**
 * Refine an uploaded HTML template to make it look professional and human-written
 */
export async function refineEmailTemplate(htmlContent) {
  try {
    const prompt = `
You are an expert email designer and copywriter.

Analyze and refine the following HTML email template to make it look professional and human-written.

HTML TEMPLATE:
${htmlContent}

REFINEMENT REQUIREMENTS:
1. Keep the core structure and content
2. Improve the visual design:
   - Add modern styling with inline CSS
   - Use professional fonts (e.g., Arial, Helvetica, sans-serif)
   - Ensure responsive design
   - Add proper spacing and padding
   - Use a professional color scheme
3. Enhance the copywriting:
   - Make the text sound natural and human
   - Improve grammar and flow
   - Add warmth to the tone while keeping it professional
   - Ensure proper paragraph breaks
4. Add Handlebars placeholders where appropriate:
   - {{name}} for recipient name
   - {{company}} for company name
   - {{university}} for university name
   - etc.
5. Ensure the HTML is valid and email-client compatible
6. Do NOT add JavaScript or external CSS

Return ONLY the refined HTML template, nothing else.
`;

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 2000,
      },
    });

    const refinedHtml = result.response.text().trim();

    // Remove markdown code block if present
    const htmlMatch = refinedHtml.match(/```html\n?([\s\S]*?)```/);
    if (htmlMatch) {
      return htmlMatch[1].trim();
    }

    return refinedHtml;

  } catch (error) {
    console.error("Template refinement error (Gemini):", error.message);
    // Return original content if refinement fails
    return htmlContent;
  }
}

export default {
  personalizeEmail,
  generateSubject,
  generateEmailContent,
  refineEmailTemplate,
};
