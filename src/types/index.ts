export interface Stats {
  currentXP: number;
  nextLevelXP: number;
  currentLevel: number;
  todayXP: number;
  bestDayXP: number;
  todayMinutes: number;
  bestMinutes: number;
  todayPureMinutes: number;
  bestPureMinutes: number;
  streak: number;
}

export type TimeType = 'to-goal' | 'to-time';
export type TaskQuality = 'A' | 'B' | 'C' | 'D';
export type Area = 'Noesis' | 'Grace' | 'Rete' | 'Panoptic';
export type TimeQuality = 'pure' | 'not-pure';

export interface ColumnItem extends AddItemFormData {
  id: string;
  completed: boolean;
  columnOrigin: 'plan' | 'fact';
  xpValue: number;
  createdTime: Date;
  completedTime?: Date;
  actualDuration?: number;
  timeQuality?: 'pure' | 'not-pure';
}

export interface Column {
  title: string;
  items: ColumnItem[];
}

export interface AddItemFormData {
  description: string;
  timeType: TimeType;
  taskQuality: TaskQuality;
  estimatedMinutes: string | number;
  area: Area;
  priority: number;
} 