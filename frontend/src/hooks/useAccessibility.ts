'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/services/apiClient';

interface AccessibilityState {
  adhdMode: boolean;
  dyslexiaFont: boolean;
  highContrast: boolean;
  speechEnabled: boolean;
  focusMode: boolean;
  fontScale: number;
}

const defaultSettings: AccessibilityState = {
  adhdMode: false,
  dyslexiaFont: false,
  highContrast: false,
  speechEnabled: false,
  focusMode: false,
  fontScale: 1.0,
};

export function useAccessibility() {
  const [settings, setSettings] = useState<AccessibilityState>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await api.get('/student/accessibility');
        if (response.data) {
          setSettings({
            adhdMode: response.data.adhdMode ?? false,
            dyslexiaFont: response.data.dyslexiaFont ?? false,
            highContrast: response.data.highContrast ?? false,
            speechEnabled: response.data.speechEnabled ?? false,
            focusMode: response.data.focusMode ?? false,
            fontScale: response.data.fontScale ?? 1.0,
          });
        }
      } catch {
        // Use defaults if not authenticated or API fails
      } finally {
        setIsLoaded(true);
      }
    };

    loadSettings();
  }, []);

  // Apply settings to DOM
  useEffect(() => {
    if (!isLoaded) return;

    const body = document.body;

    body.classList.toggle('dyslexia-font', settings.dyslexiaFont);
    body.classList.toggle('focus-mode', settings.focusMode);
    body.classList.toggle('adhd-mode', settings.adhdMode);
    body.classList.toggle('dark', settings.highContrast);

    document.documentElement.style.fontSize = `${settings.fontScale * 100}%`;
  }, [settings, isLoaded]);

  const updateSetting = useCallback(
    async (key: keyof AccessibilityState, value: boolean | number) => {
      setSettings((prev) => ({ ...prev, [key]: value }));

      try {
        await api.put('/student/accessibility', { [key]: value });
      } catch (error) {
        console.error('Failed to save accessibility setting:', error);
      }
    },
    []
  );

  return {
    settings,
    isLoaded,
    updateSetting,
  };
}
