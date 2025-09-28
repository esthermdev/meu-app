export const getTimeColor = (dateString: string | null, thresholds?: { recent: number; moderate: number }) => {
  if (!dateString) return '#EA1D25'; // Default to red if unknown
  
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  // Use custom thresholds or defaults
  const recentThreshold = thresholds?.recent ?? 30;
  const moderateThreshold = thresholds?.moderate ?? 60;
  
  if (diffMins < recentThreshold) return '#59DE07'; // Green
  if (diffMins < moderateThreshold) return '#FFD600'; // Yellow
  return '#EA1D25'; // Red
};