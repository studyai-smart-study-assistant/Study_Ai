
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { UseFormReturn } from 'react-hook-form';
import { TeacherFormValues } from './types';

interface StudentNameFieldProps {
  form: UseFormReturn<TeacherFormValues>;
}

const StudentNameField: React.FC<StudentNameFieldProps> = ({ form }) => {
  const { t } = useLanguage();
  
  return (
    <FormField
      control={form.control}
      name="studentName"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t('studentName')}</FormLabel>
          <FormControl>
            <Input 
              placeholder={t('enterStudentName')} 
              {...field} 
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default StudentNameField;
