import { PathOrFileDescriptor } from 'fs';
import { DateTime } from 'luxon';
import { DAY_IN_MINUTES, HOUR_IN_MINUTES } from '../utils/time';
import { Schedule } from './schedule';

export class Restaurants {
  private schedule: Schedule;

  constructor(jsonFilename: PathOrFileDescriptor) {
    this.schedule = new Schedule(jsonFilename);
  }

  getRestaurantsOpenAt(input: DateTime): string[] {
    const seconds = this.getInputAsMinutes(input);

    return this.getIntersections(seconds);
  }

  private getInputAsMinutes(input: DateTime): number {
    const { weekday, hour, minute } = input;

    return (weekday - 1) * DAY_IN_MINUTES + hour * HOUR_IN_MINUTES + minute;
  }

  private getIntersections(input: number): string[] {
    return this.schedule
      .getRestaurantIntervals()
      .reduce((accumulator, item) => {
        return item.intervals.some((interval) => {
          return input >= interval.start && input < interval.end;
        })
          ? accumulator.concat(item.name)
          : accumulator;
      }, [] as string[]);
  }
}
