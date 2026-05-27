import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';
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
  department?: string;
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

// ---------------------------------------------------------------------------
// Single state object + reducer
// Previously there were 4 separate useState calls (stations, programs, loading,
// isReady). Each individual setState() triggers its own render cycle, so a
// sequence of setStations + setPrograms + setIsReady = 3 renders. By batching
// them into one dispatch we guarantee a single render per logical update.
// ---------------------------------------------------------------------------
interface DataState {
  stations: Station[];
  programs: Program[];
  loading: boolean;
  isReady: boolean;
}

type DataAction =
  | { type: 'LOAD_CACHE'; stations: Station[]; programs: Program[] }
  | { type: 'LOAD_NETWORK'; stations: Station[]; programs: Program[] }
  | { type: 'MARK_READY' }
  | { type: 'SET_LOADING'; loading: boolean };

const initialState: DataState = {
  stations: [],
  programs: [],
  loading: true,
  isReady: false,
};

function dataReducer(state: DataState, action: DataAction): DataState {
  switch (action.type) {
    case 'LOAD_CACHE':
      // Single render: stations + programs + isReady all update together
      return { ...state, stations: action.stations, programs: action.programs, isReady: true };
    case 'LOAD_NETWORK':
      // Single render: fresh data from network, mark done loading
      return { stations: action.stations, programs: action.programs, isReady: true, loading: false };
    case 'MARK_READY':
      return { ...state, isReady: true, loading: false };
    case 'SET_LOADING':
      return { ...state, loading: action.loading };
    default:
      return state;
  }
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(dataReducer, initialState);

  const performNetworkFetch = useCallback(async () => {
    try {
      console.log('--- NETWORK FETCH STARTING ---');
      const fieldsS = 'id, name, logo, stream_url, city, country, department, tags, favorite_count, click_count, created_at, description, frequency';
      const fieldsP = 'id, name, station_id, poster, schedules, click_count, created_at';

      const fetchAll = async (table: string, fields: string) => {
        let allData: any[] = [];
        let from = 0;
        const limit = 1000;
        let hasMore = true;

        while (hasMore) {
          const { data, error } = await supabase
            .from(table)
            .select(fields)
            .range(from, from + limit - 1);

          if (error) throw error;
          
          if (data && data.length > 0) {
            allData = allData.concat(data);
            from += limit;
            if (data.length < limit) {
              hasMore = false;
            }
          } else {
            hasMore = false;
          }
        }
        return allData;
      };

      let sData: any[] = [];
      let pData: any[] = [];
      let fetchError = false;

      try {
        [sData, pData] = await Promise.all([
          fetchAll('stations', fieldsS),
          fetchAll('programs', fieldsP),
        ]);
      } catch (err) {
        console.error('--- SUPABASE ERROR ---', err);
        fetchError = true;
      }

      if (fetchError) {
        dispatch({ type: 'MARK_READY' });
        return;
      }

      if (sData && pData) {
        const mappedS = sData.map(s => ({
          ...s,
          streamUrl: s.stream_url,
          department: s.department,
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

        console.log('--- DATA SYNC COMPLETE ---');
        // ONE dispatch = ONE render (was 3 separate setState calls before)
        dispatch({ type: 'LOAD_NETWORK', stations: mappedS, programs: mappedP });

        // Defer cache writes — these are fire-and-forget and don't affect UI
        setTimeout(() => {
          AsyncStorage.setItem(CACHE_KEYS.STATIONS, JSON.stringify(mappedS))
            .catch(e => console.log('--- STATIONS SAVE ERROR ---', e));
        }, 2000);

        setTimeout(() => {
          AsyncStorage.setItem(CACHE_KEYS.PROGRAMS, JSON.stringify(mappedP))
            .catch(e => console.log('--- PROGRAMS SAVE ERROR ---', e));
        }, 4000);
      }
    } catch (e) {
      console.error('--- NETWORK CRASHED ---');
      dispatch({ type: 'MARK_READY' });
    }
  }, []);

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
              // ONE dispatch = ONE render (was 3 setState calls before)
              dispatch({ type: 'LOAD_CACHE', stations: s, programs: p });
              console.log('--- DATA LOADED FROM CACHE ---');
            }
          } catch {
            console.warn('--- CACHE PARSE ERROR ---');
          }
        }
      } catch {
        console.warn('--- ASYNC STORAGE ERROR ---');
      }

      await performNetworkFetch();
    };

    startup();
  }, [performNetworkFetch]);

  const recordClick = useCallback(async (stationId: string) => {
    try {
      await supabase.rpc('increment_station_click', { station_id_param: stationId });
    } catch {
      console.warn('--- CLICK RECORD ERROR ---');
    }
  }, []);

  const recordProgramClick = useCallback(async (programId: string) => {
    try {
      await supabase.rpc('increment_program_click', { program_id_param: programId });
    } catch {
      console.warn('--- PROG CLICK ERROR ---');
    }
  }, []);

  // Memoize the getProgramsForStation function AND the context value object.
  // Without this, the Provider recreates a new plain object {} on every render,
  // which forces ALL consumers (HomeScreen, ProgramGuide, etc.) to re-render
  // even when the data hasn't changed.
  const getProgramsForStation = useCallback(
    (id: string) => state.programs.filter(p => p.stationId === id),
    [state.programs]
  );

  const contextValue = useMemo(() => ({
    stations: state.stations,
    programs: state.programs,
    loading: state.loading,
    isReady: state.isReady,
    refreshData: performNetworkFetch,
    getProgramsForStation,
    recordClick,
    recordProgramClick,
  }), [state, performNetworkFetch, getProgramsForStation, recordClick, recordProgramClick]);

  return (
    <DataContext.Provider value={contextValue}>
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
