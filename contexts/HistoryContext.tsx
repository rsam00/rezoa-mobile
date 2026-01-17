import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface HistoryContextType {
  history: string[];
  addToHistory: (stationId: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  syncing: boolean;
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

export const HistoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [history, setHistory] = useState<string[]>([]);
  const [syncing, setSyncing] = useState(false);
  const { user } = useAuth();

  // Handle user changes (Login/Logout)
  useEffect(() => {
    if (user) {
      syncWithCloud();
    } else {
      // Clear memory state and load local-only on logout
      setHistory([]);
      loadLocal();
    }
  }, [user]);

  const loadLocal = async () => {
    const data = await AsyncStorage.getItem('playbackHistory');
    if (data) setHistory(JSON.parse(data));
    else setHistory([]);
  };

  const syncWithCloud = async () => {
    if (!user) return;
    setSyncing(true);
    try {
      const { data: cloudHistory, error } = await supabase
        .from('user_history')
        .select('station_id')
        .eq('user_id', user.id)
        .order('played_at', { ascending: false })
        .limit(15);

      if (error) throw error;

      const cloudIds = cloudHistory.map(h => h.station_id);
      const localData = await AsyncStorage.getItem('playbackHistory');
      const localIds: string[] = localData ? JSON.parse(localData) : [];
      
      const combinedIds = Array.from(new Set([...localIds, ...cloudIds])).slice(0, 15);
      
      setHistory(combinedIds);
      
      // 4. IMPORTANT: Clear local history after migration
      await AsyncStorage.removeItem('playbackHistory');
    } catch (e) {
      console.error('Error syncing history:', e);
    } finally {
      setSyncing(false);
    }
  };

  const addToHistory = async (stationId: string) => {
    const filtered = history.filter(id => id !== stationId);
    const newHistory = [stationId, ...filtered].slice(0, 15);
    
    setHistory(newHistory);
    
    if (!user) {
      // Only save to AsyncStorage if guest
      await AsyncStorage.setItem('playbackHistory', JSON.stringify(newHistory));
    }

    if (user) {
      try {
        await supabase
          .from('user_history')
          .insert({ user_id: user.id, station_id: stationId });
      } catch (e) {
        console.error('Error adding to cloud history:', e);
      }
    }
  };

  const clearHistory = async () => {
    setHistory([]);
    await AsyncStorage.removeItem('playbackHistory');
    
    if (user) {
      try {
        await supabase
          .from('user_history')
          .delete()
          .eq('user_id', user.id);
      } catch (e) {
        console.error('Error clearing cloud history:', e);
      }
    }
  };

  return (
    <HistoryContext.Provider value={{ history, addToHistory, clearHistory, syncing }}>
      {children}
    </HistoryContext.Provider>
  );
};

export const useHistory = () => {
  const context = useContext(HistoryContext);
  if (!context) {
    throw new Error('useHistory must be used within a HistoryProvider');
  }
  return context;
};
