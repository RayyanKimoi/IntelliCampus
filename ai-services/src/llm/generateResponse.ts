import openai, { openaiConfig } from '../config/openai';

interface GenerateOptions {
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
  temperature?: number;
}

interface LLMResponse {
  text: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Core LLM response generation
 */
class ResponseGenerator {
  /**
   * Generate a response from the LLM
   */
  async generate(options: GenerateOptions): Promise<LLMResponse> {
    const response = await openai.chat.completions.create({
      model: openaiConfig.defaultModel,
      messages: [
        { role: 'system', content: options.systemPrompt },
        { role: 'user', content: options.userPrompt },
      ],
      max_tokens: options.maxTokens || openaiConfig.maxTokens,
      temperature: options.temperature || openaiConfig.temperature,
    });

    const text = response.choices[0]?.message?.content || '';
    const usage = response.usage;

    return {
      text,
      usage: {
        promptTokens: usage?.prompt_tokens || 0,
        completionTokens: usage?.completion_tokens || 0,
        totalTokens: usage?.total_tokens || 0,
      },
    };
  }

  /**
   * Generate with conversation history
   */
  async generateWithHistory(
    systemPrompt: string,
    history: Array<{ role: 'user' | 'assistant'; content: string }>,
    newMessage: string,
    maxTokens?: number
  ): Promise<LLMResponse> {
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: newMessage },
    ];

    const response = await openai.chat.completions.create({
      model: openaiConfig.defaultModel,
      messages,
      max_tokens: maxTokens || openaiConfig.maxTokens,
      temperature: openaiConfig.temperature,
    });

    const text = response.choices[0]?.message?.content || '';

    return {
      text,
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      },
    };
  }
}

export const generateResponse = new ResponseGenerator();
