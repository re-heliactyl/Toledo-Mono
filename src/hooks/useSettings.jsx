import React, { createContext, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const SettingsContext = createContext(null);

export const SettingsProvider = ({ children }) => {
  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data } = await axios.get('/api/v5/settings');
      localStorage.setItem('site_settings', JSON.stringify(data));
      return data;
    },
    initialData: () => {
      const cached = localStorage.getItem('site_settings');
      return cached ? JSON.parse(cached) : undefined;
    },
    staleTime: Infinity,
  });

  return (
    <SettingsContext.Provider value={{ settings, isLoading }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
