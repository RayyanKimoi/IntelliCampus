import { Pinecone } from '@pinecone-database/pinecone';

const apiKey = process.env.PINECONE_API_KEY;
// Support both PINECONE_INDEX_NAME (preferred) and legacy PINECONE_INDEX
const indexName = process.env.PINECONE_INDEX_NAME ?? process.env.PINECONE_INDEX;

if (!apiKey) {
  throw new Error('Missing required environment variable: PINECONE_API_KEY');
}
if (!indexName) {
  throw new Error('Missing required environment variable: PINECONE_INDEX_NAME (or PINECONE_INDEX)');
}

const pinecone = new Pinecone({ apiKey });

export const pineconeConfig = {
  client: pinecone,
  indexName,
  namespace: 'curriculum',
  topK: 5,
  minScore: 0.7,
};

console.log(`[Pinecone] Initialized — index: "${indexName}", namespace: "curriculum"`);

export function getPineconeIndex() {
  return pinecone.index(indexName as string);
}

export default pinecone;
