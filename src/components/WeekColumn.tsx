import React, { useState } from 'react';
import storage from '../services/storage';
import '../styles/notion.css';

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
    const data = storage.getData();
    const dayData = isSameDay(date, new Date())
      ? data.currentDay
      : data.days.find(d => isSameDay(new Date(d.date), date));

    if (!dayData) return 0;

    return dayData.planItems.reduce((total, item) => {
      const minutes = typeof item.estimatedMinutes === 'string'
        ? parseInt(item.estimatedMinutes)
        : item.estimatedMinutes;
      return total + minutes;
    }, 0);
  };

  return (
    <div className="dashboard week-column">
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
          return (
            <div key={date.toISOString()} className="week-day-container">
              <button
                className={`week-day-button ${
                  isSameDay(date, selectedDate) ? 'selected' : ''
                } ${isSameDay(date, today) ? 'current' : ''}`}
                onClick={() => onDateSelect(date)}
              >
                <div className="day-name">{formatDayName(date)}</div>
                <div className="day-date">{formatDate(date)}</div>
              </button>
              {!isPast && (
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