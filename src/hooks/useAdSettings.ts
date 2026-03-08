import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AdSetting {
  ad_network: string;
  page: string;
  enabled: boolean;
}

export const useAdSettings = () => {
  const [settings, setSettings] = useState<AdSetting[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('ad_settings')
        .select('ad_network, page, enabled');
      if (error) throw error;
      setSettings(data || []);
    } catch (err) {
      console.error('Failed to fetch ad settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const isAdEnabled = (network: string, page: string): boolean => {
    // Check global master toggle first
    const globalSetting = settings.find(s => s.ad_network === network && s.page === 'global');
    if (!globalSetting?.enabled) return false;
    
    // Then check page-specific
    const pageSetting = settings.find(s => s.ad_network === network && s.page === page);
    if (pageSetting) return pageSetting.enabled;
    
    // If no page-specific setting, use global
    return globalSetting.enabled;
  };

  return { settings, loading, isAdEnabled, refetch: fetchSettings };
};
