import { Pinecone } from '@pinecone-database/pinecone';
import config from '../config/index.js';

let pineconeClient = null;

/**
 * Initialize Pinecone client (singleton)
 */
export async function initializePinecone() {
    if (pineconeClient) {
        return pineconeClient;
    }

    if (!config.PINECONE.API_KEY) {
        throw new Error('PINECONE_API_KEY is not configured');
    }

    try {
        pineconeClient = new Pinecone({
            apiKey: config.PINECONE.API_KEY,
        });

        console.log('✅ Pinecone client initialized successfully');
        return pineconeClient;
    } catch (error) {
        console.error('❌ Failed to initialize Pinecone:', error.message);
        throw error;
    }
}

/**
 * Get Pinecone index
 */
export async function getIndex() {
    const client = await initializePinecone();
    return client.index(config.PINECONE.INDEX_NAME);
}

/**
 * Create index if it doesn't exist
 */
export async function ensureIndexExists() {
    try {
        const client = await initializePinecone();
        const indexList = await client.listIndexes();

        const indexExists = indexList.indexes?.some(
            idx => idx.name === config.PINECONE.INDEX_NAME
        );

        if (!indexExists) {
            console.log(`Creating Pinecone index: ${config.PINECONE.INDEX_NAME}...`);

            await client.createIndex({
                name: config.PINECONE.INDEX_NAME,
                dimension: config.PINECONE.DIMENSION,
                metric: config.PINECONE.METRIC,
                spec: {
                    serverless: {
                        cloud: 'aws',
                        region: config.PINECONE.ENVIRONMENT
                    }
                }
            });

            console.log('✅ Pinecone index created successfully');

            // Wait for index to be ready
            await new Promise(resolve => setTimeout(resolve, 10000));
        } else {
            console.log(`✅ Pinecone index '${config.PINECONE.INDEX_NAME}' already exists`);
        }

        return true;
    } catch (error) {
        console.error('Error ensuring index exists:', error);
        throw error;
    }
}

/**
 * Upsert vectors to Pinecone
 * @param {Array} vectors - Array of {id, values, metadata}
 */
export async function upsertVectors(vectors) {
    try {
        const index = await getIndex();

        // Batch upsert (max 100 vectors per batch)
        const batchSize = 100;
        const batches = [];

        for (let i = 0; i < vectors.length; i += batchSize) {
            batches.push(vectors.slice(i, i + batchSize));
        }

        for (const batch of batches) {
            await index.upsert(batch);
        }

        console.log(`✅ Upserted ${vectors.length} vectors to Pinecone`);
        return { success: true, count: vectors.length };
    } catch (error) {
        console.error('Error upserting vectors:', error);
        throw error;
    }
}

/**
 * Query vectors by similarity
 * @param {Array} queryVector - Query embedding vector
 * @param {Number} topK - Number of results to return
 * @param {Object} filter - Optional metadata filter
 */
export async function queryVectors(queryVector, topK = 5, filter = {}) {
    try {
        const index = await getIndex();

        const queryOptions = {
            vector: queryVector,
            topK,
            includeMetadata: true,
            includeValues: false
        };

        if (Object.keys(filter).length > 0) {
            queryOptions.filter = filter;
        }

        const results = await index.query(queryOptions);

        return results.matches || [];
    } catch (error) {
        console.error('Error querying vectors:', error);
        throw error;
    }
}

/**
 * Delete vectors by document ID
 * @param {String} documentId - Document ID to delete vectors for
 */
export async function deleteVectorsByDocument(documentId) {
    try {
        const index = await getIndex();

        // Delete all vectors with this documentId in metadata
        await index.deleteMany({
            filter: { documentId }
        });

        console.log(`✅ Deleted vectors for document: ${documentId}`);
        return { success: true };
    } catch (error) {
        console.error('Error deleting vectors:', error);
        throw error;
    }
}

/**
 * Delete vectors by IDs
 * @param {Array<String>} ids - Array of vector IDs to delete
 */
export async function deleteVectorsByIds(ids) {
    try {
        const index = await getIndex();
        await index.deleteMany(ids);

        console.log(`✅ Deleted ${ids.length} vectors`);
        return { success: true, count: ids.length };
    } catch (error) {
        console.error('Error deleting vectors by IDs:', error);
        throw error;
    }
}

/**
 * Get index statistics
 */
export async function getIndexStats() {
    try {
        const index = await getIndex();
        const stats = await index.describeIndexStats();
        return stats;
    } catch (error) {
        console.error('Error getting index stats:', error);
        throw error;
    }
}

export default {
    initializePinecone,
    getIndex,
    ensureIndexExists,
    upsertVectors,
    queryVectors,
    deleteVectorsByDocument,
    deleteVectorsByIds,
    getIndexStats
};
