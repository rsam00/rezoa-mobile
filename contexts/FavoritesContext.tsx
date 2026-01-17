import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface FavoritesContextType {
  favorites: string[];
  toggleFavorite: (stationId: string) => Promise<void>;
  syncing: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [syncing, setSyncing] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      syncWithCloud();
    } else {
      setFavorites([]);
    }
  }, [user]);

  const syncWithCloud = async () => {
    if (!user) return;
    setSyncing(true);
    try {
      const { data: cloudFavs, error } = await supabase
        .from('user_favorites')
        .select('station_id')
        .eq('user_id', user.id);

      if (error) throw error;

      const cloudIds = cloudFavs.map(f => f.station_id);
      const localData = await AsyncStorage.getItem('favoriteStations');
      const localIds: string[] = localData ? JSON.parse(localData) : [];
      
      const combinedIds = Array.from(new Set([...cloudIds, ...localIds]));
      const toUpload = localIds.filter(id => !cloudIds.includes(id));
      
      if (toUpload.length > 0) {
        await supabase
          .from('user_favorites')
          .insert(toUpload.map(id => ({ user_id: user.id, station_id: id })));
      }

      setFavorites(combinedIds);
      await AsyncStorage.removeItem('favoriteStations');
    } catch (e) {
      console.error('Error syncing favorites:', e);
    } finally {
      setSyncing(false);
    }
  };

  const toggleFavorite = async (stationId: string) => {
    if (!user) {
      const { Alert } = require('react-native');
      Alert.alert(
        'Login Required',
        'Log in to save your favorite stations to your profile.',
        [{ text: 'OK' }]
      );
      return;
    }

    const isFavorite = favorites.includes(stationId);
    const newFavorites = isFavorite
      ? favorites.filter(id => id !== stationId)
      : [...favorites, stationId];

    setFavorites(newFavorites);
    
    try {
      if (isFavorite) {
        await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('station_id', stationId);
      } else {
        await supabase
          .from('user_favorites')
          .insert({ user_id: user.id, station_id: stationId });
      }
    } catch (e) {
      console.error('Error toggling cloud favorite:', e);
    }
  };

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, syncing }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};
