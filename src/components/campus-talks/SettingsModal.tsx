import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, User, MessageCircle, Bell, Shield, Palette, Moon, Sun, Globe, LogOut } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/providers/ThemeProvider';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { logout } = useAuth();
  const { theme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);
  const [onlineStatus, setOnlineStatus] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);
  const [language, setLanguage] = useState('hindi');

  const handleLogout = async () => {
    try {
      await logout();
      onClose();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const settingsSections = [
    {
      title: 'Profile',
      icon: User,
      items: [
        {
          label: 'Profile',
          description: 'Update your profile information',
          action: () => console.log('Open profile'),
          type: 'button'
        }
      ]
    },
    {
      title: 'ऑटो डिलीट सेटिंग्स',
      icon: MessageCircle,
      items: [
        {
          label: 'Auto-delete messages',
          description: 'Automatically delete old messages',
          value: false,
          onChange: () => {},
          type: 'switch'
        },
        {
          label: 'Read receipts',
          description: 'Show when messages are read',
          value: readReceipts,
          onChange: setReadReceipts,
          type: 'switch'
        }
      ]
    },
    {
      title: 'Language',
      icon: Globe,
      items: [
        {
          label: 'App language',
          description: 'Choose your preferred language',
          value: language,
          onChange: setLanguage,
          type: 'select',
          options: [
            { value: 'english', label: 'English' },
            { value: 'hindi', label: 'Hindi' }
          ]
        }
      ]
    },
    {
      title: 'Theme',
      icon: theme === 'dark' ? Moon : Sun,
      items: [
        {
          label: 'Dark mode',
          description: 'Switch between light and dark theme',
          value: theme === 'dark',
          onChange: (value: boolean) => console.log('Theme change:', value),
          type: 'switch'
        }
      ]
    },
    {
      title: 'Notifications',
      icon: Bell,
      items: [
        {
          label: 'Push notifications',
          description: 'Receive notifications for new messages',
          value: notifications,
          onChange: setNotifications,
          type: 'switch'
        },
        {
          label: 'Sound effects',
          description: 'Play sounds for notifications',
          value: soundEffects,
          onChange: setSoundEffects,
          type: 'switch'
        }
      ]
    },
    {
      title: 'Privacy',
      icon: Shield,
      items: [
        {
          label: 'Show online status',
          description: 'Let others see when you\'re online',
          value: onlineStatus,
          onChange: setOnlineStatus,
          type: 'switch'
        }
      ]
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-0">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/20 dark:border-gray-700/30">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Settings
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full hover:bg-white/20 dark:hover:bg-gray-800/50"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <ScrollArea className="max-h-[calc(90vh-140px)]">
            <div className="p-4 space-y-6">
              {settingsSections.map((section) => (
                <div key={section.title} className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <section.icon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">
                      {section.title}
                    </h3>
                  </div>
                  
                  <div className="space-y-3 ml-7">
                    {section.items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex-1">
                          <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {item.label}
                          </Label>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {item.description}
                          </p>
                        </div>
                        
                        <div className="ml-4">
                          {item.type === 'switch' && (
                            <Switch
                              checked={item.value as boolean}
                              onCheckedChange={item.onChange as (value: boolean) => void}
                            />
                          )}
                          
                          {item.type === 'select' && (
                            <Select
                              value={item.value as string}
                              onValueChange={item.onChange as (value: string) => void}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {(item.options || []).map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                          
                          {item.type === 'button' && (
                            <Button variant="outline" size="sm" onClick={item.action}>
                              Edit
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Logout Button */}
              <div className="pt-4 border-t border-white/20 dark:border-gray-700/30">
                <Button
                  variant="destructive"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log out</span>
                </Button>
              </div>
            </div>
          </ScrollArea>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;