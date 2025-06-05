import React, { useState } from 'react';
import { StorageData, DayData } from '../types/storage';
import '../styles/notion.css';

interface StatisticsProps {
  data: StorageData;
  onClose: () => void;
}

interface DayDetails {
  date: Date;
  xp: number;
  minutes: number;
  unaccountedMinutes: number;
  planItems: any[];
  factItems: any[];
  reflection?: string;
  hasData: boolean;
}

const Statistics: React.FC<StatisticsProps> = ({ data, onClose }) => {
  const [selectedDay, setSelectedDay] = useState<DayDetails | null>(null);

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

  const getLast7Days = (): DayDetails[] => {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 6); // -6 to include today
    
    const days: DayDetails[] = [];
    for (let d = new Date(sevenDaysAgo); d <= now; d.setDate(d.getDate() + 1)) {
      const dayData = data.days.find(day => 
        new Date(day.date).toDateString() === d.toDateString()
      );

      // If it's today, use currentDay data
      const isToday = d.toDateString() === now.toDateString();
      const dayToUse = isToday ? data.currentDay : dayData;

      const dayDetails: DayDetails = {
        date: new Date(d),
        xp: dayToUse?.stats.dayXP || 0,
        minutes: dayToUse?.stats.dayMinutes || 0,
        unaccountedMinutes: dayToUse ? calculateUnaccountedMinutes(dayToUse) : 0,
        planItems: dayToUse?.planItems || [],
        factItems: dayToUse?.factItems || [],
        reflection: dayToUse?.reflection,
        hasData: !!dayToUse
      };
      days.push(dayDetails);
    }
    
    return days.reverse(); // Most recent first
  };

  const calculateUnaccountedMinutes = (day: DayData): number => {
    let total = 0;
    const sortedItems = [...day.factItems].sort((a, b) => 
      new Date(b.completedTime || 0).getTime() - new Date(a.completedTime || 0).getTime()
    );

    sortedItems.forEach((item, index) => {
      if (!item.completedTime) return;

      const currentTime = new Date(item.completedTime);
      let previousTime: Date;

      if (index === sortedItems.length - 1) {
        previousTime = new Date(currentTime);
        previousTime.setHours(4, 0, 0, 0);
        if (previousTime > currentTime) {
          previousTime.setDate(previousTime.getDate() - 1);
        }
      } else {
        const nextItem = sortedItems[index + 1];
        if (!nextItem.completedTime) return;
        previousTime = new Date(nextItem.completedTime);
      }

      const diffMinutes = Math.floor((currentTime.getTime() - previousTime.getTime()) / (1000 * 60));
      const accountedMinutes = item.actualDuration || 0;
      const unaccountedMinutes = diffMinutes - accountedMinutes;

      if (unaccountedMinutes > 0) {
        total += unaccountedMinutes;
      }
    });

    return total;
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateShort = (date: Date): string => {
    return date.toLocaleDateString('en-US', { 
      day: 'numeric',
      month: 'short'
    });
  };

  const thisWeekXP = calculateWeekXP(data.days);
  const lastWeekXP = calculateWeekXP(data.days, 1);
  const xpChange = lastWeekXP ? ((thisWeekXP - lastWeekXP) / lastWeekXP) * 100 : 0;
  const xpBreakdown = calculateXPBreakdown(data.days);
  const days = getLast7Days();
  const maxXP = Math.max(...days.map(d => d.xp)) * 1.5 || 100;
  const maxMinutes = Math.max(...days.map(d => d.minutes)) * 1.5 || 100;

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

      <div className="stats-section charts">
        <h3>XP Over Time (Last 30 Days)</h3>
        <div className="chart">
          <div className="y-axis">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="y-label">
                {Math.round(maxXP * i / 5)}
              </div>
            ))}
          </div>
          <div className="chart-content">
            <svg className="chart-svg" viewBox="0 0 1000 300" preserveAspectRatio="none">
              <polyline
                points={days.map((day, i) => 
                  `${(i * (1000 / (days.length - 1)))},${300 - (day.xp / maxXP * 300)}`
                ).join(' ')}
                fill="none"
                stroke="rgb(46, 170, 220)"
                strokeWidth="2"
              />
              {days.map((day, i) => (
                <g key={i}>
                  <circle
                    cx={i * (1000 / (days.length - 1))}
                    cy={300 - (day.xp / maxXP * 300)}
                    r="6"
                    fill="rgb(46, 170, 220)"
                    className="chart-dot"
                  />
                  <title>{`${formatDateShort(day.date)}: ${day.xp} XP`}</title>
                </g>
              ))}
            </svg>
            <div className="x-axis">
              {days.map((day, i) => (
                <div key={i} className="x-label">
                  {formatDateShort(day.date)}
                </div>
              ))}
            </div>
          </div>
        </div>

        <h3>Time Tracked (Last 30 Days)</h3>
        <div className="chart">
          <div className="y-axis">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="y-label">
                {Math.round(maxMinutes * i / 5)}m
              </div>
            ))}
          </div>
          <div className="chart-content">
            <svg className="chart-svg" viewBox="0 0 1000 300" preserveAspectRatio="none">
              <polyline
                points={days.map((day, i) => 
                  `${(i * (1000 / (days.length - 1)))},${300 - (day.minutes / maxMinutes * 300)}`
                ).join(' ')}
                fill="none"
                stroke="#2ecc71"
                strokeWidth="2"
              />
              {days.map((day, i) => (
                <g key={i}>
                  <circle
                    cx={i * (1000 / (days.length - 1))}
                    cy={300 - (day.minutes / maxMinutes * 300)}
                    r="6"
                    fill="#2ecc71"
                    className="chart-dot"
                  />
                  <title>{`${formatDateShort(day.date)}: ${day.minutes}m`}</title>
                </g>
              ))}
            </svg>
            <div className="x-axis">
              {days.map((day, i) => (
                <div key={i} className="x-label">
                  {formatDateShort(day.date)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="stats-section journal">
        <h3>Daily Records</h3>
        <div className="journal-entries">
          {days.map(day => (
            <button
              key={day.date.toISOString()}
              className={`journal-entry-button ${selectedDay?.date === day.date ? 'selected' : ''} ${!day.hasData ? 'no-data' : ''}`}
              onClick={() => day.hasData && setSelectedDay(selectedDay?.date === day.date ? null : day)}
              disabled={!day.hasData}
            >
              {formatDate(day.date)}
              {!day.hasData && ' (No Data)'}
            </button>
          ))}
        </div>
        {selectedDay && (
          <div className="day-details-popup">
            <div className="popup-content">
              <h3>{formatDate(selectedDay.date)}</h3>
              <div className="day-stats">
                <div>XP: {selectedDay.xp}</div>
                <div>Time Tracked: {selectedDay.minutes}m</div>
                <div>Unaccounted Time: {selectedDay.unaccountedMinutes}m</div>
              </div>
              <div className="day-tasks">
                <h4>Plan</h4>
                <div className="task-list">
                  {selectedDay.planItems.map(item => (
                    <div key={item.id} className="task-item">
                      {item.description}
                    </div>
                  ))}
                </div>
                <h4>Completed</h4>
                <div className="task-list">
                  {selectedDay.factItems.map(item => (
                    <div key={item.id} className="task-item">
                      {item.description}
                    </div>
                  ))}
                </div>
                {selectedDay.reflection && (
                  <>
                    <h4>Journal</h4>
                    <div className="reflection-text">
                      {selectedDay.reflection}
                    </div>
                  </>
                )}
              </div>
              <button className="close-button" onClick={() => setSelectedDay(null)}>
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Statistics; 