import { StorageData, DayData, Records } from '../types/storage';
import { ColumnItem, Stats, AddItemFormData, Project } from '../types/index';

const STORAGE_KEY = 'plan_tracker_data';
const DAY_START_HOUR = 4;

const isSameDay = (date1: Date, date2: Date): boolean => {
  return date1.toDateString() === date2.toDateString();
};

const calculateNextLevelXP = (level: number): number => {
  if (level <= 5) {
    return level * 100;
  }
  return 500 + (level - 5) * 10;
};

const calculatePreviousLevelXP = (level: number): number => {
  if (level <= 1) return 0;
  if (level <= 6) return (level - 1) * 100;
  return 500 + ((level - 1) - 5) * 10;
};

const createNewDay = (): DayData => {
  const now = new Date();
  // If current hour is before DAY_START_HOUR, use previous day's date
  if (now.getHours() < DAY_START_HOUR) {
    now.setDate(now.getDate() - 1);
  }
  
  return {
    id: now.toISOString().split('T')[0],
    date: now.toISOString(),
    planItems: [],
    factItems: [],
    prePlanItems: [],
    stats: {
      dayXP: 0,
      dayMinutes: 0,
      dayPureMinutes: 0,
      planAdherence: 0,
    },
    reflection: undefined,
  };
};

class StorageService {
  private data: StorageData;
  private listeners: Set<() => void>;
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.listeners = new Set();
    this.data = this.loadData();
    this.startAutoSave();
    this.checkDayTransition();
  }

  private loadData(): StorageData {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (!savedData) {
      return {
        totalXP: 0,
        currentLevel: 1,
        nextLevelXP: 100,
        streak: 0,
        currentDay: createNewDay(),
        days: [],
        records: {
          highestDayXP: 0,
          mostWorkTimeInDay: 0,
          mostPureTimeInDay: 0,
          highestTaskXP: 0,
        },
      };
    }

    const data = JSON.parse(savedData);
    
    // Ensure currentDay exists and has all required fields
    data.currentDay = this.ensureCurrentDay(data.currentDay);
    
    // Convert dates in current day items
    if (data.currentDay.planItems) {
      data.currentDay.planItems = data.currentDay.planItems.map(this.convertDatesInItem);
    }
    if (data.currentDay.factItems) {
      data.currentDay.factItems = data.currentDay.factItems.map(this.convertDatesInItem);
    }
    if (data.currentDay.prePlanItems) {
      data.currentDay.prePlanItems = data.currentDay.prePlanItems.map(this.convertDatesInItem);
    }
    
    // Ensure days array exists and all days have required fields
    if (!data.days) data.days = [];
    data.days = data.days.map((day: DayData) => {
      if (!day.prePlanItems) day.prePlanItems = [];
      if (!day.planItems) day.planItems = [];
      if (!day.factItems) day.factItems = [];
      
      // Convert dates in historical items
      day.planItems = day.planItems.map(this.convertDatesInItem);
      day.factItems = day.factItems.map(this.convertDatesInItem);
      day.prePlanItems = day.prePlanItems.map(this.convertDatesInItem);
      
      if (!day.stats) {
        day.stats = {
          dayXP: 0,
          dayMinutes: 0,
          dayPureMinutes: 0,
          planAdherence: 0,
        };
      }
      if (!day.stats.planAdherence) day.stats.planAdherence = 0;
      return day;
    });

    return data;
  }

  private convertDatesInItem = (item: ColumnItem): ColumnItem => {
    return {
      ...item,
      createdTime: new Date(item.createdTime),
      completedTime: item.completedTime ? new Date(item.completedTime) : undefined,
      date: new Date(item.date)
    };
  };

  private ensureCurrentDay(currentDay: DayData | null): DayData {
    if (!currentDay) return createNewDay();

    const now = new Date();
    const currentDayDate = new Date(currentDay.date);
    
    // Adjust for day start hour
    const currentDayStart = new Date(currentDayDate);
    currentDayStart.setHours(DAY_START_HOUR, 0, 0, 0);
    
    const nextDayStart = new Date(currentDayStart);
    nextDayStart.setDate(nextDayStart.getDate() + 1);

    if (now >= nextDayStart || now < currentDayStart) {
      return createNewDay();
    }

    return currentDay;
  }

  private saveData(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      this.notifyListeners();
      this.saveTimeout = null;
    }, 100);
  }

  private startAutoSave(): void {
    setInterval(() => this.saveData(), 5000); // Auto-save every 5 seconds
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  private checkDayTransition(): void {
    const checkTransition = () => {
      const now = new Date();
      if (now.getHours() === DAY_START_HOUR && now.getMinutes() === 0) {
        this.transitionToNewDay(true);
      }
    };

    // Check every minute
    setInterval(checkTransition, 60000);
    
    // Also check on startup
    const now = new Date();
    const currentDayDate = new Date(this.data.currentDay.date);
    const currentDayStart = new Date(currentDayDate);
    currentDayStart.setHours(DAY_START_HOUR, 0, 0, 0);
    const nextDayStart = new Date(currentDayStart);
    nextDayStart.setDate(nextDayStart.getDate() + 1);

    if (now >= nextDayStart || now < currentDayStart) {
      this.transitionToNewDay(true);
    }
  }

  public transitionToNewDay(shouldSubtractXP: boolean = true): void {
    const currentDay = this.data.currentDay;
    
    // Create new day data
    const newDay = createNewDay();
    
    // Move current day to history
    this.data.days.unshift(currentDay);
    
    // Reset current day
    this.data.currentDay = newDay;
    
    // Move any planned items to the new day
    const today = new Date();
    this.data.currentDay.planItems = currentDay.planItems
      .filter(item => !item.completed)
      .map(item => ({
        ...item,
        date: today
      }));
    
    // Subtract today's XP if requested
    if (shouldSubtractXP) {
      this.data.totalXP = Math.max(0, this.data.totalXP - currentDay.stats.dayXP);
    }
    
    this.saveData();
    this.notifyListeners();
  }

  private updateRecords(day: DayData): void {
    const records = this.data.records;
    records.mostWorkTimeInDay = Math.max(records.mostWorkTimeInDay, day.stats.dayMinutes);
    records.mostPureTimeInDay = Math.max(records.mostPureTimeInDay, day.stats.dayPureMinutes);
    records.highestDayXP = Math.max(records.highestDayXP, day.stats.dayXP);
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public getData(): StorageData {
    return this.data;
  }

  public clearAllData(): void {
    this.data = {
      totalXP: 0,
      currentLevel: 1,
      nextLevelXP: 100,
      streak: 0,
      currentDay: createNewDay(),
      days: [],
      records: {
        highestDayXP: 0,
        mostWorkTimeInDay: 0,
        mostPureTimeInDay: 0,
        highestTaskXP: 0,
      },
    };
    this.saveData();
  }

  public addPlanItem(item: AddItemFormData) {
    const processedItem: ColumnItem = {
      ...item,
      id: crypto.randomUUID(),
      completed: false,
      columnOrigin: 'plan',
      creationColumn: 'plan',
      xpValue: 0,
      createdTime: new Date(),
      date: new Date(item.date),
      timeType: item.timeType,
      projectId: item.projectId || 'all-projects',
      estimatedMinutes: typeof item.estimatedMinutes === 'string' 
        ? parseInt(item.estimatedMinutes) 
        : item.estimatedMinutes
    };
    
    this.data.currentDay.planItems.push(processedItem);
    this.saveData();
    this.notifyListeners();
  }

  public removePlanItem(itemId: string): void {
    this.data.currentDay.planItems = this.data.currentDay.planItems.filter(
      item => item.id !== itemId
    );
    this.saveData();
  }

  public addFactItem(item: ColumnItem, actualDuration: number) {
    const processedItem: ColumnItem = {
      ...item,
      id: crypto.randomUUID(),
      completed: true,
      columnOrigin: item.columnOrigin,
      creationColumn: item.creationColumn,
      actualDuration,
      completedTime: new Date(),
      createdTime: new Date(),
      date: item.date,
      timeType: item.timeType,
      projectId: item.projectId || 'all-projects',
      xpValue: this.calculateXP(
        item.taskQuality,
        item.timeQuality || 'not-pure',
        item.priority,
        item.columnOrigin,
        actualDuration,
        Number(item.estimatedMinutes)
      )
    };
    
    this.data.currentDay.factItems.push(processedItem);
    this.saveData();
    this.notifyListeners();
  }

  private calculatePlanAdherence(): number {
    const now = new Date();
    const today = new Date();
    
    // If it's before 4 AM, consider it as the previous day
    if (now.getHours() < 4) {
      today.setDate(today.getDate() - 1);
    }

    const completedPrePlanned = this.data.currentDay.factItems.filter(item => item.wasPrePlanned).length;
    const totalPrePlanned = this.data.currentDay.prePlanItems.filter(item => 
      item.plannedDate && isSameDay(new Date(item.plannedDate), today)
    ).length;
    
    if (totalPrePlanned === 0) return 0;
    return Math.round((completedPrePlanned / totalPrePlanned) * 100);
  }

  public updateStats(minutes: number, pureDuration: number): void {
    const stats = this.data.currentDay.stats;
    stats.dayMinutes += minutes;
    stats.dayPureMinutes += pureDuration;
    stats.planAdherence = this.calculatePlanAdherence();
    this.saveData();
  }

  public addXP(xp: number): void {
    this.data.totalXP += xp;
    this.data.currentDay.stats.dayXP += xp;

    // Level up check
    while (this.data.totalXP >= this.data.nextLevelXP) {
      this.data.currentLevel++;
      this.data.nextLevelXP = calculateNextLevelXP(this.data.currentLevel);
    }

    this.saveData();
  }

  public shouldShowReflection(): boolean {
    const now = new Date();
    const lastPrompt = this.data.lastReflectionPrompt ? new Date(this.data.lastReflectionPrompt) : null;
    
    // If we've never shown a prompt, or if it's a different day
    if (!lastPrompt || lastPrompt.toDateString() !== now.toDateString()) {
      // Only show if it's after 4 AM
      if (now.getHours() >= DAY_START_HOUR) {
        return true;
      }
    }
    
    return false;
  }

  public addReflection(reflection: string): void {
    this.data.currentDay.reflection = reflection;
    this.data.lastReflectionPrompt = new Date().toISOString();
    this.addXP(2); // Add 2 XP for reflection
    this.saveData();
  }

  public updateFactItem(updatedItem: ColumnItem): void {
    const factItems = this.data.currentDay.factItems;
    const index = factItems.findIndex(item => item.id === updatedItem.id);
    
    if (index !== -1) {
      factItems[index] = updatedItem;
      this.saveData();
      this.notifyListeners();
    }
  }

  public updatePlanItem(updatedItem: ColumnItem): void {
    const planItems = this.data.currentDay.planItems;
    const index = planItems.findIndex(item => item.id === updatedItem.id);
    
    if (index !== -1) {
      planItems[index] = updatedItem;
      this.saveData();
      this.notifyListeners();
    }
  }

  // New methods for pre-planned items
  getPrePlannedItems(date: Date): ColumnItem[] {
    const now = new Date();
    const today = new Date();
    
    // If it's before 4 AM, consider it as the previous day
    if (now.getHours() < 4) {
      today.setDate(today.getDate() - 1);
    }

    // Ensure prePlanItems exists in currentDay
    if (!this.data.currentDay.prePlanItems) {
      this.data.currentDay.prePlanItems = [];
    }

    // If the date is today, merge pre-planned items with plan items
    if (isSameDay(date, today)) {
      const items = [
        ...this.data.currentDay.prePlanItems,
        ...this.data.currentDay.planItems,
      ];
      // Remove duplicates based on id
      return Array.from(new Map(items.map(item => [item.id, item])).values());
    }

    // For past days, get from history
    const pastDay = this.data.days.find(day => {
      const dayDate = new Date(day.date);
      return isSameDay(dayDate, date);
    });
    
    if (pastDay) {
      // Ensure prePlanItems exists in pastDay
      if (!pastDay.prePlanItems) {
        pastDay.prePlanItems = [];
      }
      const items = [...pastDay.prePlanItems, ...pastDay.planItems];
      // Remove duplicates based on id
      return Array.from(new Map(items.map(item => [item.id, item])).values());
    }

    // For future days, get only pre-planned items
    return this.data.currentDay.prePlanItems.filter(item => {
      if (!item.plannedDate) return false;
      const itemDate = new Date(item.plannedDate);
      return isSameDay(itemDate, date);
    });
  }

  public addPrePlannedItem(item: ColumnItem) {
    const now = new Date();
    const today = new Date();
    // If it's before 4 AM, consider it as the previous day
    if (now.getHours() < 4) {
      today.setDate(today.getDate() - 1);
    }

    const itemDate = item.plannedDate ? new Date(item.plannedDate) : undefined;
    const processedItem = {
      ...item,
      estimatedMinutes: typeof item.estimatedMinutes === 'string'
        ? parseInt(item.estimatedMinutes)
        : item.estimatedMinutes,
      wasPrePlanned: true,
      plannedDate: itemDate,
      createdTime: new Date(item.createdTime),
      columnOrigin: 'pre-plan' as const,
      creationColumn: 'pre-plan' as const
    };

    // Add to pre-planned items if it doesn't already exist
    if (!this.data.currentDay.prePlanItems.some(i => i.id === processedItem.id)) {
      this.data.currentDay.prePlanItems.push(processedItem);
    }

    // If the task is for today, also add it to plan items if it's not already there
    if (itemDate && isSameDay(itemDate, today)) {
      if (!this.data.currentDay.planItems.some(i => i.id === processedItem.id)) {
        const planItem = {
          ...processedItem,
          columnOrigin: 'plan' as const
        };
        this.data.currentDay.planItems.push(planItem);
      }
    }
    
    this.saveData();
  }

  removePrePlannedItem(itemId: string) {
    this.data.currentDay.prePlanItems = this.data.currentDay.prePlanItems.filter(
      item => item.id !== itemId
    );
    this.saveData();
  }

  updatePrePlannedItem(updatedItem: ColumnItem) {
    const processedItem = {
      ...updatedItem,
      plannedDate: updatedItem.plannedDate ? new Date(updatedItem.plannedDate) : undefined,
      createdTime: new Date(updatedItem.createdTime),
      completedTime: updatedItem.completedTime ? new Date(updatedItem.completedTime) : undefined
    };
    
    this.data.currentDay.prePlanItems = this.data.currentDay.prePlanItems.map(item =>
      item.id === processedItem.id ? processedItem : item
    );
    this.saveData();
  }

  private calculateXP(
    taskQuality: string,
    timeQuality: string,
    priority: number,
    columnOrigin: string,
    actualDuration: number,
    estimatedMinutes: number
  ): number {
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
  }

  public getProjects(): Project[] {
    const projectsJson = localStorage.getItem('projects');
    const defaultProjects = [
      {
        id: 'all-projects',
        name: 'All Projects',
        currentXP: 0,
        nextLevelXP: 100,
        currentLevel: 1,
        taskIds: []
      },
      {
        id: 'other-projects',
        name: 'Other Projects',
        currentXP: 0,
        nextLevelXP: 100,
        currentLevel: 1,
        taskIds: []
      }
    ];

    if (!projectsJson) {
      return defaultProjects;
    }

    const savedProjects = JSON.parse(projectsJson);
    const hasAllProjects = savedProjects.some((p: Project) => p.id === 'all-projects');
    const hasOtherProjects = savedProjects.some((p: Project) => p.id === 'other-projects');

    if (!hasAllProjects || !hasOtherProjects) {
      const updatedProjects = [...savedProjects];
      
      if (!hasAllProjects) {
        updatedProjects.unshift(defaultProjects[0]);
      }
      
      if (!hasOtherProjects) {
        updatedProjects.push(defaultProjects[1]);
      }
      
      this.saveProjects(updatedProjects);
      return updatedProjects;
    }

    return savedProjects;
  }

  public saveProjects(projects: Project[]): void {
    // Ensure default projects cannot be removed
    const hasAllProjects = projects.some(p => p.id === 'all-projects');
    const hasOtherProjects = projects.some(p => p.id === 'other-projects');
    
    let updatedProjects = [...projects];
    
    if (!hasAllProjects) {
      updatedProjects.unshift({
        id: 'all-projects',
        name: 'All Projects',
        currentXP: 0,
        nextLevelXP: 100,
        currentLevel: 1,
        taskIds: []
      });
    }
    
    if (!hasOtherProjects) {
      updatedProjects.push({
        id: 'other-projects',
        name: 'Other Projects',
        currentXP: 0,
        nextLevelXP: 100,
        currentLevel: 1,
        taskIds: []
      });
    }
    
    localStorage.setItem('projects', JSON.stringify(updatedProjects));
  }
}

const storage = new StorageService();
export default storage; 