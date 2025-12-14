import { GoogleGenerativeAI } from "@google/generative-ai";
import config from "../config/index.js";

const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: config.GEMINI_MODEL || "gemini-1.5-flash",
});

/**
 * Clean and enrich scraped data using Gemini
 */
export async function cleanAndEnrichData(rawData, dataType) {
  const cleaned = [];

  for (const record of rawData) {
    try {
      const result = await cleanSingleRecord(record, dataType);
      if (result) cleaned.push(result);
    } catch (error) {
      console.error("Error cleaning record:", error.message);
    }
  }

  return cleaned;
}

/**
 * Clean a single record using Gemini
 */
async function cleanSingleRecord(record, dataType) {
  try {
    const prompt =
      dataType === "recruiter"
        ? createRecruiterPrompt(record)
        : createStudentPrompt(record);

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `
You are a data cleaning assistant.
Clean and normalize the provided data, fix errors, and extract structured information.
Return ONLY valid JSON.

${prompt}
              `,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.3,
      },
    });

    const text = result.response.text();

    // Gemini sometimes wraps JSON in ```json
    const jsonString = text.replace(/```json|```/g, "").trim();
    const cleanedData = JSON.parse(jsonString);

    // Validate required fields
    if (!cleanedData.email || !isValidEmail(cleanedData.email)) {
      return null;
    }

    return {
      ...cleanedData,
      scrapedAt: new Date(),
    };
  } catch (error) {
    console.error("Gemini cleaning error:", error.message);
    return null;
  }
}

/**
 * Recruiter prompt
 */
function createRecruiterPrompt(record) {
  return `
Clean and normalize this recruiter data:
${JSON.stringify(record, null, 2)}

Return JSON with:
- name
- email
- company
- jobTitle
- linkedIn
- country
- field (Technology, Finance, Healthcare, etc.)

Use null if unknown.
`;
}

/**
 * Student prompt
 */
function createStudentPrompt(record) {
  return `
Clean and normalize this student data:
${JSON.stringify(record, null, 2)}

Return JSON with:
- name
- email
- university
- major
- graduationYear (integer)
- country
- linkedIn

Use null if unknown.
`;
}

/**
 * Email validation
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Detect duplicate records by email
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
  detectDuplicates,
};
