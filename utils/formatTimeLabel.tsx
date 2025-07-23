const formatTimeLabel = (time: string): string => {
  const [hourStr, minuteStr] = time.split(':');
  let hour = parseInt(hourStr);
  const minute = parseInt(minuteStr);
  const period = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12;
  return `${hour}:${minute.toString().padStart(2, '0')}${period}`;
};

export default formatTimeLabel;
