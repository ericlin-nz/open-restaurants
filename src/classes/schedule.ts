import fs, { PathOrFileDescriptor } from 'fs';
import { convert12HourTimeToSeconds } from '../utils/time';

import {
  DAY_MAP,
  DAY_IN_SECONDS,
  MINUTE_IN_SECONDS,
  WEEK_IN_SECONDS,
} from '../constants/datetime';

export type Interval = {
  start: number;
  end: number;
};

type RestaurantIntervals = {
  name: string;
  intervals: Interval[];
};

type RestaurantScheduleEntry = {
  name: string;
  openingHours: string;
};

// Raw JSON format for the restaurant data
type RestaurantScheduleData = {
  restaurants: RestaurantScheduleEntry[];
};

export class Schedule {
  private restaurantIntervals: RestaurantIntervals[];

  public constructor(jsonFileName: PathOrFileDescriptor) {
    this.restaurantIntervals = this.getFormattedSchedule(
      JSON.parse(fs.readFileSync(jsonFileName).toString()),
    );
  }

  public getRestaurantIntervals() {
    return this.restaurantIntervals;
  }

  protected getFormattedSchedule(
    rawData: RestaurantScheduleData,
  ): RestaurantIntervals[] {
    return rawData.restaurants.map((item) => {
      const { name, openingHours: opening_hours } = item;
      const intervals = this.getNormalisedIntervals(opening_hours);

      return {
        name,
        intervals,
      };
    });
  }

  protected getNormalisedIntervals(rawOpeningHours: string): Interval[] {
    return rawOpeningHours.split('; ').reduce((accumulator, item) => {
      const daysRegEx = /(mon|tue|wed|thu|fri|sat|sun)/g;
      const days = item.toLowerCase().match(daysRegEx);

      // This regex matches times in the format: 'hh:ss aaa', 'h:ss aaa' and
      // 'h aaa'
      const timeRegEx = /\b((1[0-2]|0?[1-9])(?::[0-5][0-9])? ([ap][m]))/g;
      const times = item.match(timeRegEx);

      const timeInSeconds = times.map((time) => {
        return convert12HourTimeToSeconds(time);
      });
      const startTime = timeInSeconds[0];
      const endTime = timeInSeconds[1];

      const startDay = days[0];
      const endDay = days[1] ?? days[0];

      // Get the 0-based index of the start and end day so we know which
      // additional intervals to generate between them.
      const startDayIndex = DAY_MAP[startDay];
      const endDayIndex = DAY_MAP[endDay];

      const intervals = this.createIntervals(
        startDayIndex,
        endDayIndex,
        startTime,
        endTime,
      );

      return accumulator.concat(intervals);
    }, []);
  }

  protected createIntervals(
    startDay: number,
    endDay: number,
    startTime: number,
    endTime: number,
  ): Interval[] {
    const intervals = [];
    let currentDay = startDay;

    while (true) {
      const dayOffset = currentDay * DAY_IN_SECONDS;

      const startInterval = startTime + dayOffset;
      let endInterval = endTime + dayOffset;

      if (endInterval - MINUTE_IN_SECONDS < startInterval) {
        // If end time is before start time, this means that this interval
        // flows over past this day over to the next.
        endInterval += DAY_IN_SECONDS;
      }

      if (endInterval > WEEK_IN_SECONDS) {
        // If the interval has moved past one week, adjust it back by a week to
        // keep it within the one week window.
        intervals.push({
          start: startInterval - WEEK_IN_SECONDS,
          end: endInterval - WEEK_IN_SECONDS,
        });
      } else {
        // Interval is within a one week period
        intervals.push({
          start: startInterval,
          end: endInterval,
        });
      }

      if (currentDay === endDay) {
        // All intervals accounted for!
        break;
      }

      // Move the pointed day back to Monday if it's currently Sunday.
      currentDay = (currentDay + 1) % 7;
    }

    return intervals;
  }
}
