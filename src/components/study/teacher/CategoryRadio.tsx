
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { UseFormReturn } from 'react-hook-form';
import { TeacherFormValues } from './types';

interface CategoryRadioProps {
  form: UseFormReturn<TeacherFormValues>;
}

const CategoryRadio: React.FC<CategoryRadioProps> = ({ form }) => {
  const { t } = useLanguage();
  
  return (
    <FormField
      control={form.control}
      name="category"
      render={({ field }) => (
        <FormItem className="space-y-2">
          <FormLabel>{t('category')}</FormLabel>
          <FormControl>
            <RadioGroup
              onValueChange={field.onChange}
              defaultValue={field.value}
              className="flex flex-col space-y-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="concise" id="concise" />
                <Label htmlFor="concise" className="font-normal cursor-pointer">{t('categoryConcise')}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="detailed" id="detailed" />
                <Label htmlFor="detailed" className="font-normal cursor-pointer">{t('categoryDetailed')}</Label>
              </div>
            </RadioGroup>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default CategoryRadio;
