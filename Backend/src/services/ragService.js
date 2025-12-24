import prisma from '../db/client.js';
import { processPDFTochunks, detectCategory } from './pdfProcessor.js';
import { generateEmbeddingsBatch, generateQueryEmbedding } from './embeddings.js';
import { upsertVectors, queryVectors, deleteVectorsByDocument } from './pinecone.js';

/**
 * Process and store PDF document in vector database
 * @param {Buffer} pdfBuffer - PDF file buffer
 * @param {String} fileName - Original filename
 * @param {Object} options - {category, uploadedBy}
 * @returns {Promise<Object>} - {documentId, chunkCount}
 */
export async function processAndStoreDocument(pdfBuffer, fileName, options = {}) {
    let document = null;

    try {
        // Step 1: Process PDF into chunks
        console.log(`📄 Processing PDF: ${fileName}...`);
        const { chunks, metadata } = await processPDFTochunks(pdfBuffer, fileName);

        if (chunks.length === 0) {
            throw new Error('No chunks created from PDF');
        }

        // Step 2: Auto-detect category if not provided
        const category = options.category || detectCategory(chunks.map(c => c.text).join(' '));

        // Step 3: Create document record in database
        document = await prisma.document.create({
            data: {
                fileName,
                fileSize: pdfBuffer.length,
                category,
                uploadedBy: options.uploadedBy || null,
                status: 'processing',
                chunkCount: chunks.length
            }
        });

        console.log(`📝 Created document record: ${document.id}`);

        // Step 4: Generate embeddings for all chunks
        console.log(`🔢 Generating embeddings for ${chunks.length} chunks...`);
        const texts = chunks.map(chunk => chunk.text);
        const embeddings = await generateEmbeddingsBatch(texts);

        // Step 5: Prepare vectors for Pinecone
        const vectors = chunks.map((chunk, index) => ({
            id: `doc_${document.id}_chunk_${chunk.index}`,
            values: embeddings[index],
            metadata: {
                documentId: document.id,
                fileName: document.fileName,
                category: document.category,
                chunkIndex: chunk.index,
                text: chunk.text,
                uploadDate: document.uploadDate.toISOString(),
                startChar: chunk.startChar,
                endChar: chunk.endChar,
                length: chunk.length
            }
        }));

        // Step 6: Upsert to Pinecone
        console.log(`📤 Uploading vectors to Pinecone...`);
        await upsertVectors(vectors);

        // Step 7: Update document status
        document = await prisma.document.update({
            where: { id: document.id },
            data: { status: 'ready' }
        });

        console.log(`✅ Document processed successfully: ${document.id}`);

        return {
            documentId: document.id,
            fileName: document.fileName,
            category: document.category,
            chunkCount: chunks.length,
            status: 'ready',
            metadata
        };

    } catch (error) {
        console.error('Error processing document:', error);

        // Update document status to failed if created
        if (document) {
            await prisma.document.update({
                where: { id: document.id },
                data: { status: 'failed' }
            });
        }

        throw error;
    }
}

/**
 * Search for relevant context using semantic search
 * @param {String} query - Search query
 * @param {Object} options - {topK, category, minScore}
 * @returns {Promise<Array>} - Relevant context chunks
 */
export async function searchContext(query, options = {}) {
    try {
        const {
            topK = 5,
            category = null,
            minScore = 0.7
        } = options;

        console.log(`🔍 Searching for context: "${query.substring(0, 50)}..."`);

        // Generate query embedding
        const queryEmbedding = await generateQueryEmbedding(query);

        // Build filter
        const filter = {};
        if (category) {
            filter.category = category;
        }

        // Query Pinecone
        const results = await queryVectors(queryEmbedding, topK, filter);

        // Filter by minimum score and format results
        const relevantChunks = results
            .filter(match => match.score >= minScore)
            .map(match => ({
                text: match.metadata.text,
                score: match.score,
                documentId: match.metadata.documentId,
                fileName: match.metadata.fileName,
                category: match.metadata.category,
                chunkIndex: match.metadata.chunkIndex
            }));

        console.log(`✅ Found ${relevantChunks.length} relevant chunks (min score: ${minScore})`);

        return relevantChunks;

    } catch (error) {
        console.error('Error searching context:', error);
        throw error;
    }
}

/**
 * Get all documents from database
 * @param {Object} filter - Optional filter {category, status}
 * @returns {Promise<Array>} - Documents
 */
export async function getDocuments(filter = {}) {
    try {
        const where = {};

        if (filter.category) {
            where.category = filter.category;
        }

        if (filter.status) {
            where.status = filter.status;
        }

        const documents = await prisma.document.findMany({
            where,
            orderBy: { uploadDate: 'desc' }
        });

        return documents;
    } catch (error) {
        console.error('Error getting documents:', error);
        throw error;
    }
}

/**
 * Get single document by ID
 * @param {String} documentId 
 * @returns {Promise<Object>} - Document
 */
export async function getDocument(documentId) {
    try {
        const document = await prisma.document.findUnique({
            where: { id: documentId }
        });

        return document;
    } catch (error) {
        console.error('Error getting document:', error);
        throw error;
    }
}

/**
 * Delete document and its vectors
 * @param {String} documentId 
 * @returns {Promise<Object>} - {success, documentId}
 */
export async function deleteDocument(documentId) {
    try {
        console.log(`🗑️  Deleting document: ${documentId}`);

        // Delete vectors from Pinecone
        await deleteVectorsByDocument(documentId);

        // Delete document from database
        await prisma.document.delete({
            where: { id: documentId }
        });

        console.log(`✅ Document deleted: ${documentId}`);

        return { success: true, documentId };
    } catch (error) {
        console.error('Error deleting document:', error);
        throw error;
    }
}

/**
 * Format context for email generation
 * @param {Array} contextChunks - Array of context chunks
 * @returns {String} - Formatted context string
 */
export function formatContextForPrompt(contextChunks) {
    if (!contextChunks || contextChunks.length === 0) {
        return '';
    }

    const formattedChunks = contextChunks.map((chunk, index) => {
        return `[Source ${index + 1}: ${chunk.fileName} - ${chunk.category}]\n${chunk.text}`;
    });

    return formattedChunks.join('\n\n---\n\n');
}

/**
 * Reindex a document (regenerate embeddings and re-upload)
 * @param {String} documentId 
 * @returns {Promise<Object>} - Updated document
 */
export async function reindexDocument(documentId) {
    try {
        const document = await getDocument(documentId);

        if (!document) {
            throw new Error('Document not found');
        }

        console.log(`🔄 Reindexing document: ${documentId}`);

        // For now, we can't reload the original PDF buffer
        // In a production system, you'd store the PDF in cloud storage
        throw new Error('Reindexing requires original PDF file - feature coming soon');

        // Future implementation:
        // 1. Fetch PDF from cloud storage
        // 2. Delete old vectors
        // 3. Reprocess PDF
        // 4. Upload new vectors

    } catch (error) {
        console.error('Error reindexing document:', error);
        throw error;
    }
}

export default {
    processAndStoreDocument,
    searchContext,
    getDocuments,
    getDocument,
    deleteDocument,
    formatContextForPrompt,
    reindexDocument
};
