export const speechConfig = {
  // Google Cloud Speech-to-Text
  google: {
    apiKey: process.env.GOOGLE_SPEECH_KEY || '',
    languageCode: 'en-US',
    encoding: 'LINEAR16' as const,
    sampleRateHertz: 16000,
  },

  // ElevenLabs Text-to-Speech
  elevenLabs: {
    apiKey: process.env.ELEVENLABS_API_KEY || '',
    voiceId: process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL', // Default voice
    modelId: 'eleven_monolingual_v1',
    baseUrl: 'https://api.elevenlabs.io/v1',
  },

  // Browser fallback (Web Speech API used on frontend)
  browserFallback: true,
};
