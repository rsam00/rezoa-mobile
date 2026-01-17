import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface FavoritesContextType {
  favorites: string[];
  toggleFavorite: (stationId: string) => void;
}

const FavoritesContext = createContext<FavoritesContextType>({
  favorites: [],
  toggleFavorite: () => {},
});

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    AsyncStorage.getItem('favoriteStations').then(data => {
      if (data) setFavorites(JSON.parse(data));
    });
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('favoriteStations', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (stationId: string) => {
    setFavorites(prev =>
      prev.includes(stationId)
        ? prev.filter(id => id !== stationId)
        : [...prev, stationId]
    );
  };

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    console.warn('FavoritesContext not found, using fallback.');
    return {
      favorites: [],
      toggleFavorite: () => {},
    };
  }
  return context;
};