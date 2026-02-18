import { prisma } from '../config/db';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5000';

interface AIQueryPayload {
  query: string;
  topicId: string;
  courseId: string;
  mode: 'learning' | 'assessment' | 'practice';
  studentLevel?: string;
  masteryScore?: number;
}

interface AIResponse {
  answer: string;
  sources?: string[];
  suggestedFollowUp?: string[];
}

export const aiService = {
  /**
   * Send a query to the AI Microservice (RAG Pipeline)
   */
  async generateResponse(payload: AIQueryPayload): Promise<AIResponse> {
    try {
      const response = await fetch(`${AI_SERVICE_URL}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`AI Service Error: ${response.statusText}`);
      }

      const data = (await response.json()) as { success: boolean; error?: string; data?: unknown };
      if (!data.success) {
        throw new Error(data.error || 'Unknown AI Service error');
      }

      return data.data as AIResponse;
    } catch (error) {
      console.error('AI Service communication failed:', error);
      // Fallback response if AI service is down
      return {
        answer: "I'm having trouble connecting to my knowledge base right now. Please try again later.",
      };
    }
  },

  /**
   * Generate hints for assessment mode
   */
  async generateHint(payload: { query: string; topicId: string; courseId: string; strictMode: boolean }) {
    try {
      const response = await fetch(`${AI_SERVICE_URL}/assessment-query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
         throw new Error('AI Service Error');
      }
      
      const data = (await response.json()) as { success: boolean; error?: string; data?: unknown };
      if (!data.success) {
         throw new Error(data.error || 'Unknown AI Service error');
      }
      
      return data.data as { hint?: string; answer?: string };
    } catch (error) {
        console.error('AI Service Hint failed:', error);
        return { hint: "Focus on the core concepts discussed in this week's lectures." };
    }
  },
};
