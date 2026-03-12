import { api } from '@/services/apiClient';

/**
 * Calls the /api/ai/mindmap endpoint to convert an AI tutor answer
 * into a Mermaid mindmap diagram string.
 * @param answer - The last AI tutor response text
 * @param question - The user's original question (used as topic anchor)
 */
export async function generateMindMap(answer: string, question?: string): Promise<string> {
  const data = await api.post<{ success: boolean; chart: string; error?: string }>(
    '/ai/mindmap',
    { answer, question }
  );

  if (!data.success || !data.chart) {
    throw new Error(data.error ?? 'Failed to generate mind map');
  }

  return data.chart;
}
