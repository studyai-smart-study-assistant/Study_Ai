
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { UseFormReturn } from 'react-hook-form';
import { TeacherFormValues } from './types';

interface SubjectFieldsProps {
  form: UseFormReturn<TeacherFormValues>;
  customSubject: boolean;
  onSubjectChange: (value: string) => void;
}

const SubjectFields: React.FC<SubjectFieldsProps> = ({ form, customSubject, onSubjectChange }) => {
  const { t } = useLanguage();
  
  const subjects = [
    { value: 'mathematics', label: t('mathematics') },
    { value: 'physics', label: t('physics') },
    { value: 'chemistry', label: t('chemistry') },
    { value: 'biology', label: t('biology') },
    { value: 'history', label: t('history') },
    { value: 'geography', label: t('geography') },
    { value: 'computerScience', label: t('computerScience') },
    { value: 'literature', label: t('literature') },
    { value: 'economics', label: t('economics') },
    { value: 'psychology', label: t('psychology') },
    { value: 'sociology', label: t('sociology') },
    { value: 'custom', label: t('customSubject') },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField
        control={form.control}
        name="subject"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('subject')}</FormLabel>
            <Select 
              onValueChange={onSubjectChange} 
              defaultValue={field.value}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={t('selectSubject')} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={subject.value} value={subject.value}>
                    {subject.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {customSubject && (
        <FormField
          control={form.control}
          name="customSubjectText"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('customSubject')}</FormLabel>
              <FormControl>
                <Input 
                  placeholder={t('enterCustomSubject')} 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <FormField
        control={form.control}
        name="chapter"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('chapter')}</FormLabel>
            <FormControl>
              <Input 
                placeholder={t('enterChapter')} 
                {...field} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default SubjectFields;
