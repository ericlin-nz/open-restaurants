import {
  HOUR_IN_SECONDS,
  MINUTE_IN_SECONDS,
  PM,
  PM_OFFSET_SECONDS,
} from '../constants/datetime';

/**
 * Converts 12 hour time to seconds
 *
 * @param {string} time - In the format of hh:ss aaa', 'h:ss aaa' or 'h aaa'
 * @returns {int} time in seconds
 */
export const convert12HourTimeToSeconds = (timeString: string) => {
  const timeParts = timeString.split(' '); // eg. ['12:34', 'am]
  const time = timeParts[0]; // eg. 12:34
  const meridiem = timeParts[1]; // eg. am

  const timeSplit = time.split(':').map((item) => parseInt(item));

  if (!timeSplit.length) {
    return 0;
  }

  let seconds = 0;

  // Only multiple hours by number of seconds in an hour if that hour is not 12.
  // 12 PM is accounted for by the meridiem conversion
  if (timeSplit[0] !== 12) {
    seconds += timeSplit[0] * HOUR_IN_SECONDS;
  }

  if (!!timeSplit[1]) {
    seconds += timeSplit[1] * MINUTE_IN_SECONDS;
  }

  if (!!timeSplit[2]) {
    seconds += timeSplit[2];
  }

  // Offset by 12 hours if time is in PM
  if (meridiem === PM) {
    seconds += PM_OFFSET_SECONDS;
  }

  return seconds;
};
