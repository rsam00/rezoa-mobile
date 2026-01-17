import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface HistoryContextType {
  history: string[];
  addToHistory: (stationId: string) => void;
  clearHistory: () => void;
}

const HistoryContext = createContext<HistoryContextType>({
  history: [],
  addToHistory: () => {},
  clearHistory: () => {},
});

export const HistoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    AsyncStorage.getItem('playbackHistory').then(data => {
      if (data) setHistory(JSON.parse(data));
    });
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('playbackHistory', JSON.stringify(history));
  }, [history]);

  const addToHistory = (stationId: string) => {
    setHistory(prev => {
      // Remove if already exists (to move to front)
      const filtered = prev.filter(id => id !== stationId);
      // Add to front and limit to 15 items
      return [stationId, ...filtered].slice(0, 15);
    });
  };

  const clearHistory = () => setHistory([]);

  return (
    <HistoryContext.Provider value={{ history, addToHistory, clearHistory }}>
      {children}
    </HistoryContext.Provider>
  );
};

export const useHistory = () => {
  const context = useContext(HistoryContext);
  if (!context) {
    console.warn('HistoryContext not found, using fallback. Ensure your component is wrapped in HistoryProvider.');
    return {
      history: [],
      addToHistory: () => {},
      clearHistory: () => {},
    };
  }
  return context;
};
