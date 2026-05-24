import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// Types matched to Supabase schema
export interface Station {
  id: string;
  name: string;
  logo: string;
  streamUrl: string;
  website?: string;
  city?: string;
  country?: string;
  language?: string;
  description?: string;
  frequency?: string;
  tag?: string[];
  favoriteCount?: number;
  clickCount?: number;
  createdAt?: string;
}

export interface Program {
  id: string;
  stationId: string;
  name: string;
  host?: string;
  poster?: string;
  description?: string;
  schedules: { startTime: string; endTime: string; days: string[] }[];
  clickCount?: number;
  createdAt?: string;
}

interface DataContextType {
  stations: Station[];
  programs: Program[];
  loading: boolean;
  isReady: boolean;
  refreshData: () => Promise<void>;
  getProgramsForStation: (stationId: string) => Program[];
  recordClick: (stationId: string) => Promise<void>;
  recordProgramClick: (programId: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const CACHE_KEYS = {
  STATIONS: '@rezoa_stations_v4', 
  PROGRAMS: '@rezoa_programs_v4',
};

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [stations, setStations] = useState<Station[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const startup = async () => {
      console.log('--- DATA STARTUP BEGINS ---');
      try {
        const [cachedS, cachedP] = await Promise.all([
          AsyncStorage.getItem(CACHE_KEYS.STATIONS),
          AsyncStorage.getItem(CACHE_KEYS.PROGRAMS),
        ]);

        if (cachedS && cachedP) {
          try {
            const s = JSON.parse(cachedS);
            const p = JSON.parse(cachedP);
            if (Array.isArray(s) && Array.isArray(p)) {
              setStations(s);
              setPrograms(p);
              setIsReady(true);
              console.log('--- DATA LOADED FROM CACHE ---');
            }
          } catch (jsonErr) {
            console.warn('--- CACHE PARSE ERROR ---');
          }
        }
      } catch (e) {
        console.warn('--- ASYNC STORAGE ERROR ---');
      }

      await performNetworkFetch();
      setLoading(false);
    };

    startup();
  }, []);

  const performNetworkFetch = async () => {
    try {
      console.log('--- NETWORK FETCH STARTING ---');
      const fieldsS = 'id, name, logo, stream_url, city, country, tags, favorite_count, click_count, created_at, description';
      const fieldsP = 'id, name, station_id, poster, schedules, click_count, created_at';

      const { data: sData, error: sErr } = await supabase.from('stations').select(fieldsS);
      const { data: pData, error: pErr } = await supabase.from('programs').select(fieldsP);

      if (sErr || pErr) {
        console.error('--- SUPABASE ERROR ---');
        setIsReady(true);
        return;
      }

      if (sData && pData) {
        const mappedS = sData.map(s => ({
          ...s,
          streamUrl: s.stream_url,
          tag: s.tags || [],
          favoriteCount: s.favorite_count || 0,
          clickCount: s.click_count || 0,
          createdAt: s.created_at,
          description: s.description || ''
        }));
        
        const mappedP = pData.map(p => ({
          ...p,
          stationId: p.station_id,
          clickCount: p.click_count || 0,
          createdAt: p.created_at
        }));

        console.log('--- DATA SYNC COMPLETE - SETTING UI READY ---');
        setStations(mappedS);
        setPrograms(mappedP);
        setIsReady(true);

        // Sequence: Wait 2 seconds before stringifying and saving STATIONS
        setTimeout(() => {
          console.log('--- [SEQUENCE 1] SAVING STATIONS TO CACHE ---');
          const strS = JSON.stringify(mappedS);
          console.log(`--- STATIONS STRING LENGTH: ${strS.length} ---`);
          AsyncStorage.setItem(CACHE_KEYS.STATIONS, strS)
            .then(() => console.log('--- STATIONS SAVE OK ---'))
            .catch(e => console.log('--- STATIONS SAVE ERROR ---', e));
        }, 2000);

        // Sequence: Wait 4 seconds before stringifying and saving PROGRAMS
        setTimeout(() => {
          console.log('--- [SEQUENCE 2] SAVING PROGRAMS TO CACHE ---');
          const strP = JSON.stringify(mappedP);
          console.log(`--- PROGRAMS STRING LENGTH: ${strP.length} ---`);
          AsyncStorage.setItem(CACHE_KEYS.PROGRAMS, strP)
            .then(() => console.log('--- PROGRAMS SAVE OK ---'))
            .catch(e => console.log('--- PROGRAMS SAVE ERROR ---', e));
        }, 4000);

      }
    } catch (e) {
      console.error('--- NETWORK CRASHED ---');
      setIsReady(true);
    }
  };

  const recordClick = async (stationId: string) => {
    try {
      await supabase.rpc('increment_station_click', { station_id_param: stationId });
    } catch (e) {
      console.warn('--- CLICK RECORD ERROR ---');
    }
  };

  const recordProgramClick = async (programId: string) => {
    try {
      await supabase.rpc('increment_program_click', { program_id_param: programId });
    } catch (e) {
      console.warn('--- PROG CLICK ERROR ---');
    }
  };

  return (
    <DataContext.Provider value={{ 
      stations, 
      programs, 
      loading,
      isReady,
      refreshData: performNetworkFetch,
      getProgramsForStation: (id) => programs.filter(p => p.stationId === id),
      recordClick,
      recordProgramClick
    }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) return { 
    isReady: false, 
    loading: true, 
    stations: [], 
    programs: [], 
    refreshData: async () => {},
    getProgramsForStation: () => [],
    recordClick: async () => {},
    recordProgramClick: async () => {}
  };
  return context;
};
