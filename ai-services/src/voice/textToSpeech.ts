import { speechConfig } from '../config/speech';

/**
 * Text-to-Speech service
 * Uses ElevenLabs API or falls back to browser SpeechSynthesis
 */
class TextToSpeechService {
  /**
   * Synthesize text to speech audio
   * Returns base64 audio data or URL
   */
  async synthesize(text: string): Promise<string> {
    if (!speechConfig.elevenLabs.apiKey) {
      console.warn('[TTS] No ElevenLabs API key. Use browser SpeechSynthesis instead.');
      // Return empty string — frontend will use browser TTS fallback
      return '';
    }

    try {
      const { baseUrl, voiceId, apiKey, modelId } = speechConfig.elevenLabs;

      const response = await fetch(
        `${baseUrl}/text-to-speech/${voiceId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': apiKey,
          },
          body: JSON.stringify({
            text,
            model_id: modelId,
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }

      // Convert audio to base64
      const arrayBuffer = await response.arrayBuffer();
      const base64Audio = Buffer.from(arrayBuffer).toString('base64');

      return `data:audio/mpeg;base64,${base64Audio}`;
    } catch (error) {
      console.error('[TTS] Synthesis failed:', error);
      return ''; // Frontend will fallback to browser TTS
    }
  }
}

export const textToSpeechService = new TextToSpeechService();
