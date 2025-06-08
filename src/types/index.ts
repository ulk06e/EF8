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
  planAdherence: number;
}

export type TimeType = 'to-goal' | 'to-time';
export type TaskQuality = 'A' | 'B' | 'C' | 'D';
export type TimeQuality = 'pure' | 'not-pure';

export interface ColumnItem extends AddItemFormData {
  id: string;
  completed: boolean;
  columnOrigin: 'plan' | 'fact' | 'pre-plan';
  creationColumn: 'plan' | 'pre-plan';
  xpValue: number;
  createdTime: Date;
  completedTime?: Date;
  actualDuration?: number;
  timeQuality?: 'pure' | 'not-pure';
  wasPrePlanned?: boolean;
  plannedDate?: Date;
  date: Date;
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
  priority: number;
  date: Date;
}

export interface DayStats {
  totalMinutes: number;
  completedPrePlannedTasks: number;
  totalPrePlannedTasks: number;
}

export interface WeekDay {
  date: Date;
  totalMinutes: number;
  items: ColumnItem[];
}

export interface Project {
  id: string;
  name: string;
  currentXP: number;
  nextLevelXP: number;
  currentLevel: number;
  taskIds: string[];
}

export interface ProjectColumn {
  title: string;
  items: Project[];
} 