// utils/formatDate.tsx
export const formatDate = (dateString?: string | null, format: 'full' | 'short' = 'full'): string => {
  if (!dateString) return 'TBD';
  
  try {
    const date = new Date(dateString);
    
    if (format === 'short') {
      // Format like "00 MON" (e.g., "25 JUN")
      const day = date.getDate().toString().padStart(2, '0');
      const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
      return `${day} ${month}`;
    } else {
      // Full format (e.g., "Monday, June 25, 2023")
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};