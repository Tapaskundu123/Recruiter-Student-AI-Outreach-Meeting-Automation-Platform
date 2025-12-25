import pdf from 'pdf-parse';

/**
 * Extract text from PDF buffer
 * @param {Buffer} pdfBuffer - PDF file buffer
 * @returns {Promise<Object>} - {text, pages, info}
 */
export async function extractTextFromPDF(pdfBuffer) {
    try {
        const data = await pdf(pdfBuffer);

        return {
            text: data.text,
            pageCount: data.numpages,
            info: data.info,
            metadata: data.metadata
        };
    } catch (error) {
        console.error('Error extracting text from PDF:', error.message);
        throw new Error('Failed to parse PDF file');
    }
}

/**
 * Clean and normalize extracted text
 * @param {String} text - Raw text from PDF
 * @returns {String} - Cleaned text
 */
export function cleanText(text) {
    if (!text) return '';

    return text
        // Remove multiple consecutive whitespaces
        .replace(/\s+/g, ' ')
        // Remove multiple consecutive newlines
        .replace(/\n\s*\n\s*\n/g, '\n\n')
        // Remove special characters that might cause issues
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        // Trim whitespace
        .trim();
}

/**
 * Chunk text into smaller pieces with overlap for better context preservation
 * @param {String} text - Text to chunk
 * @param {Object} options - {chunkSize, overlap, minChunkSize}
 * @returns {Array<Object>} - Array of {text, index, startChar, endChar}
 */
export function chunkText(text, options = {}) {
    const {
        chunkSize = 800,        // Characters per chunk
        overlap = 100,           // Overlap between chunks
        minChunkSize = 100       // Minimum chunk size
    } = options;

    if (!text || text.length === 0) {
        return [];
    }

    const chunks = [];
    let startIndex = 0;
    let chunkIndex = 0;

    while (startIndex < text.length) {
        let endIndex = Math.min(startIndex + chunkSize, text.length);

        // Try to break at sentence boundaries
        if (endIndex < text.length) {
            // Look for sentence ending within last 100 characters
            const searchStart = Math.max(endIndex - 100, startIndex);
            const segment = text.substring(searchStart, endIndex);
            const lastPeriod = segment.lastIndexOf('.');
            const lastQuestion = segment.lastIndexOf('?');
            const lastExclamation = segment.lastIndexOf('!');

            const lastSentenceEnd = Math.max(lastPeriod, lastQuestion, lastExclamation);

            if (lastSentenceEnd > 0) {
                endIndex = searchStart + lastSentenceEnd + 1;
            }
        }

        const chunkText = text.substring(startIndex, endIndex).trim();

        if (chunkText.length >= minChunkSize) {
            chunks.push({
                text: chunkText,
                index: chunkIndex,
                startChar: startIndex,
                endChar: endIndex,
                length: chunkText.length
            });
            chunkIndex++;
        }

        // Move start position forward with overlap
        startIndex = endIndex - overlap;

        // Ensure we make progress
        if (startIndex <= chunks[chunks.length - 1]?.startChar) {
            startIndex = endIndex;
        }
    }

    console.log(`✅ Created ${chunks.length} chunks from text (${text.length} chars)`);
    return chunks;
}

/**
 * Chunk text by token count (approximate)
 * @param {String} text - Text to chunk
 * @param {Object} options - {tokensPerChunk, overlapTokens}
 * @returns {Array<Object>} - Array of chunks
 */
export function chunkTextByTokens(text, options = {}) {
    const {
        tokensPerChunk = 500,
        overlapTokens = 50
    } = options;

    // Approximate: 1 token ≈ 4 characters for English text
    const charsPerToken = 4;
    const chunkSize = tokensPerChunk * charsPerToken;
    const overlap = overlapTokens * charsPerToken;

    return chunkText(text, {
        chunkSize,
        overlap,
        minChunkSize: 100
    });
}

/**
 * Process PDF buffer into chunks ready for embedding
 * @param {Buffer} pdfBuffer - PDF file buffer
 * @param {String} fileName - Original filename
 * @param {Object} options - Chunking options
 * @returns {Promise<Object>} - {chunks, metadata}
 */
export async function processPDFTochunks(pdfBuffer, fileName, options = {}) {
    try {
        // Extract text
        const { text, pageCount, info, metadata } = await extractTextFromPDF(pdfBuffer);

        if (!text || text.trim().length === 0) {
            throw new Error('No text content found in PDF');
        }

        // Clean text
        const cleanedText = cleanText(text);

        // Chunk text
        const chunks = chunkTextByTokens(cleanedText, options);

        return {
            chunks,
            metadata: {
                fileName,
                pageCount,
                totalCharacters: text.length,
                cleanedCharacters: cleanedText.length,
                chunkCount: chunks.length,
                pdfInfo: info,
                pdfMetadata: metadata
            }
        };
    } catch (error) {
        console.error('Error processing PDF to chunks:', error.message);
        throw error;
    }
}

/**
 * Extract category from PDF content (simple heuristic)
 * @param {String} text - PDF text content
 * @returns {String} - Detected category
 */
export function detectCategory(text) {
    const textLower = text.toLowerCase();

    // Check for common keywords
    const categories = {
        'app_info': ['application', 'app features', 'platform', 'software', 'mobile app', 'web app'],
        'company_info': ['company', 'organization', 'about us', 'mission', 'vision', 'values'],
        'product_details': ['product', 'service', 'offering', 'pricing', 'plans'],
        'recruiting': ['recruiting', 'hiring', 'talent', 'recruitment', 'candidates'],
        'technical': ['api', 'technical', 'integration', 'documentation', 'sdk']
    };

    for (const [category, keywords] of Object.entries(categories)) {
        for (const keyword of keywords) {
            if (textLower.includes(keyword)) {
                return category;
            }
        }
    }

    return 'general';
}

export default {
    extractTextFromPDF,
    cleanText,
    chunkText,
    chunkTextByTokens,
    processPDFTochunks,
    detectCategory
};
