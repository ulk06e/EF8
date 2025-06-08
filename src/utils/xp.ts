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
  7: 1,
  8: 1,
  9: 1,
  10: 1,
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
  taskQuality: TaskQuality,
  timeQuality: TimeQuality,
  priority: number,
  columnOrigin: string,
  actualDuration: number,
  estimatedDuration: number,
  wasPrePlanned: boolean
): number => {
  // Base XP: 1 point per 20 minutes
  let xp = Math.floor(actualDuration / 20);

  // Quality multiplier
  const qualityMultiplier = QUALITY_MULTIPLIER[taskQuality];
  xp *= qualityMultiplier;

  // Time quality multiplier
  if (timeQuality === 'pure') {
    xp *= TIME_QUALITY_MULTIPLIER;
  }

  // Priority multiplier
  const priorityMultiplier = PRIORITY_MULTIPLIER[priority] || 1;
  xp *= priorityMultiplier;

  // Accuracy penalty
  const durationRatio = actualDuration / estimatedDuration;
  if (durationRatio > 1.2 || durationRatio < 0.5) {
    xp *= getAccuracyMultiplier(actualDuration, estimatedDuration);
  }

  return Math.floor(xp) +5;
}; 


export const calculateNextLevelXP = (level: number): number => {
  if (level <= 5) {
    return level * 100;
  }
  return 500 + (level - 5) * 10;
}; 