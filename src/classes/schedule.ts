import fs, { PathOrFileDescriptor } from 'fs';
import {
  convert12HourTimeToSeconds,
  days,
  DAY_IN_MINUTES,
  WEEK_IN_MINUTES,
} from '../utils/time';
import { z } from 'zod';

export type Interval = {
  start: number;
  end: number;
};

type RestaurantIntervals = {
  name: string;
  intervals: Interval[];
};

const restaurantsDataSchema = z.strictObject({
  restaurants: z.array(
    z.strictObject({
      name: z.string(),
      opening_hours: z.string(),
    }),
  ),
});

type RestaurantsDataSchema = z.infer<typeof restaurantsDataSchema>;

export class Schedule {
  private restaurantIntervals: RestaurantIntervals[];

  constructor(jsonFileName: PathOrFileDescriptor) {
    this.restaurantIntervals = this.getFormattedSchedule(
      restaurantsDataSchema.parse(
        JSON.parse(fs.readFileSync(jsonFileName).toString()),
      ),
    );
  }

  getRestaurantIntervals(): RestaurantIntervals[] {
    return this.restaurantIntervals;
  }

  private getFormattedSchedule(
    rawData: RestaurantsDataSchema,
  ): RestaurantIntervals[] {
    return rawData.restaurants.map((item) => {
      const { name, opening_hours: openingHours } = item;
      const intervals = this.getNormalisedIntervals(openingHours);

      return { name, intervals };
    });
  }

  private getNormalisedIntervals(rawOpeningHours: string): Interval[] {
    return rawOpeningHours.split('; ').reduce((accumulator, item) => {
      const daysRegEx = /(mon|tue|wed|thu|fri|sat|sun)/g;
      const openDays = item.toLowerCase().match(daysRegEx);

      // This regex matches times in the format: 'hh:ss aaa', 'h:ss aaa' and
      // 'h aaa'
      const timeRegEx = /\b((1[0-2]|0?[1-9])(?::[0-5][0-9])? ([ap][m]))/g;
      const times = item.match(timeRegEx);

      if (times === null || openDays === null) {
        throw Error('No matches found');
      }

      const timeInSeconds = times.map((time) =>
        convert12HourTimeToSeconds(time),
      );
      const startTime = timeInSeconds[0];
      const endTime = timeInSeconds[1];

      const startDay = openDays[0];
      const endDay = openDays[1] ?? openDays[0];

      // Get the 0-based index of the start and end day so we know which
      // additional intervals to generate between them.
      const startDayIndex = days.indexOf(startDay);
      const endDayIndex = days.indexOf(endDay);

      const intervals = this.createIntervals(
        startDayIndex,
        startTime,
        endDayIndex,
        endTime,
      );

      return accumulator.concat(intervals);
    }, [] as Interval[]);
  }

  private createIntervals(
    startDay: number,
    startTime: number,
    endDay: number,
    endTime: number,
  ): Interval[] {
    const intervals: Interval[] = [];
    let currentDay = startDay;

    while (true) {
      const dayOffset = currentDay * DAY_IN_MINUTES;

      const startInterval = startTime + dayOffset;
      let endInterval = endTime + dayOffset;

      if (endInterval < startInterval) {
        // If end time is before start time, this means that this interval
        // flows over past this day over to the next.
        endInterval += DAY_IN_MINUTES;
      }

      if (endInterval > WEEK_IN_MINUTES) {
        // If the interval has moved past one week, adjust it back by a week to
        // keep it within the one week window.
        intervals.push({
          start: startInterval - WEEK_IN_MINUTES,
          end: endInterval - WEEK_IN_MINUTES,
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
