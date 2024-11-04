type DateFormatterOptions = {
  weekday: 'long' | 'short' | 'narrow';
  year: 'numeric' | '2-digit';
  month: 'long' | 'short' | 'narrow' | 'numeric' | '2-digit';
  day: 'numeric' | '2-digit';
  timeZone?: string | undefined;
};

export const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) {
    return 'Date not available'; // Or whatever default value you want to show
  }

  const date = new Date(dateString);
  
  // Check if the date is valid
  if (isNaN(date.getTime())) {
    return 'Invalid date';
  }

  const options: DateFormatterOptions = { 
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/New_York'
  };
  
  return date.toLocaleDateString('en-US', options);
};