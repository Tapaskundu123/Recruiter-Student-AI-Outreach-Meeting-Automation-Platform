import { GoogleGenerativeAI } from "@google/generative-ai";
import config from "../config/index.js";

const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: config.GEMINI_MODEL || "gemini-1.5-flash",
});

/**
 * Enrich profile data with additional context (Gemini)
 */
export async function enrichProfile(profileData, profileType) {
  try {
    const prompt =
      profileType === "recruiter"
        ? createRecruiterEnrichmentPrompt(profileData)
        : createStudentEnrichmentPrompt(profileData);

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `
You are a research assistant.
Provide additional context and insights about profiles based on available information.
Return ONLY valid JSON.

${prompt}
              `,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.5,
      },
    });

    const text = result.response.text();

    // Remove ```json wrapper if Gemini adds it
    const jsonString = text.replace(/```json|```/g, "").trim();
    const enrichedData = JSON.parse(jsonString);

    return {
      ...profileData,
      enrichedData,
    };
  } catch (error) {
    console.error("Profile enrichment error (Gemini):", error.message);
    return profileData;
  }
}

/**
 * Recruiter enrichment prompt
 */
function createRecruiterEnrichmentPrompt(profile) {
  return `
Based on this recruiter profile, infer additional context.

Profile:
${JSON.stringify(profile, null, 2)}

Return JSON with:
- industry
- seniority (entry/mid/senior/executive)
- specializations (array)
- companySize (startup/small/medium/large/enterprise)
- likelyInterests (array)
- outreachTips (string)

Only infer what is reasonable. Use null if unknown.
`;
}

/**
 * Student enrichment prompt
 */
function createStudentEnrichmentPrompt(profile) {
  return `
Based on this student profile, infer additional context.

Profile:
${JSON.stringify(profile, null, 2)}

Return JSON with:
- academicLevel (undergraduate/graduate/phd)
- careerInterests (array)
- skills (array)
- industryFit (array)
- outreachTips (string)

Only infer what is reasonable. Use null if unknown.
`;
}

export default {
  enrichProfile,
};
