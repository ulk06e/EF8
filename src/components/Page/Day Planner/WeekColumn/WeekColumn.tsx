import React, { useState, useEffect } from 'react';
import storage from '../../../../services/storage';
import '../../../../styles/notion.css';

interface WeekColumnProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onTodayClick: () => void;
}

const WeekColumn: React.FC<WeekColumnProps> = ({
  selectedDate,
  onDateSelect,
  onTodayClick,
}) => {
  const [weekOffset, setWeekOffset] = useState(0);
  const [storageData, setStorageData] = useState(storage.getData());

  useEffect(() => {
    // Subscribe to storage changes
    const unsubscribe = storage.subscribe(() => {
      setStorageData(storage.getData());
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const getWeekDates = () => {
    const today = new Date();
    const currentDay = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - currentDay + (weekOffset * 7));
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      weekDates.push(date);
    }
    return weekDates;
  };

  const weekDates = getWeekDates();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDayName = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  const getColumnTitle = () => {
    const firstDate = weekDates[0];
    return firstDate.toLocaleDateString('en-US', { 
      month: 'long'
    });
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  };

  const isPastDay = (date: Date) => {
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate < today;
  };

  const handlePreviousWeek = () => {
    setWeekOffset(prev => prev - 1);
  };

  const handleNextWeek = () => {
    setWeekOffset(prev => prev + 1);
  };

  const handleTodayClick = () => {
    setWeekOffset(0);
    onTodayClick();
  };

  const getEstimatedMinutesForDate = (date: Date) => {
    // Get all plan items from current day data
    const allPlanItems = storageData.currentDay.planItems;
    
    // Sum up estimated minutes for items matching the target date
    return allPlanItems.reduce((total, item) => {
      if (isSameDay(new Date(item.date), date)) {
        const minutes = typeof item.estimatedMinutes === 'string'
          ? parseInt(item.estimatedMinutes)
          : item.estimatedMinutes;
        return total + minutes;
      }
      return total;
    }, 0);
  };

  const getButtonColorClass = (date: Date, estimatedMinutes: number) => {
    if (isPastDay(date) || isSameDay(date, today)) {
      return '';
    }

    if (estimatedMinutes < 240) {
      return 'low-minutes';
    } else if (estimatedMinutes <= 480) {
      return 'medium-minutes';
    } else {
      return 'high-minutes';
    }
  };

  return (
    <div className="week-container">
      <div className="column-header">
        <div className="week-navigation">
          <button onClick={handlePreviousWeek} className="week-nav-button">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h2>{getColumnTitle()}</h2>
          <button onClick={handleNextWeek} className="week-nav-button">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
        <button onClick={handleTodayClick} className="add-button">Today</button>
      </div>
      <div className="week-days">
        {weekDates.map((date) => {
          const estimatedMinutes = getEstimatedMinutesForDate(date);
          const isPast = isPastDay(date);
          const colorClass = getButtonColorClass(date, estimatedMinutes);
          return (
            <div key={date.toISOString()} className="week-day-container">
              <button
                className={`week-day-button ${
                  isSameDay(date, selectedDate) ? 'selected' : ''
                } ${isSameDay(date, today) ? 'current' : ''} ${colorClass}`}
                onClick={() => onDateSelect(date)}
              >
                <div className="day-name">{formatDayName(date)}</div>
                <div className="day-date">{formatDate(date)}</div>
              </button>
              {(
                <div className="unaccounted-minutes">
                  {estimatedMinutes}m planned
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeekColumn; 