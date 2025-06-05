import React from 'react';
import { StorageData, DayData } from '../types/storage';
import '../styles/notion.css';

interface StatisticsProps {
  data: StorageData;
  onClose: () => void;
}

const Statistics: React.FC<StatisticsProps> = ({ data, onClose }) => {
  const calculateWeekXP = (days: DayData[], weeksAgo: number = 0): number => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() - (weeksAgo * 7));
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    return days
      .filter(day => {
        const date = new Date(day.date);
        return date >= startOfWeek && date < endOfWeek;
      })
      .reduce((sum, day) => sum + day.stats.dayXP, 0);
  };

  const calculateXPBreakdown = (days: DayData[]) => {
    const thisWeekDays = days.filter(day => {
      const date = new Date(day.date);
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      return date >= startOfWeek;
    });

    const breakdown = {
      taskQuality: { A: 0, B: 0, C: 0, D: 0 },
      focusBonus: 0,
      planBonus: 0,
      efficiencyBonus: 0,
      reflectionBonus: 0,
      timeBonus: 0
    };

    thisWeekDays.forEach(day => {
      day.factItems.forEach(item => {
        // Task quality
        const qualityMap = { A: 8, B: 4, C: 2, D: 1 };
        breakdown.taskQuality[item.taskQuality as keyof typeof qualityMap] += qualityMap[item.taskQuality as keyof typeof qualityMap];

        // Focus bonus
        if (item.timeQuality === 'pure') {
          breakdown.focusBonus += 3;
        }

        // Plan bonus
        if (item.columnOrigin === 'plan') {
          breakdown.planBonus += 2;
        }

        // Time and efficiency bonuses are approximated
        const actualDuration = item.actualDuration || 0;
        const estimatedMinutes = typeof item.estimatedMinutes === 'string' 
          ? parseInt(item.estimatedMinutes) 
          : item.estimatedMinutes;

        if (item.taskQuality === 'A' || item.taskQuality === 'B') {
          breakdown.timeBonus += Math.floor(actualDuration / 10);
          if (actualDuration < estimatedMinutes) {
            breakdown.efficiencyBonus += Math.floor((estimatedMinutes - actualDuration) / 15);
          }
        } else if (actualDuration > estimatedMinutes) {
          breakdown.timeBonus -= Math.floor((actualDuration - estimatedMinutes) / 10);
        }
      });

      // Reflection bonus
      if (day.reflection) {
        breakdown.reflectionBonus += 2;
      }
    });

    return breakdown;
  };

  const thisWeekXP = calculateWeekXP(data.days);
  const lastWeekXP = calculateWeekXP(data.days, 1);
  const xpChange = lastWeekXP ? ((thisWeekXP - lastWeekXP) / lastWeekXP) * 100 : 0;
  const xpBreakdown = calculateXPBreakdown(data.days);

  const firstTaskDate = data.days.length > 0 
    ? new Date(data.days[data.days.length - 1].date) 
    : new Date();
  
  const daysSinceFirst = Math.floor(
    (new Date().getTime() - firstTaskDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const activeDays = data.days.filter(day => day.stats.dayXP > 0).length;

  return (
    <div className="statistics-page">
      <div className="stats-section summary">
        <div className="stat-item">
          <span>Total XP</span>
          <span>{data.totalXP}</span>
        </div>
        <div className="stat-item">
          <span>Days Since First Task</span>
          <span>{daysSinceFirst}</span>
        </div>
        <div className="stat-item">
          <span>Active Days</span>
          <span>{activeDays}</span>
        </div>
        <div className="stat-item">
          <span>Current Streak</span>
          <span>{data.streak}</span>
        </div>
        <div className="stat-item">
          <span>Best Streak</span>
          <span>{data.records.highestDayXP}</span>
        </div>
      </div>

      <div className="stats-section weekly">
        <h3>Weekly XP Comparison</h3>
        <div className="weekly-comparison">
          <div className="stat-item">
            <span>This Week</span>
            <span>{thisWeekXP} XP</span>
          </div>
          <div className="stat-item">
            <span>Last Week</span>
            <span>{lastWeekXP} XP</span>
          </div>
          <div className="stat-item">
            <span>Change</span>
            <span className={xpChange >= 0 ? 'positive' : 'negative'}>
              {xpChange >= 0 ? '+' : ''}{xpChange.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      <div className="stats-section breakdown">
        <h3>XP Source Breakdown (This Week)</h3>
        <div className="xp-breakdown-chart">
          {/* Placeholder for chart - you'll need to add a charting library */}
          <div className="breakdown-item">
            <span>Task Quality A</span>
            <span>{xpBreakdown.taskQuality.A} XP</span>
          </div>
          <div className="breakdown-item">
            <span>Task Quality B</span>
            <span>{xpBreakdown.taskQuality.B} XP</span>
          </div>
          <div className="breakdown-item">
            <span>Task Quality C</span>
            <span>{xpBreakdown.taskQuality.C} XP</span>
          </div>
          <div className="breakdown-item">
            <span>Task Quality D</span>
            <span>{xpBreakdown.taskQuality.D} XP</span>
          </div>
          <div className="breakdown-item">
            <span>Focus Bonus</span>
            <span>{xpBreakdown.focusBonus} XP</span>
          </div>
          <div className="breakdown-item">
            <span>Plan Bonus</span>
            <span>{xpBreakdown.planBonus} XP</span>
          </div>
          <div className="breakdown-item">
            <span>Efficiency Bonus</span>
            <span>{xpBreakdown.efficiencyBonus} XP</span>
          </div>
          <div className="breakdown-item">
            <span>Time Bonus/Penalty</span>
            <span>{xpBreakdown.timeBonus} XP</span>
          </div>
          <div className="breakdown-item">
            <span>Reflection Bonus</span>
            <span>{xpBreakdown.reflectionBonus} XP</span>
          </div>
        </div>
      </div>

      <div className="stats-section daily">
        <h3>Daily Activity</h3>
        <div className="daily-chart">
          {/* Placeholder for chart - you'll need to add a charting library */}
          {data.days.map(day => (
            <div key={day.id} className="daily-row">
              <span>{new Date(day.date).toLocaleDateString()}</span>
              <span>{day.stats.dayXP} XP</span>
              <span>{day.stats.dayMinutes}m</span>
            </div>
          ))}
        </div>
      </div>

      <div className="stats-section journal">
        <h3>Journal</h3>
        <div className="journal-entries">
          {data.days.map(day => (
            <div key={day.id} className="journal-entry">
              <div className="entry-date">
                {new Date(day.date).toLocaleDateString()}
              </div>
              {day.reflection ? (
                <div className="entry-content">{day.reflection}</div>
              ) : (
                <button className="add-reflection">Add Reflection</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Statistics; 