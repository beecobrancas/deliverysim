"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface SiteSettings {
  id?: number;
  header_title: string;
  header_subtitle: string;
  social_link_1: string;
  social_link_2: string;
  min_order: string;
  delivery_info: string;
  distance: string;
  rating: string;
  reviews_count: string;
  logo: string;
  default_image: string;
  primary_color: string;
  show_notifications: boolean;
  facebook_pixel_id?: string;
  header_bg_color?: string;
  banner_bg_color?: string;
  banner_text_color?: string;
  banner_text?: string;
  show_banner?: boolean;
}

const emptySettings: SiteSettings = {
  id: 1,
  header_title: '',
  header_subtitle: '',
  social_link_1: '',
  social_link_2: '',
  min_order: '',
  delivery_info: '',
  distance: '',
  rating: '',
  reviews_count: '',
  logo: '',
  default_image: '',
  primary_color: '#f97316',
  show_notifications: true,
  facebook_pixel_id: '',
  header_bg_color: '#f97316',
  banner_bg_color: '#dc2626',
  banner_text_color: '#ffffff',
  banner_text: 'PREÇOS ESPECIAIS DE INAUGURAÇÃO',
  show_banner: true,
};

interface SettingsContextType {
  settings: SiteSettings;
  updateSettings: (newSettings: Partial<SiteSettings>) => Promise<void>;
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(emptySettings);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (error) {
      console.error('Erro ao buscar configurações:', error);
      toast.error('Erro ao carregar as configurações do site.');
      setSettings(emptySettings);
    } else if (data) {
      const sanitizedData = { ...emptySettings };
      for (const key in sanitizedData) {
        if (data[key] !== null && data[key] !== undefined) {
          (sanitizedData as any)[key] = data[key];
        }
      }
      setSettings(sanitizedData);
    } else {
      setSettings(emptySettings);
    }
    
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = async (newSettings: Partial<SiteSettings>) => {
    const { error } = await supabase
      .from('settings')
      .update(newSettings)
      .eq('id', 1);

    if (error) {
      toast.error('Falha ao salvar as configurações.');
      console.error('Erro ao salvar configurações:', error);
    } else {
      toast.success('Configurações salvas com sucesso!');
      setSettings(prev => ({ ...prev, ...newSettings }));
    }
  };

  const value: SettingsContextType = {
    settings,
    updateSettings,
    loading,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings deve ser usado dentro de um SettingsProvider');
  }
  return context;
}