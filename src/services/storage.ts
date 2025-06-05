import { StorageData, DayData, Records } from '../types/storage';
import { ColumnItem } from '../types';

const STORAGE_KEY = 'plan_tracker_data';
const DAY_START_HOUR = 4;

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
    stats: {
      dayXP: 0,
      dayMinutes: 0,
      dayPureMinutes: 0,
    },
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
    data.currentDay = this.ensureCurrentDay(data.currentDay);
    return data;
  }

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

  public transitionToNewDay(isAutomatic: boolean = false): void {
    // Save current day to history
    const currentDay = this.data.currentDay;
    this.data.days.push(currentDay);

    // Update records
    this.updateRecords(currentDay);

    // Update streak only on automatic transition at 4 AM
    if (isAutomatic && currentDay.stats.dayXP > 0) {
      this.data.streak++;
    }

    // Subtract XP from total when manually transitioning
    if (!isAutomatic) {
      this.data.totalXP -= currentDay.stats.dayXP;
      // Adjust level if needed
      while (this.data.totalXP < calculatePreviousLevelXP(this.data.currentLevel)) {
        this.data.currentLevel--;
        this.data.nextLevelXP = calculateNextLevelXP(this.data.currentLevel);
      }
    }

    // Create new day
    const newDay = createNewDay();
    this.data.currentDay = newDay;
    this.saveData();
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

  public addPlanItem(item: ColumnItem): void {
    // Ensure estimatedMinutes is a number when storing
    const processedItem = {
      ...item,
      estimatedMinutes: typeof item.estimatedMinutes === 'string'
        ? parseInt(item.estimatedMinutes)
        : item.estimatedMinutes
    };
    
    this.data.currentDay.planItems.push(processedItem);
    this.saveData();
  }

  public removePlanItem(itemId: string): void {
    this.data.currentDay.planItems = this.data.currentDay.planItems.filter(
      item => item.id !== itemId
    );
    this.saveData();
  }

  public addFactItem(item: ColumnItem): void {
    this.data.currentDay.factItems.unshift(item); // Add to top
    this.data.records.highestTaskXP = Math.max(
      this.data.records.highestTaskXP,
      item.xpValue
    );
    this.saveData();
  }

  public updateStats(minutes: number, pureDuration: number): void {
    const stats = this.data.currentDay.stats;
    stats.dayMinutes += minutes;
    stats.dayPureMinutes += pureDuration;
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
}

const storage = new StorageService();
export default storage; 