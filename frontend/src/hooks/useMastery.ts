'use client';

import { useEffect, useCallback } from 'react';
import { useMasteryStore } from '@/store/masteryStore';
import { analyticsService } from '@/services/analyticsService';

export function useMastery() {
  const {
    masteryData,
    overallMastery,
    weakTopics,
    isLoading,
    setMasteryData,
    setWeakTopics,
    setLoading,
    updateTopicMastery,
  } = useMasteryStore();

  const fetchMastery = useCallback(async () => {
    setLoading(true);
    try {
      const [masteryResponse, weakResponse] = await Promise.all([
        analyticsService.getMyMastery(),
        analyticsService.getWeakTopics(),
      ]);

      if (masteryResponse.data) {
        const mapped = masteryResponse.data.map((m: any) => ({
          topicId: m.topicId,
          topicName: m.topic?.name || 'Unknown',
          subjectName: m.topic?.subject?.name || 'Unknown',
          masteryScore: m.masteryScore,
          confidenceScore: m.confidenceScore,
          attemptsCount: m.attemptsCount,
        }));
        setMasteryData(mapped);
      }

      if (weakResponse.data) {
        const mapped = weakResponse.data.map((w: any) => ({
          topicId: w.topicId,
          topicName: w.topic?.name || 'Unknown',
          subjectName: w.topic?.subject?.name || 'Unknown',
          masteryScore: w.weaknessScore,
          confidenceScore: 0,
          attemptsCount: 0,
        }));
        setWeakTopics(mapped);
      }
    } catch (error) {
      console.error('Failed to fetch mastery:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    masteryData,
    overallMastery,
    weakTopics,
    isLoading,
    fetchMastery,
    updateTopicMastery,
  };
}
