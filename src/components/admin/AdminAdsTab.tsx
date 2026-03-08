import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Megaphone, Globe, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface AdSetting {
  id: string;
  ad_network: string;
  page: string;
  enabled: boolean;
}

const PAGE_LABELS: Record<string, string> = {
  global: '🌐 Master (All Pages)',
  home: '🏠 Home',
  profile: '👤 Profile',
  notes: '📝 Notes',
  quiz: '🧠 Quiz',
  library: '📚 Library',
  teacher: '👩‍🏫 AI Teacher',
};

const AdminAdsTab: React.FC = () => {
  const [settings, setSettings] = useState<AdSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ad_settings')
        .select('*')
        .order('ad_network')
        .order('page');
      if (error) throw error;
      setSettings(data || []);
    } catch (err) {
      console.error('Failed to fetch ad settings:', err);
      toast.error('Settings load failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const toggleSetting = async (id: string, currentValue: boolean) => {
    setUpdating(id);
    try {
      const { error } = await supabase
        .from('ad_settings')
        .update({ enabled: !currentValue, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      setSettings(prev => prev.map(s => s.id === id ? { ...s, enabled: !currentValue } : s));
      toast.success(`Ad ${!currentValue ? 'enabled' : 'disabled'}`);
    } catch (err) {
      console.error('Toggle failed:', err);
      toast.error('Update failed');
    } finally {
      setUpdating(null);
    }
  };

  const toggleAllForNetwork = async (network: string, enable: boolean) => {
    try {
      const { error } = await supabase
        .from('ad_settings')
        .update({ enabled: enable, updated_at: new Date().toISOString() })
        .eq('ad_network', network);
      if (error) throw error;
      setSettings(prev => prev.map(s => s.ad_network === network ? { ...s, enabled: enable } : s));
      toast.success(`${network} ads ${enable ? 'all enabled' : 'all disabled'}`);
    } catch (err) {
      toast.error('Bulk update failed');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const adsterraSettings = settings.filter(s => s.ad_network === 'adsterra');
  const monetagSettings = settings.filter(s => s.ad_network === 'monetag');

  const renderNetworkCard = (network: string, label: string, description: string, networkSettings: AdSetting[], color: string) => {
    const globalSetting = networkSettings.find(s => s.page === 'global');
    const pageSettings = networkSettings.filter(s => s.page !== 'global');
    const isGlobalOn = globalSetting?.enabled || false;

    return (
      <Card key={network}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Megaphone className={`h-5 w-5 text-${color}-500`} />
              {label}
              <Badge variant={isGlobalOn ? 'default' : 'secondary'}>
                {isGlobalOn ? 'ACTIVE' : 'OFF'}
              </Badge>
            </CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => toggleAllForNetwork(network, true)}>
                All ON
              </Button>
              <Button size="sm" variant="outline" onClick={() => toggleAllForNetwork(network, false)}>
                All OFF
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Global Master Toggle */}
          {globalSetting && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                <span className="font-semibold text-foreground">{PAGE_LABELS.global}</span>
              </div>
              <Switch
                checked={globalSetting.enabled}
                onCheckedChange={() => toggleSetting(globalSetting.id, globalSetting.enabled)}
                disabled={updating === globalSetting.id}
              />
            </div>
          )}

          {/* Per-page toggles */}
          {!isGlobalOn && (
            <p className="text-xs text-muted-foreground text-center py-2">
              ⚠️ Master toggle OFF है — पहले master ON करें
            </p>
          )}
          
          <div className={`space-y-2 ${!isGlobalOn ? 'opacity-50 pointer-events-none' : ''}`}>
            {pageSettings.map(setting => (
              <div key={setting.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{PAGE_LABELS[setting.page] || setting.page}</span>
                </div>
                <Switch
                  checked={setting.enabled}
                  onCheckedChange={() => toggleSetting(setting.id, setting.enabled)}
                  disabled={updating === setting.id}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Ad Networks Control</h3>
        <Button size="sm" variant="outline" onClick={fetchSettings}>
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh
        </Button>
      </div>

      {renderNetworkCard('adsterra', 'Adsterra (Banner Ads)', 'Banner ads shown in gaps between content sections', adsterraSettings, 'blue')}
      {renderNetworkCard('monetag', 'Monetag (Interstitial)', 'Popup/interstitial ads shown occasionally on page load', monetagSettings, 'orange')}
    </div>
  );
};

export default AdminAdsTab;
