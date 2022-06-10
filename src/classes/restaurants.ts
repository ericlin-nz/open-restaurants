import { PathOrFileDescriptor } from 'fs';
import { DateTime } from 'luxon';
import {
  DAY_IN_SECONDS,
  HOUR_IN_SECONDS,
  MINUTE_IN_SECONDS,
} from '../constants/datetime';
import { Schedule } from './schedule';

export class Restaurants {
  private schedule: Schedule;

  public constructor(jsonFilename: PathOrFileDescriptor) {
    this.schedule = new Schedule(jsonFilename);
  }

  public getRestaurantsOpenAt(input: DateTime) {
    const seconds = this.getInputAsSeconds(input);

    return this.getIntersections(seconds);
  }

  protected getInputAsSeconds(input: DateTime) {
    const { weekday, hour, minute } = input;

    return (
      (weekday - 1) * DAY_IN_SECONDS +
      hour * HOUR_IN_SECONDS +
      minute * MINUTE_IN_SECONDS
    );
  }

  protected getIntersections(input: number) {
    return this.schedule.getRestaurantIntervals().reduce((accumulator, item) => {
      return item.intervals.some((interval) => {
        return input >= interval.start && input < interval.end;
      })
        ? accumulator.concat(item.name)
        : accumulator;
    }, []);
  }
}
