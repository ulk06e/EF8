import { TaskQuality } from '../types';

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
  timeQuality: 'pure' | 'not-pure',
  priority: number,
  columnOrigin: 'plan' | 'fact',
  actualDuration: number,
  estimatedMinutes: number,
  hasReflection: boolean
): number => {
  // Base XP: 1 point per 30 minutes
  const baseXP = Math.floor(actualDuration / 20);
  
  // Apply multipliers
  const qualityMultiplier = QUALITY_MULTIPLIER[taskQuality];
  const timeQualityMultiplier = timeQuality === 'pure' ? TIME_QUALITY_MULTIPLIER : 1;
  const priorityMultiplier = PRIORITY_MULTIPLIER[priority] || 1;
  const accuracyMultiplier = getAccuracyMultiplier(actualDuration, estimatedMinutes);

  // Calculate final XP
  const finalXP = Math.round(
    baseXP * 
    qualityMultiplier * 
    timeQualityMultiplier * 
    priorityMultiplier * 
    accuracyMultiplier
  );

  return Math.max(0, finalXP);
}; 