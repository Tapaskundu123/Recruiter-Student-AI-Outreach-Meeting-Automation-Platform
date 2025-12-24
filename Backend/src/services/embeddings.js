import { GoogleGenerativeAI } from "@google/generative-ai";
import config from "../config/index.js";

const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);

/**
 * Generate embedding for a single text using Google's text-embedding-004 model
 * @param {String} text - Text to generate embedding for
 * @returns {Promise<Array<Number>>} - 768-dimensional embedding vector
 */
export async function generateEmbedding(text) {
    try {
        if (!text || text.trim().length === 0) {
            throw new Error('Text cannot be empty');
        }

        const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
        
        const result = await model.embedContent(text);
        const embedding = result.embedding;
        
        return embedding.values;
    } catch (error) {
        console.error('Error generating embedding:', error.message);
        throw error;
    }
}

/**
 * Generate embeddings for multiple texts in batch
 * @param {Array<String>} texts - Array of texts
 * @returns {Promise<Array<Array<Number>>>} - Array of embedding vectors
 */
export async function generateEmbeddingsBatch(texts) {
    try {
        if (!texts || texts.length === 0) {
            throw new Error('Texts array cannot be empty');
        }

        const embeddings = [];
        
        // Process in batches to avoid rate limiting
        const batchSize = 5;
        for (let i = 0; i < texts.length; i += batchSize) {
            const batch = texts.slice(i, i + batchSize);
            
            const batchPromises = batch.map(text => generateEmbedding(text));
            const batchResults = await Promise.all(batchPromises);
            
            embeddings.push(...batchResults);
            
            // Add small delay between batches to respect rate limits
            if (i + batchSize < texts.length) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        console.log(`✅ Generated ${embeddings.length} embeddings`);
        return embeddings;
    } catch (error) {
        console.error('Error generating embeddings batch:', error.message);
        throw error;
    }
}

/**
 * Generate embedding for a query (optimized for search)
 * @param {String} query - Query text
 * @returns {Promise<Array<Number>>} - Embedding vector
 */
export async function generateQueryEmbedding(query) {
    try {
        // For queries, we can add context to improve search relevance
        const enhancedQuery = `Represent this query for searching relevant documents: ${query}`;
        return await generateEmbedding(enhancedQuery);
    } catch (error) {
        console.error('Error generating query embedding:', error.message);
        // Fallback to regular embedding
        return await generateEmbedding(query);
    }
}

/**
 * Calculate cosine similarity between two vectors
 * @param {Array<Number>} vecA 
 * @param {Array<Number>} vecB 
 * @returns {Number} - Similarity score (0-1)
 */
export function cosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) {
        throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
        return 0;
    }

    return dotProduct / (normA * normB);
}

/**
 * Get embedding dimension
 * @returns {Number} - Embedding dimension (768 for text-embedding-004)
 */
export function getEmbeddingDimension() {
    return 768;
}

export default {
    generateEmbedding,
    generateEmbeddingsBatch,
    generateQueryEmbedding,
    cosineSimilarity,
    getEmbeddingDimension
};
