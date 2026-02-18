import { retriever } from '../rag/retriever';
import { assessmentMode } from '../prompt-engine/assessmentMode';
import { generateResponse } from '../llm/generateResponse';
import { responseParser } from '../llm/responseParser';

interface AssessmentPipelineInput {
  query: string;
  topicId: string;
  courseId: string;
  strictMode: boolean;
}

interface AssessmentPipelineOutput {
  response: string;
  responseType: 'hint' | 'restricted';
  isRestricted: boolean;
}

/**
 * Assessment pipeline: strict mode prevents any answer leakage
 */
class AssessmentPipeline {
  async process(input: AssessmentPipelineInput): Promise<AssessmentPipelineOutput> {
    const { query, topicId, courseId, strictMode } = input;

    // In strict mode, we don't even retrieve context
    if (strictMode) {
      const systemPrompt = assessmentMode.buildSystemPrompt(true);
      const userPrompt = assessmentMode.buildPrompt({
        query,
        context: [],
        strictMode: true,
      });

      const llmResponse = await generateResponse.generate({
        systemPrompt,
        userPrompt,
        maxTokens: 150, // Keep responses short
        temperature: 0.3, // Low creativity
      });

      return {
        response: responseParser.clean(llmResponse.text),
        responseType: 'restricted',
        isRestricted: true,
      };
    }

    // Non-strict assessment: provide very minimal hints
    const chunks = await retriever.retrieve(query, { topicId }, 2);

    const systemPrompt = assessmentMode.buildSystemPrompt(false);
    const userPrompt = assessmentMode.buildPrompt({
      query,
      context: chunks,
      strictMode: false,
    });

    const llmResponse = await generateResponse.generate({
      systemPrompt,
      userPrompt,
      maxTokens: 256,
      temperature: 0.3,
    });

    return {
      response: responseParser.clean(llmResponse.text),
      responseType: 'hint',
      isRestricted: false,
    };
  }
}

export const assessmentPipeline = new AssessmentPipeline();
