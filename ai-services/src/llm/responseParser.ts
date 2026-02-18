/**
 * Parse and format LLM responses for frontend consumption
 */
class ResponseParser {
  /**
   * Clean and format the LLM response
   */
  clean(text: string): string {
    return text
      .replace(/^\s+|\s+$/g, '')         // Trim
      .replace(/\n{3,}/g, '\n\n')         // Max 2 newlines
      .replace(/\t/g, '  ');              // Tabs to spaces
  }

  /**
   * Extract key concepts mentioned in the response
   */
  extractConcepts(text: string): string[] {
    // Simple extraction: find bold text, headers, and capitalized phrases
    const concepts: string[] = [];

    // Bold text (**concept**)
    const boldMatches = text.match(/\*\*([^*]+)\*\*/g);
    if (boldMatches) {
      concepts.push(
        ...boldMatches.map((m) => m.replace(/\*\*/g, '').trim())
      );
    }

    return [...new Set(concepts)]; // Deduplicate
  }

  /**
   * Structure response into sections
   */
  structureResponse(text: string): {
    summary: string;
    explanation: string;
    keyPoints: string[];
    suggestedPractice?: string;
  } {
    const lines = text.split('\n').filter((l) => l.trim());
    const keyPoints: string[] = [];
    let summary = '';
    let explanation = '';
    let suggestedPractice = '';

    let section = 'summary';

    for (const line of lines) {
      if (line.match(/^[-•*]\s/) || line.match(/^\d+\.\s/)) {
        keyPoints.push(line.replace(/^[-•*\d.]+\s*/, '').trim());
      } else if (line.toLowerCase().includes('practice') || line.toLowerCase().includes('try')) {
        suggestedPractice += line + '\n';
        section = 'practice';
      } else if (section === 'summary' && summary.length < 200) {
        summary += line + ' ';
      } else {
        explanation += line + '\n';
      }
    }

    return {
      summary: summary.trim() || lines[0] || '',
      explanation: explanation.trim() || text,
      keyPoints,
      suggestedPractice: suggestedPractice.trim() || undefined,
    };
  }
}

export const responseParser = new ResponseParser();
