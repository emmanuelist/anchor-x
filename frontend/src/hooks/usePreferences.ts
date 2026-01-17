import { useState, useEffect, useCallback } from 'react';

interface BridgePreferences {
  direction: 'deposit' | 'withdraw';
  lastAmount: string;
  showRecipient: boolean;
}

interface Preferences {
  bridge: BridgePreferences;
}

const STORAGE_KEY = 'anchorx-preferences';

const defaultPreferences: Preferences = {
  bridge: {
    direction: 'deposit',
    lastAmount: '',
    showRecipient: false,
  },
};

function loadPreferences(): Preferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...defaultPreferences, ...parsed };
    }
  } catch (error) {
    console.warn('Failed to load preferences:', error);
  }
  return defaultPreferences;
}

function savePreferences(preferences: Preferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.warn('Failed to save preferences:', error);
  }
}

export function usePreferences() {
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load preferences on mount (client-side only)
  useEffect(() => {
    setPreferences(loadPreferences());
    setIsLoaded(true);
  }, []);

  // Save preferences whenever they change (after initial load)
  useEffect(() => {
    if (isLoaded) {
      savePreferences(preferences);
    }
  }, [preferences, isLoaded]);

  const updateBridgePreferences = useCallback((updates: Partial<BridgePreferences>) => {
    setPreferences(prev => ({
      ...prev,
      bridge: { ...prev.bridge, ...updates },
    }));
  }, []);

  const resetPreferences = useCallback(() => {
    setPreferences(defaultPreferences);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    preferences,
    isLoaded,
    updateBridgePreferences,
    resetPreferences,
  };
}
