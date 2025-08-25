
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { UseFormReturn } from 'react-hook-form';
import { TeacherFormValues } from './types';

interface TeachingStyleRadioProps {
  form: UseFormReturn<TeacherFormValues>;
}

const TeachingStyleRadio: React.FC<TeachingStyleRadioProps> = ({ form }) => {
  const { t, language } = useLanguage();
  
  return (
    <FormField
      control={form.control}
      name="teachingStyle"
      render={({ field }) => (
        <FormItem className="space-y-2">
          <FormLabel>{t('teachingStyle')}</FormLabel>
          <FormControl>
            <RadioGroup
              onValueChange={field.onChange}
              defaultValue={field.value}
              className="flex flex-col space-y-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="teacher" id="teacher" />
                <Label htmlFor="teacher" className="font-normal cursor-pointer">
                  {language === 'hi' 
                    ? 'एकदम असली शिक्षक की तरह (इंटरैक्टिव और जीवंत)' 
                    : 'Like a real teacher (interactive & engaging)'}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="standard" id="standard" />
                <Label htmlFor="standard" className="font-normal cursor-pointer">
                  {language === 'hi'
                    ? 'मानक शैक्षणिक शैली (सीधे तथ्य और जानकारी)'
                    : 'Standard educational style (direct facts and information)'}
                </Label>
              </div>
            </RadioGroup>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default TeachingStyleRadio;
