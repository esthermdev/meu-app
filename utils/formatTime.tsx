export const formatTime = (timeString: string | null | undefined) => {
  if (!timeString) {
    return 'TBD'; // Or whatever default value you prefer
  }

  try {
    // Check if the timeString has enough characters
    if (timeString.length >= 5) {
      return timeString.substring(0, 5);
    } else {
      return timeString; // Return original string if it's too short
    }
  } catch (error) {
    return 'Invalid time';
  }
};