import Groq from 'groq-sdk';

const apiKey = process.env.GROQ_API_KEY;

if (!apiKey) {
  throw new Error('Missing required environment variable: GROQ_API_KEY');
}

const groq = new Groq({ apiKey });

export const groqConfig = {
  client: groq,
  defaultModel: 'llama-3.3-70b-versatile',
  maxTokens: 1024,
  temperature: 0.7,
};

export default groq;
