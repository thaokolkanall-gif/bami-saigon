import React, { createContext, useContext, useState, useEffect } from 'react';
import { StoreSettings, DeliveryZone } from '../types';

interface StoreContextType {
  settings: StoreSettings | null;
  zones: DeliveryZone[];
  isLoading: boolean;
  isOpenNow: boolean;
  refreshSettings: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const [resSettings, resZones] = await Promise.all([
        fetch('/api/store/settings', { cache: 'no-store' }),
        fetch('/api/store/zones', { cache: 'no-store' })
      ]);

      if (resSettings.ok) {
        const data = await resSettings.json();
        setSettings(data);
      }
      if (resZones.ok) {
        const zoneData = await resZones.json();
        setZones(zoneData);
      }
    } catch (err) {
      console.error('Failed to load store settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Check if store is open right now based on opening_hours / open_time
  const checkIsOpenNow = (): boolean => {
    if (!settings) return true;
    if (settings.is_online_ordering_enabled === '0' || settings.is_paused === '1') {
      return false;
    }

    try {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      if (settings.open_time && settings.close_time) {
        return currentTime >= settings.open_time && currentTime <= settings.close_time;
      }

      const hours = typeof settings.opening_hours === 'string' 
        ? JSON.parse(settings.opening_hours) 
        : settings.opening_hours;

      if (!hours) return true;

      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const currentDay = days[now.getDay()];
      const daySchedule = hours[currentDay];

      if (!daySchedule || !daySchedule.isOpen) return false;

      return currentTime >= daySchedule.open && currentTime <= daySchedule.close;
    } catch (e) {
      return true;
    }
  };

  return (
    <StoreContext.Provider value={{
      settings,
      zones,
      isLoading,
      isOpenNow: checkIsOpenNow(),
      refreshSettings: fetchSettings
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
