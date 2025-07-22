import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import formatTimeLabel from '@/utils/formatTimeLabel';
import { formatDate } from '@/utils/formatDate';

interface DatetimeOption {
  id: number;
  label: string;
  date: string | null;
  time: string;
}

export const useDatetimeOptions = () => {
  const [datetimeOptions, setDatetimeOptions] = useState<DatetimeOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDatetimeOptions = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('datetime')
          .select('*')
          .order('date')
          .order('time');

        if (error) {
          console.error('Error fetching datetime options:', error);
          setDatetimeOptions([]);
          return;
        }

        const options: DatetimeOption[] = data?.map(item => {
          const dateDisplay = item.date ? formatDate(item.date, 'short') : 'TBD';
          const timeDisplay = formatTimeLabel(item.time);
          
          return {
            id: item.id,
            label: `${dateDisplay} at ${timeDisplay}`,
            date: item.date,
            time: item.time
          };
        }) || [];

        // Check for duplicate labels and make them unique by appending ID
        const labelCounts = new Map<string, number>();
        const processedOptions: DatetimeOption[] = [];
        
        // First pass: count occurrences of each label
        for (const option of options) {
          const count = labelCounts.get(option.label) || 0;
          labelCounts.set(option.label, count + 1);
        }
        
        // Second pass: append ID to duplicate labels
        const labelCounters = new Map<string, number>();
        for (const option of options) {
          const baseLabel = option.label;
          const totalCount = labelCounts.get(baseLabel) || 1;
          
          if (totalCount > 1) {
            const counter = (labelCounters.get(baseLabel) || 0) + 1;
            labelCounters.set(baseLabel, counter);
            option.label = `${baseLabel} (#${option.id})`;
          }
          
          processedOptions.push(option);
        }

        setDatetimeOptions(processedOptions);
      } catch (error) {
        console.error('Error fetching datetime options:', error);
        setDatetimeOptions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDatetimeOptions();
  }, []);

  return { datetimeOptions, loading };
};