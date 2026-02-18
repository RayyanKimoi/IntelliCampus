export const env = {
  // App
  NODE_ENV: process.env.NODE_ENV || 'development',
  AI_SERVICE_URL: process.env.AI_SERVICE_URL || 'http://localhost:5000',

  // Database
  DATABASE_URL: process.env.DATABASE_URL || '',
  DIRECT_URL: process.env.DIRECT_URL || '',

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-me',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  // AI
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  PINECONE_API_KEY: process.env.PINECONE_API_KEY || '',
  PINECONE_INDEX: process.env.PINECONE_INDEX || 'intellicampus',
  PINECONE_ENVIRONMENT: process.env.PINECONE_ENVIRONMENT || '',

  // Voice
  GOOGLE_SPEECH_KEY: process.env.GOOGLE_SPEECH_KEY || '',
  ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY || '',
  ELEVENLABS_VOICE_ID: process.env.ELEVENLABS_VOICE_ID || '',

  // Upload
  MAX_FILE_SIZE_MB: parseInt(process.env.MAX_FILE_SIZE_MB || '50', 10),
  UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',

  // Helpers
  isDev: process.env.NODE_ENV === 'development',
  isProd: process.env.NODE_ENV === 'production',
} as const;
