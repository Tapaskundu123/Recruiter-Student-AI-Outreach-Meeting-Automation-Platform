import { GoogleGenerativeAI } from "@google/generative-ai";
import config from "../config/index.js";
import Handlebars from "handlebars";

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

export default {
  personalizeEmail,
  generateSubject,
};
