export const HOUR_IN_MINUTES = 60;
export const DAY_IN_MINUTES = HOUR_IN_MINUTES * 24;
export const WEEK_IN_MINUTES = DAY_IN_MINUTES * 7;
export const PM_OFFSET_MINUTES = HOUR_IN_MINUTES * 12;

export const PM = 'pm';

export const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

/**
 * Converts 12 hour time to seconds
 */
export function convert12HourTimeToSeconds(timeString: string): number {
  const timeParts = timeString.split(' '); // eg. ['12:34', 'am]
  const time = timeParts[0]; // eg. 12:34
  const meridiem = timeParts[1]; // eg. am

  const timeSplit = time.split(':').map((item) => parseInt(item));

  if (timeSplit.length === undefined) {
    return 0;
  }

  let minutes = 0;

  // Only multiple hours by number of seconds in an hour if that hour is not 12.
  // 12 PM is accounted for by the meridiem conversion
  if (timeSplit[0] !== 12) {
    minutes += timeSplit[0] * HOUR_IN_MINUTES;
  }

  if (timeSplit[1] !== undefined) {
    minutes += timeSplit[1];
  }

  if (timeSplit[2] !== undefined) {
    minutes += timeSplit[2];
  }

  // Offset by 12 hours if time is in PM
  if (meridiem === PM) {
    minutes += PM_OFFSET_MINUTES;
  }

  return minutes;
}
