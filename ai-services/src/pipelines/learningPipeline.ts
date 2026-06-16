import { retriever, RetrievedChunk } from '../rag/retriever';
import { governedPrompt } from '../prompt-engine/governedPrompt';
import { hintModePrompt } from '../prompt-engine/hintModePrompt';
import { generateResponse } from '../llm/generateResponse';
import { moderation } from '../llm/moderation';
import { responseParser } from '../llm/responseParser';

interface LearningPipelineInput {
  query: string;
  topicId: string;
  courseId: string;
  mode: 'learning' | 'practice';
  studentLevel: string;
  masteryScore: number;
}

interface LearningPipelineOutput {
  response: string;
  responseType: 'explanation' | 'hint';
  sources: Array<{ id: string; relevance: number }>;
  concepts: string[];
  structured: {
    summary: string;
    explanation: string;
    keyPoints: string[];
    suggestedPractice?: string;
  };
}

/**
 * Full learning pipeline: query → retrieve → prompt → generate → parse
 */
class LearningPipeline {
  async process(input: LearningPipelineInput): Promise<LearningPipelineOutput> {
    const _totalStart = performance.now();

    // Step 1: Retrieve relevant curriculum chunks
    const _retrievalStart = performance.now();
    const chunks = await retriever.retrieveWithFallback(
      input.query,
      input.topicId,
      input.courseId
    );
    const retrieval_ms = Math.round(performance.now() - _retrievalStart);

    // Step 2: Build governed prompt
    const _promptStart = performance.now();
    let systemPrompt: string;
    let userPrompt: string;

    if (input.mode === 'practice') {
      systemPrompt = hintModePrompt.buildSystemPrompt();
      userPrompt = hintModePrompt.buildPrompt({
        query: input.query,
        context: chunks,
      });
    } else {
      systemPrompt = governedPrompt.buildSystemPrompt();
      userPrompt = governedPrompt.buildPrompt({
        query: input.query,
        context: chunks,
        studentLevel: input.studentLevel,
        masteryScore: input.masteryScore,
      });
    }
    const context_build_ms = Math.round(performance.now() - _promptStart);

    // Step 3: Generate LLM response
    const _llmStart = performance.now();
    const llmResponse = await generateResponse.generate({
      systemPrompt,
      userPrompt,
      maxTokens: input.mode === 'practice' ? 512 : 1024,
    });
    const llm_ms = Math.round(performance.now() - _llmStart);

    // Step 4: Moderate response
    const _moderationStart = performance.now();
    const isClean = await moderation.validateResponse(llmResponse.text);
    const moderation_ms = Math.round(performance.now() - _moderationStart);

    const total_ms = Math.round(performance.now() - _totalStart);
    console.log(JSON.stringify({ stage: 'learning_pipeline', total_ms, retrieval_ms, context_build_ms, llm_ms, moderation_ms, chunks_retrieved: chunks.length, mode: input.mode }));

    if (!isClean) {
      return {
        response: 'I apologize, but I could not generate an appropriate response. Please try rephrasing your question.',
        responseType: input.mode === 'practice' ? 'hint' : 'explanation',
        sources: [],
        concepts: [],
        structured: {
          summary: '',
          explanation: '',
          keyPoints: [],
        },
      };
    }

    // Step 5: Parse and structure
    const cleanedResponse = responseParser.clean(llmResponse.text);
    const concepts = responseParser.extractConcepts(cleanedResponse);
    const structured = responseParser.structureResponse(cleanedResponse);

    return {
      response: cleanedResponse,
      responseType: input.mode === 'practice' ? 'hint' : 'explanation',
      sources: chunks.map((c) => ({ id: c.id, relevance: c.score })),
      concepts,
      structured,
    };
  }
}

export const learningPipeline = new LearningPipeline();
