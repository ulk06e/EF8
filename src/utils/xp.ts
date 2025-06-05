import { TaskQuality } from '../types';

const QUALITY_XP: Record<TaskQuality, number> = {
  'A': 8,
  'B': 4,
  'C': 2,
  'D': 1,
};

const FOCUS_BONUS: Record<'pure' | 'not-pure', number> = {
  'pure': 3,
  'not-pure': 0,
};

const PRIORITY_BONUS: Record<number, number> = {
  1: 3,
  2: 1,
  3: 0,
  4: 0,
  5: 0,
  6: 0,
  7: 0,
  8: 0,
  9: 0,
  10: 0,
};

const PLAN_BONUS = 2;

const getTimeXP = (quality: TaskQuality, actualDuration: number, estimatedMinutes: number): number => {
  // For high quality tasks (A or B), earn XP for time spent
  if (quality === 'A' || quality === 'B') {
    return Math.floor(actualDuration / 10); // 1 XP per 10 minutes
  }

  // For low quality tasks (C or D), lose XP if over estimated time
  if (actualDuration > estimatedMinutes) {
    return -Math.floor((actualDuration - estimatedMinutes) / 10); // -1 XP per 10 minutes over
  }

  return 0;
};

const getEfficiencyBonus = (quality: TaskQuality, actualDuration: number, estimatedMinutes: number): number => {
  // Only give efficiency bonus for A and B tasks
  if (quality !== 'A' && quality !== 'B') return 0;

  // If completed faster than estimated
  if (actualDuration < estimatedMinutes) {
    const savedMinutes = estimatedMinutes - actualDuration;
    return Math.floor(savedMinutes / 15); // 1 XP per 15 minutes saved
  }

  return 0;
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
  const base = QUALITY_XP[taskQuality] || 0;
  const focus = FOCUS_BONUS[timeQuality] || 0;
  const priorityBonus = PRIORITY_BONUS[priority] || 0;
  const plan = columnOrigin === 'plan' ? PLAN_BONUS : 0;
  const time = getTimeXP(taskQuality, actualDuration, estimatedMinutes);
  const efficiency = getEfficiencyBonus(taskQuality, actualDuration, estimatedMinutes);
  const reflection = hasReflection ? 2 : 0;

  return base + focus + priorityBonus + plan + time + efficiency + reflection;
}; 