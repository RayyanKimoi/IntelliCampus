interface PerformanceData {
  scores: number[];
  timestamps: Date[];
  activityTypes: string[];
}

interface PerformanceAnalysis {
  trend: 'improving' | 'stable' | 'declining';
  averageScore: number;
  recentAverageScore: number;
  consistency: number; // 0-100
  strongAreas: string[];
  weakAreas: string[];
  studyPatterns: {
    mostActiveTime: string;
    averageSessionLength: number;
    totalSessions: number;
  };
}

/**
 * Analyzes student performance patterns
 */
class PerformanceAnalyzer {
  /**
   * Analyze overall performance trend
   */
  analyze(data: PerformanceData): PerformanceAnalysis {
    const { scores, timestamps, activityTypes } = data;

    if (scores.length === 0) {
      return {
        trend: 'stable',
        averageScore: 0,
        recentAverageScore: 0,
        consistency: 0,
        strongAreas: [],
        weakAreas: [],
        studyPatterns: {
          mostActiveTime: 'N/A',
          averageSessionLength: 0,
          totalSessions: 0,
        },
      };
    }

    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const recentScores = scores.slice(-Math.min(10, scores.length));
    const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;

    // Determine trend
    const olderScores = scores.slice(0, Math.floor(scores.length / 2));
    const newerScores = scores.slice(Math.floor(scores.length / 2));
    const olderAvg = olderScores.length > 0
      ? olderScores.reduce((a, b) => a + b, 0) / olderScores.length
      : 0;
    const newerAvg = newerScores.length > 0
      ? newerScores.reduce((a, b) => a + b, 0) / newerScores.length
      : 0;

    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (newerAvg - olderAvg > 5) trend = 'improving';
    else if (olderAvg - newerAvg > 5) trend = 'declining';

    // Consistency: standard deviation based
    const stdDev = Math.sqrt(
      scores.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / scores.length
    );
    const consistency = Math.max(0, 100 - stdDev);

    // Activity analysis
    const activityScores: Record<string, number[]> = {};
    activityTypes.forEach((type, i) => {
      if (!activityScores[type]) activityScores[type] = [];
      activityScores[type].push(scores[i]);
    });

    const strongAreas: string[] = [];
    const weakAreas: string[] = [];
    for (const [type, typeScores] of Object.entries(activityScores)) {
      const typeAvg = typeScores.reduce((a, b) => a + b, 0) / typeScores.length;
      if (typeAvg >= 70) strongAreas.push(type);
      else if (typeAvg < 50) weakAreas.push(type);
    }

    return {
      trend,
      averageScore: Math.round(avg * 10) / 10,
      recentAverageScore: Math.round(recentAvg * 10) / 10,
      consistency: Math.round(consistency),
      strongAreas,
      weakAreas,
      studyPatterns: {
        mostActiveTime: this.getMostActiveTime(timestamps),
        averageSessionLength: 0, // Requires session data
        totalSessions: scores.length,
      },
    };
  }

  private getMostActiveTime(timestamps: Date[]): string {
    if (timestamps.length === 0) return 'N/A';

    const hourCounts: Record<number, number> = {};
    timestamps.forEach((t) => {
      const hour = new Date(t).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const peakHour = Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || '12';

    const hour = parseInt(peakHour);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:00 ${period}`;
  }
}

export const performanceAnalyzer = new PerformanceAnalyzer();
