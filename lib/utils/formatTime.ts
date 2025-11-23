export const formatTime = (timeString: string | Date | undefined): string => {
  // Convert input to string and check for validity
  const input = timeString ? String(timeString) : '';

  if (!input) return '-'; // Return '-' if input is empty

  let date: Date;

  // Check if the input is a string in HHMM format
  if (/^\d{4}$/.test(input)) {
    const hours = parseInt(input.slice(0, 2), 10);
    const minutes = parseInt(input.slice(2, 4), 10);
    date = new Date();
    date.setHours(hours, minutes, 0); // Set seconds to zero
  } else {
    // Handle other date formats
    date = new Date(input);

    // Check if date is valid
    if (isNaN(date.getTime())) return '-';
  }

  // Format time in HH:MM AM/PM 
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true // Change to false for 24-hour format
  });
};
