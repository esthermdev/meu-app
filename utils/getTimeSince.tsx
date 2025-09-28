export const getTimeSince = (dateString: string | null) => {
  if (!dateString) return 'Unknown';
  
  const now = new Date();
  const createdAt = new Date(dateString);
  const diffMs = now.getTime() - createdAt.getTime();
  
  // Convert to minutes
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 60) {
    return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  } else {
    const diffHours = Math.floor(diffMins / 60);
    const remainingMins = diffMins % 60;
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ${remainingMins > 0 ? `${remainingMins} min${remainingMins !== 1 ? 's' : ''}` : ''} ago`;
  }
};