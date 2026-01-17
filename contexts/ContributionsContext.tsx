import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface ScheduleSlot {
  startTime: string;
  endTime: string;
  days: string[];
}

export interface Contribution {
  id: string;
  stationId: string;
  name: string;
  host?: string;
  description?: string;
  schedules: ScheduleSlot[];
  status: 'pending' | 'approved';
  createdAt: number;
}

interface ContributionsContextType {
  contributions: Contribution[];
  loading: boolean;
  addContribution: (contribution: Omit<Contribution, 'id' | 'status' | 'createdAt'>) => Promise<void>;
  getContributionsForStation: (stationId: string) => Contribution[];
}

const ContributionsContext = createContext<ContributionsContextType | undefined>(undefined);

export function ContributionsProvider({ children }: { children: React.ReactNode }) {
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContributions();
  }, []);

  const fetchContributions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contributions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const mapped: Contribution[] = data.map(item => ({
          id: item.id,
          stationId: item.station_id,
          name: item.name,
          host: item.host,
          description: item.description,
          schedules: item.schedules,
          status: item.status,
          createdAt: new Date(item.created_at).getTime(),
        }));
        setContributions(mapped);
      }
    } catch (e) {
      console.error('Failed to fetch contributions', e);
    } finally {
      setLoading(false);
    }
  };

  const addContribution = async (data: Omit<Contribution, 'id' | 'status' | 'createdAt'>) => {
    try {
      const { data: inserted, error } = await supabase
        .from('contributions')
        .insert([
          {
            station_id: data.stationId,
            name: data.name,
            host: data.host,
            description: data.description,
            schedules: data.schedules,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      if (inserted) {
        const newContribution: Contribution = {
          id: inserted.id,
          stationId: inserted.station_id,
          name: inserted.name,
          host: inserted.host,
          description: inserted.description,
          schedules: inserted.schedules,
          status: inserted.status,
          createdAt: new Date(inserted.created_at).getTime(),
        };
        setContributions(prev => [newContribution, ...prev]);
      }
    } catch (e) {
      console.error('Failed to save contribution', e);
      throw e;
    }
  };

  const getContributionsForStation = (stationId: string) => {
    return contributions.filter(c => c.stationId === stationId);
  };

  return (
    <ContributionsContext.Provider value={{ contributions, loading, addContribution, getContributionsForStation }}>
      {children}
    </ContributionsContext.Provider>
  );
}

export function useContributions() {
  const context = useContext(ContributionsContext);
  if (context === undefined) {
    throw new Error('useContributions must be used within a ContributionsProvider');
  }
  return context;
}
