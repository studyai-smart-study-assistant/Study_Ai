
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { UseFormReturn } from 'react-hook-form';
import { TeacherFormValues } from './types';
import { BookOpen } from 'lucide-react';

interface AlternativeClassesFieldProps {
  form: UseFormReturn<TeacherFormValues>;
}

const AlternativeClassesField: React.FC<AlternativeClassesFieldProps> = ({ form }) => {
  const { t } = useLanguage();

  return (
    <FormField
      control={form.control}
      name="alternativeClasses"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="flex items-center gap-2 text-purple-700 dark:text-purple-400 font-semibold">
            <BookOpen className="h-4 w-4" />
            {t('alternativeClasses')}
          </FormLabel>
          <FormControl>
            <Textarea 
              placeholder={t('alternativeClassesPlaceholder')} 
              className="min-h-[80px] bg-white/70 dark:bg-gray-800/70 border-purple-200 dark:border-purple-700 focus:ring-purple-500 focus:border-purple-500"
              {...field} 
            />
          </FormControl>
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {t('alternativeClassesExample')}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default AlternativeClassesField;
