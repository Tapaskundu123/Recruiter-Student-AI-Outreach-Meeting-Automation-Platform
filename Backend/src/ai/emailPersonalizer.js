import { GoogleGenerativeAI } from "@google/generative-ai";
import config from "../config/index.js";
import Handlebars from "handlebars";

const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);

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

    const model = genAI.getGenerativeModel({ model: config.GEMINI_MODEL || "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);

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

    const model = genAI.getGenerativeModel({ model: config.GEMINI_MODEL || "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);

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

    const model = genAI.getGenerativeModel({ model: config.GEMINI_MODEL || "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);

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
 * Includes anti-spam measures and email best practices
 */
export async function refineEmailTemplate(htmlContent) {
  try {
    const prompt = `
You are an expert email designer and copywriter specializing in professional, deliverable emails.

Analyze and refine the following HTML email template to make it look professional, human-written, and spam-filter friendly.

HTML TEMPLATE:
${htmlContent}

REFINEMENT REQUIREMENTS:

1. **Professional Visual Design**:
   - Add modern styling with inline CSS (required for email clients)
   - Use professional, web-safe fonts (Arial, Helvetica, Georgia, sans-serif)
   - Ensure responsive design with max-width: 600px
   - Add proper spacing and padding (16-24px)
   - Use a professional color scheme (avoid bright reds, excessive colors)
   - Add subtle borders and backgrounds where appropriate

2. **Email Client Compatibility**:
   - Use table-based layouts for maximum compatibility
   - All CSS must be inline
   - Avoid external resources or scripts
   - Include proper DOCTYPE and meta tags
   - Add alt text for any images
   - Use background colors sparingly

3. **Anti-Spam Best Practices**:
   - AVOID spam trigger words like: FREE, URGENT, ACT NOW, LIMITED TIME, CLICK HERE, $$$, !!!, BUY NOW, GUARANTEED
   - Use a balanced text-to-image ratio (mostly text)
   - Avoid excessive capitalization
   - Include proper sender context
   - Use natural, conversational language
   - Avoid excessive links (max 2-3)
   - Include a clear, visible unsubscribe option
   - Maintain proper HTML structure with semantic tags

4. **Professional Copywriting**:
   - Make the text sound natural and human
   - Improve grammar and flow
   - Add warmth to the tone while keeping it professional
   - Ensure proper paragraph breaks and readability
   - Use clear, concise sentences
   - Add a compelling but professional subject line in an HTML comment

5. **Personalization Placeholders**:
   - Add Handlebars placeholders where appropriate:
     * {{name}} for recipient name
     * {{company}} for company name
     * {{university}} for university name
     * {{email}} for recipient email
     * etc.

6. **Email Deliverability**:
   - Add a plain text version in HTML comments for reference
   - Include proper header structure (h1, h2, p tags)
   - Use semantic HTML5 tags
   - Ensure proper encoding (UTF-8)

7. **CTA Best Practices**:
   - Make call-to-action buttons obvious but not aggressive
   - Use button-style links (not just text links)
   - Clear, action oriented but professional CTA text

Return ONLY the refined HTML template with all improvements applied. Do not include any explanations or markdown code blocks.
`;

    const model = genAI.getGenerativeModel({ model: config.GEMINI_MODEL || "gemini-2.5-flash" });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 3000,
      },
    });

    let refinedHtml = result.response.text().trim();

    // Remove markdown code block if present
    const htmlMatch = refinedHtml.match(/```html\n?([\s\S]*?)```/);
    if (htmlMatch) {
      refinedHtml = htmlMatch[1].trim();
    }

    // Additional cleanup - remove any remaining markdown
    refinedHtml = refinedHtml.replace(/```[\s\S]*?```/g, '');

    return refinedHtml;

  } catch (error) {
    console.error("Template refinement error (Gemini):", error.message);
    // Return original content if refinement fails
    return htmlContent;
  }
}

/**
 * Generate email with context from RAG system
 * Uses retrieved context chunks to create highly personalized, context-aware emails
 */
export async function generateEmailWithContext({ recipientData, purpose, tone, contextChunks }) {
  try {
    // Format context for prompt
    const contextText = contextChunks && contextChunks.length > 0
      ? contextChunks.map((chunk, idx) =>
        `[Context ${idx + 1} from ${chunk.fileName}]:\n${chunk.text}`
      ).join('\n\n')
      : '';

    const prompt = `
You are an expert email copywriter specializing in professional, human-like outreach emails.

${contextText ? `
IMPORTANT COMPANY/APP CONTEXT:
The following information has been retrieved from our documents and should be referenced naturally in the email:

${contextText}

Use this context to make the email specific and informative. Reference actual features, benefits, or details from the context.
` : ''}

RECIPIENT INFORMATION:
${JSON.stringify(recipientData, null, 2)}

EMAIL PURPOSE: ${purpose}
DESIRED TONE: ${tone}

INSTRUCTIONS:
1. Generate a compelling subject line (under 60 characters)
2. Write a professional email body that:
   - Starts with a warm, personalized greeting
   ${contextText ? '- Naturally incorporates specific details from the provided context' : ''}
   - References the recipient's background (company, university, role, etc.) if available
   - Clearly communicates the purpose
   - Feels human and genuine, NOT robotic or templated
   ${contextText ? '- Highlights relevant features or benefits from our app/company context' : ''}
   - Includes a clear, non-pushy call-to-action
   - Ends professionally
3. Use proper HTML formatting for email
4. CRITICAL: Avoid ALL spam trigger words including:
   - FREE, URGENT, ACT NOW, LIMITED TIME, GUARANTEED
   - Excessive punctuation like !!!
   - All caps words
   - Phrases like "CLICK HERE", "BUY NOW"
5. Keep it concise (200-300 words max)

OUTPUT FORMAT (JSON):
{
  "subject": "Your professional subject line here",
  "content": "<html email content with inline CSS>"
}

Return ONLY the JSON object, no other text.
`;

    const model = genAI.getGenerativeModel({ model: config.GEMINI_MODEL || "gemini-2.5-flash" });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2000,
      },
    });

    const responseText = result.response.text().trim();

    // Try to parse JSON response
    let jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        subject: parsed.subject || `Regarding ${purpose}`,
        content: parsed.content || responseText
      };
    }

    // Fallback: treat entire response as content
    return {
      subject: `Regarding ${purpose}`,
      content: responseText
    };

  } catch (error) {
    console.error("Context-aware email generation error (Gemini):", error.message);

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

export default {
  personalizeEmail,
  generateSubject,
  generateEmailContent,
  refineEmailTemplate,
  generateEmailWithContext,
};