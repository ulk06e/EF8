import { TaskQuality, TimeQuality } from '../types';

const QUALITY_MULTIPLIER: Record<TaskQuality, number> = {
  'A': 4,
  'B': 3,
  'C': 2,
  'D': 1,
};

const TIME_QUALITY_MULTIPLIER = 1.5;

const PRIORITY_MULTIPLIER: Record<number, number> = {
  1: 1.5,
  2: 1.4,
  3: 1.3,
  4: 1,
  5: 1,
  6: 1,
  7: 1.5,
  8: 1.4,
  9: 1.3,
  10: 1.2,
};

const getAccuracyMultiplier = (actualDuration: number, estimatedMinutes: number): number => {
  if (actualDuration === 0 || estimatedMinutes === 0) return 1;
  
  const ratio = actualDuration / estimatedMinutes;
  if (ratio > 1.2 || ratio < 0.5) {
    return 0.7;
  }
  return 1;
};

export const calculateXP = (
  taskQuality: string,
  timeQuality: string,
  priority: number,
  columnOrigin: string,
  actualDuration: number,
  estimatedMinutes: number,
  hasReflection: boolean = false
): number => {
  let basePoints = 0;
  
  // Task quality points
  switch (taskQuality) {
    case 'A': basePoints = 8; break;
    case 'B': basePoints = 4; break;
    case 'C': basePoints = 2; break;
    case 'D': basePoints = 1; break;
  }

  // Pure time bonus
  if (timeQuality === 'pure') {
    basePoints += 3;
  }

  // Priority bonus
  if (priority <= 3) {
    basePoints += 3;
  } else if (priority <= 6) {
    basePoints += 1;
  }

  // Plan bonus
  if (columnOrigin === 'plan') {
    basePoints += 2;
  }

  // Time multiplier
  const timeMultiplier = Math.floor(1 + actualDuration / 60);
  
  return basePoints * timeMultiplier;
};

export const calculateNextLevelXP = (level: number): number => {
  if (level <= 5) {
    return level * 100;
  }
  return 500 + (level - 5) * 10;
}; 