import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface FieldOption {
  id: number;
  label: string;
  name: string;
  location: string | null;
}

export const useFieldOptions = () => {
  const [fieldOptions, setFieldOptions] = useState<FieldOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchFieldOptions = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('fields')
          .select('*')
          .order('name');

        if (error) {
          console.error('Error fetching field options:', error);
          setFieldOptions([]);
          return;
        }

        const options: FieldOption[] = data?.map(item => {
          // Create display label with location if available
          const locationDisplay = item.location ? ` (${item.location})` : '';
          
          return {
            id: item.id,
            label: `${item.name}${locationDisplay}`,
            name: item.name,
            location: item.location
          };
        }) || [];

        setFieldOptions(options);
      } catch (error) {
        console.error('Error fetching field options:', error);
        setFieldOptions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFieldOptions();
  }, []);

  return { fieldOptions, loading };
};