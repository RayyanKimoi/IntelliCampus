import { create } from 'zustand';

interface MasteryTopic {
  topicId: string;
  topicName: string;
  subjectName: string;
  masteryScore: number;
  confidenceScore: number;
  attemptsCount: number;
}

interface MasteryState {
  masteryData: MasteryTopic[];
  overallMastery: number;
  weakTopics: MasteryTopic[];
  isLoading: boolean;

  setMasteryData: (data: MasteryTopic[]) => void;
  setWeakTopics: (topics: MasteryTopic[]) => void;
  setLoading: (loading: boolean) => void;
  updateTopicMastery: (topicId: string, score: number) => void;
}

export const useMasteryStore = create<MasteryState>((set, get) => ({
  masteryData: [],
  overallMastery: 0,
  weakTopics: [],
  isLoading: false,

  setMasteryData: (data) => {
    const overall =
      data.length > 0
        ? data.reduce((sum, t) => sum + t.masteryScore, 0) / data.length
        : 0;

    set({
      masteryData: data,
      overallMastery: Math.round(overall * 10) / 10,
    });
  },

  setWeakTopics: (topics) => set({ weakTopics: topics }),

  setLoading: (loading) => set({ isLoading: loading }),

  updateTopicMastery: (topicId, score) => {
    const current = get().masteryData;
    const updated = current.map((t) =>
      t.topicId === topicId ? { ...t, masteryScore: score } : t
    );
    const overall =
      updated.length > 0
        ? updated.reduce((sum, t) => sum + t.masteryScore, 0) / updated.length
        : 0;

    set({
      masteryData: updated,
      overallMastery: Math.round(overall * 10) / 10,
    });
  },
}));
