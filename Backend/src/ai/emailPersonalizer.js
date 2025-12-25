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
 * Returns ONLY clean HTML, no comments or markdown
 */
export async function refineEmailTemplate(htmlContent) {
  try {
    const prompt = `
You are an expert email designer. Transform this email template into professional, deliverable HTML.

INPUT EMAIL:
${htmlContent}

CRITICAL OUTPUT RULES:
✓ Return ONLY complete, valid HTML code
✓ Start with <!DOCTYPE html>, end with </html>
✓ NO comments, NO markdown blocks, NO explanations
✓ Ensure ALL HTML tags are properly closed

APPLY THESE IMPROVEMENTS:

1. **Email-Safe Structure**:
   - Table-based layout (width: 600px max)
   - Inline CSS only (style="...")
   - Professional fonts: Arial, Helvetica, sans-serif
   - Centered content, 16-24px padding
   - DOCTYPE + viewport meta tags

2. **ANTI-SPAM (CRITICAL)**:
   Replace/remove these words:
   ❌ FREE, URGENT, ACT NOW, LIMITED TIME, CLICK HERE, BUY NOW, GUARANTEED, !!!, $$$
   ✓ Use natural, conversational language
   ✓ Max 2-3 links total
   ✓ Descriptive link text (NOT "click here")
   ✓ Include unsubscribe link in footer

3. **Professional Design**:
   - Clean color palette: Blues (#007bff), grays (#666), white backgrounds
   - Button CTAs: padding 12px 24px, border-radius 5px, professional text
   - Proper spacing between sections
   - Mobile-responsive (max-width: 100%)

4. **Personalization**:
   Add Handlebars placeholders: {{name}}, {{company}}, {{university}}, {{email}}
   Use naturally in greetings and content

5. **Complete HTML Template Structure**:
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Professional Subject Line</title>
</head>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background-color:#f4f4f4;">
  <table role="presentation" style="width:100%;border-collapse:collapse;">
    <tr><td align="center" style="padding:40px 0;">
      <table role="presentation" style="width:600px;max-width:100%;background:#fff;border-collapse:collapse;">
        <tr><td style="padding:40px 30px;">
          <!-- EMAIL CONTENT HERE -->
        </td></tr>
        <tr><td style="padding:20px 30px;background:#f8f8f8;text-align:center;font-size:12px;color:#666;">
          <a href="#" style="color:#007bff;text-decoration:none;">Unsubscribe</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>

IMPORTANT: Return the COMPLETE HTML from <!DOCTYPE to </html>. Do NOT truncate.
`;

    const model = genAI.getGenerativeModel({ model: config.GEMINI_MODEL || "gemini-1.5-flash" });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3, // Lower for consistency
        maxOutputTokens: 8000, // Increased to prevent truncation
      },
    });

    let refinedHtml = result.response.text().trim();

    // Remove markdown code blocks
    refinedHtml = refinedHtml.replace(/```html\n?/gi, '');
    refinedHtml = refinedHtml.replace(/```\n?/g, '');

    // Remove HTML comments
    refinedHtml = refinedHtml.replace(/<!--[\s\S]*?-->/g, '');

    // Extract HTML content
    const doctypeMatch = refinedHtml.match(/(<!DOCTYPE[\s\S]*<\/html>)/i);
    if (doctypeMatch) {
      refinedHtml = doctypeMatch[1];
    } else {
      const htmlMatch = refinedHtml.match(/(<html[\s\S]*<\/html>)/i);
      if (htmlMatch) {
        refinedHtml = htmlMatch[1];
      }
    }

    refinedHtml = refinedHtml.trim();

    // Validate HTML completeness
    if (!refinedHtml.includes('<html')) {
      console.error('AI response missing <html> tag');
      throw new Error('Incomplete HTML - missing html tag');
    }

    if (!refinedHtml.includes('</html>')) {
      console.error('AI response missing </html> closing tag - HTML was truncated');
      throw new Error('Incomplete HTML - missing closing html tag (likely truncated)');
    }

    if (!refinedHtml.includes('</body>')) {
      console.error('AI response missing </body> tag');
      throw new Error('Incomplete HTML - missing closing body tag');
    }

    // Check for balanced table tags
    const tableOpenCount = (refinedHtml.match(/<table/gi) || []).length;
    const tableCloseCount = (refinedHtml.match(/<\/table>/gi) || []).length;

    if (tableOpenCount !== tableCloseCount) {
      console.error(`Unbalanced table tags: ${tableOpenCount} open, ${tableCloseCount} close`);
      throw new Error('Incomplete HTML - unbalanced table tags (likely truncated)');
    }

    console.log('✓ Email template refined successfully, HTML validation passed');
    return refinedHtml;

  } catch (error) {
    console.error("Template refinement error:", error.message);

    // If refinement failed, wrap original content in proper email structure
    console.log('Falling back to structured wrapper for original content');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Template</title>
</head>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background-color:#f4f4f4;">
  <table role="presentation" style="width:100%;border-collapse:collapse;">
    <tr><td align="center" style="padding:40px 0;">
      <table role="presentation" style="width:600px;max-width:100%;background:#fff;border-collapse:collapse;">
        <tr><td style="padding:40px 30px;">
          ${htmlContent}
        </td></tr>
        <tr><td style="padding:20px 30px;background:#f8f8f8;text-align:center;font-size:12px;color:#666;">
          <a href="#" style="color:#007bff;text-decoration:none;">Unsubscribe</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
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