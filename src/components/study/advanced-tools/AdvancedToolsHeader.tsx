
import React from 'react';
import { Globe } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage, Language } from '@/contexts/LanguageContext';

interface AdvancedToolsHeaderProps {
  title: string;
  description: string;
}

const AdvancedToolsHeader: React.FC<AdvancedToolsHeaderProps> = ({ title, description }) => {
  const { language, setLanguage, t } = useLanguage();

  const handleLanguageChange = (value: string) => {
    setLanguage(value as Language);
  };

  return (
    <div className="p-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex justify-between items-center">
      <div>
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="text-sm text-purple-100">{description}</p>
      </div>
      <div className="flex items-center gap-2">
        <Globe className="h-4 w-4 text-white" />
        <Select
          value={language}
          onValueChange={handleLanguageChange}
        >
          <SelectTrigger className="w-[110px] bg-white/10 border-white/20 text-white">
            <SelectValue placeholder={t('language')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">{t('english')}</SelectItem>
            <SelectItem value="hi">{t('hindi')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default AdvancedToolsHeader;
