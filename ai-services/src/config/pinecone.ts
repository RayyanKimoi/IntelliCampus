import { Pinecone } from '@pinecone-database/pinecone';

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY || '',
});

export const pineconeConfig = {
  client: pinecone,
  indexName: process.env.PINECONE_INDEX || 'intellicampus',
  namespace: 'curriculum',
  topK: 5,
  minScore: 0.7,
};

export function getIndex() {
  return pinecone.index(pineconeConfig.indexName);
}

export default pinecone;
