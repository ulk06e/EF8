import { ColumnItem } from './index';

export interface DayStats {
  dayXP: number;
  dayMinutes: number;
  dayPureMinutes: number;
  planAdherence: number;
}

export interface DayData {
  id: string;
  date: string;
  planItems: ColumnItem[];
  factItems: ColumnItem[];
  prePlanItems: ColumnItem[];
  stats: DayStats;
  reflection?: string;
}

export interface Records {
  highestDayXP: number;
  mostWorkTimeInDay: number;
  mostPureTimeInDay: number;
  highestTaskXP: number;
}

export interface StorageData {
  totalXP: number;
  currentLevel: number;
  nextLevelXP: number;
  streak: number;
  currentDay: DayData;
  days: DayData[];
  records: Records;
  lastReflectionPrompt?: string; // Date string when the last reflection was prompted
} 