import { speechConfig } from '../config/speech';

/**
 * Speech-to-Text service
 * Uses Google Cloud Speech API or falls back to browser Web Speech API
 */
class SpeechToText {
  /**
   * Transcribe audio data to text
   * In production, this calls Google Cloud Speech-to-Text API
   * For hackathon, the frontend uses Web Speech API directly
   */
  async transcribe(
    audioData: string,
    language = 'en-US'
  ): Promise<string> {
    if (!speechConfig.google.apiKey) {
      console.warn('[STT] No Google Speech API key. Use browser Web Speech API instead.');
      throw new Error('Server-side STT not configured. Use browser Web Speech API.');
    }

    try {
      // Google Cloud Speech-to-Text REST API call
      const response = await fetch(
        `https://speech.googleapis.com/v1/speech:recognize?key=${speechConfig.google.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            config: {
              encoding: speechConfig.google.encoding,
              sampleRateHertz: speechConfig.google.sampleRateHertz,
              languageCode: language,
              enableAutomaticPunctuation: true,
            },
            audio: {
              content: audioData, // base64 encoded audio
            },
          }),
        }
      );

      const data = await response.json() as { results?: { alternatives: { transcript?: string }[] }[] };

      if (data.results && data.results.length > 0) {
        return data.results
          .map((r: any) => r.alternatives[0]?.transcript || '')
          .join(' ');
      }

      return '';
    } catch (error) {
      console.error('[STT] Transcription failed:', error);
      throw new Error('Speech transcription failed');
    }
  }
}

export const speechToText = new SpeechToText();
