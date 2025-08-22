// guard를 통해 valid한 값이라고 인정받은 값들을 담을 class
import { Guard } from './guard';

export class Money {
  private constructor(public readonly value: number) {}
  static of(v: unknown, name = 'money'): Money {
    return new Money(Guard.posInt(v, name));
  }
}
export class Percentage {
  private constructor(public readonly value: number) {}
  static of(v: unknown, name = 'percentage'): Percentage {
    return new Percentage(Guard.percentage(v, name));
  }
}

export class DateRange {
  private constructor(public readonly start: string, public readonly end: string) {}
  static ofYMD(start: unknown, end: unknown): DateRange {
    const s = Guard.dateYMD(start, 'start_date');
    const e = Guard.dateYMD(end, 'end_date');
    if (s > e) throw new Error('date range invalid (start_date > end_date)');
    return new DateRange(s, e);
  }
}
export class TimeRange {
  private constructor(public readonly start: string, public readonly end: string) {}
  static of(start: unknown, end: unknown): TimeRange {
    const s = Guard.timeHM(start, 'happy_hour_start_time');
    const e = Guard.timeHM(end, 'happy_hour_end_time');
    if (s >= e) throw new Error('time range invalid (start >= end)');
    return new TimeRange(s, e);
  }
}

export class WeekdaySet {
  private constructor(public readonly items: string[]) {}
  static of(arr: unknown): WeekdaySet {
    const a = Guard.stringArray(arr, 'weekdays');
    if (a.length === 0) throw new Error('weekdays must have at least 1 item');
    return new WeekdaySet(a);
  }
}