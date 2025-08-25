
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { UseFormReturn } from 'react-hook-form';
import { TeacherFormValues } from './types';

interface ActionRadioProps {
  form: UseFormReturn<TeacherFormValues>;
}

const ActionRadio: React.FC<ActionRadioProps> = ({ form }) => {
  const { t } = useLanguage();
  
  return (
    <FormField
      control={form.control}
      name="action"
      render={({ field }) => (
        <FormItem className="space-y-2">
          <FormLabel>{t('action')}</FormLabel>
          <FormControl>
            <RadioGroup
              onValueChange={field.onChange}
              defaultValue={field.value}
              className="flex flex-col space-y-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="notes" id="notes" />
                <Label htmlFor="notes" className="font-normal cursor-pointer">{t('actionNotes')}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="read" id="read" />
                <Label htmlFor="read" className="font-normal cursor-pointer">{t('actionRead')}</Label>
              </div>
            </RadioGroup>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default ActionRadio;
