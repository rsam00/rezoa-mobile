import React, { createContext, useContext, useEffect, useState } from 'react';
import { programs as localPrograms } from '../data/programs_updated';
import { stations as localStations } from '../data/working_stations_2';
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
  refreshData: () => Promise<void>;
  getProgramsForStation: (stationId: string) => Program[];
  recordClick: (stationId: string) => Promise<void>;
  recordProgramClick: (programId: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [stations, setStations] = useState<Station[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Stations
      const { data: sData, error: sError } = await supabase
        .from('stations')
        .select('*');
      
      // 2. Fetch Programs
      const { data: pData, error: pError } = await supabase
        .from('programs')
        .select('*');

      if (sError || pError) {
        console.log('⚠️ Supabase fetch error:', sError || pError);
        fallbackToLocal();
      } else if (!sData || sData.length === 0) {
        console.log('ℹ️ Supabase is empty, using local fallback.');
        fallbackToLocal();
      } else {
        // Map Supabase snake_case to CamelCase expected by frontend
        setStations(sData.map(s => ({
          ...s,
          streamUrl: s.stream_url,
          tag: s.tags,
          favoriteCount: s.favorite_count,
          clickCount: s.click_count,
          createdAt: s.created_at
        })));
        setPrograms(pData.map(p => ({
          ...p,
          stationId: p.station_id,
          clickCount: p.click_count,
          createdAt: p.created_at
        })));
      }
    } catch (e) {
      console.error('❌ Critical error fetching from Supabase:', e);
      fallbackToLocal();
    } finally {
      setLoading(false);
    }
  };

  const fallbackToLocal = () => {
    setStations(localStations as any);
    setPrograms(localPrograms as any);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getProgramsForStation = (stationId: string) => {
    return programs.filter(p => p.stationId === stationId);
  };

  const recordClick = async (stationId: string) => {
    try {
      await supabase.rpc('increment_station_click', { station_id_param: stationId });
    } catch (e) {
      console.warn('Error recording station click:', e);
    }
  };

  const recordProgramClick = async (programId: string) => {
    try {
      await supabase.rpc('increment_program_click', { program_id_param: programId });
    } catch (e) {
      console.warn('Error recording program click:', e);
    }
  };

  return (
    <DataContext.Provider value={{ 
      stations, 
      programs, 
      loading, 
      refreshData: fetchData,
      getProgramsForStation,
      recordClick,
      recordProgramClick
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
