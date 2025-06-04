import { ColumnItem } from './index';

export interface DayData {
  id: string;
  date: string;
  planItems: ColumnItem[];
  factItems: ColumnItem[];
  stats: {
    dayXP: number;
    dayMinutes: number;
    dayPureMinutes: number;
  };
}

export interface Records {
  highestTaskXP: number;
  longestPureStreak: number;
  mostPureTimeInDay: number;
  mostWorkTimeInDay: number;
  highestDayXP: number;
}

export interface StorageData {
  totalXP: number;
  currentLevel: number;
  nextLevelXP: number;
  streak: number;
  records: Records;
  days: DayData[];
  currentDay: DayData;
} 