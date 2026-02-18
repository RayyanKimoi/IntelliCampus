import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export const openaiConfig = {
  client: openai,
  defaultModel: 'gpt-4o-mini', // Cost-effective for hackathon, upgrade to gpt-4o for production
  embeddingModel: 'text-embedding-3-small',
  maxTokens: 1024,
  temperature: 0.7,
};

export default openai;
