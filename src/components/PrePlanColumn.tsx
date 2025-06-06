import React, { useState } from 'react';
import { Column, ColumnItem, WeekDay } from '../types';
import ProjectColumns from './ProjectColumns';
import '../styles/notion.css';

interface PrePlanColumnProps {
  data: Column;
  weekData: WeekDay[];
  onAddClick: () => void;
  onItemEdit: (item: ColumnItem) => void;
  onItemDelete: (itemId: string) => void;
  onDaySelect: (date: Date) => void;
  selectedDate: Date;
}

const PrePlanColumn: React.FC<PrePlanColumnProps> = ({
  data,
  weekData,
  onAddClick,
  onItemEdit,
  onItemDelete,
  onDaySelect,
  selectedDate,
}) => {
  const [selectedItem, setSelectedItem] = useState<ColumnItem | null>(null);

  const getDayColor = (minutes: number): string => {
    if (minutes > 480) return 'bg-green-light'; // > 8 hours (480 minutes)
    if (minutes >= 240) return 'bg-yellow-light'; // 4-8 hours (240-480 minutes)
    return 'bg-red-light'; // < 4 hours (240 minutes)
  };

  const formatDay = (date: Date): string => {
    return date.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2);
  };

  const isSameDay = (date1: Date, date2: Date): boolean => {
    return date1.toDateString() === date2.toDateString();
  };

  const isToday = (date: Date): boolean => {
    const now = new Date();
    const today = new Date();
    // If it's before 4 AM, consider it as the previous day
    if (now.getHours() < 4) {
      today.setDate(today.getDate() - 1);
    }
    return isSameDay(date, today);
  };

  const handleItemClick = (item: ColumnItem) => {
    setSelectedItem(item);
  };

  return (
    <div className="pre-plan-container">
      <ProjectColumns />
      <div className="pre-plan-column">
        <div className="column-header">
          <h2>Pre-Plan</h2>
          <button 
            className="add-button" 
            onClick={onAddClick}
            disabled={isToday(selectedDate)}
            style={{ opacity: isToday(selectedDate) ? 0.5 : 1 }}
          >
            Add Task
          </button>
        </div>

        <div className="week-selector">
          {weekData.map((day) => (
            <button
              key={day.date.toISOString()}
              className={`day-button ${getDayColor(day.totalMinutes)} ${
                isSameDay(day.date, selectedDate) ? 'selected' : ''
              } ${isToday(day.date) ? 'today' : ''}`}
              onClick={() => onDaySelect(day.date)}
            >
              {formatDay(day.date)}
            </button>
          ))}
        </div>

        <div className="column-items">
          {data.items
            .filter((item) => item.plannedDate && isSameDay(item.plannedDate, selectedDate))
            .map((item) => (
              <div
                key={item.id}
                className={`column-item ${
                  item.creationColumn === 'pre-plan' ? 'plan-created' : ''
                }`}
                onClick={() => handleItemClick(item)}
              >
                <div className="item-block">
                  <div className="item-header">
                    <span className="item-name">
                      <span className="item-priority">#{item.priority}</span>
                      <span className="item-separator">-</span>
                      <span className="item-quality">{item.taskQuality}</span>
                    </span>
                    <span className="item-description">: {item.description}</span>
                  </div>
                </div>
                <div className="item-block">
                  <div className="item-details">
                    <div>Estimated: {item.estimatedMinutes}m</div>
                  </div>
                </div>
              </div>
            ))}
        </div>

        {selectedItem && (
          <div className="task-actions-overlay" onClick={() => setSelectedItem(null)}>
            <div className="task-actions-content" onClick={e => e.stopPropagation()}>
              <h3>{selectedItem.description}</h3>
              <div className="task-actions-buttons">
                <button className="edit-action" onClick={() => {
                  onItemEdit(selectedItem);
                  setSelectedItem(null);
                }}>
                  Edit
                </button>
                <button className="delete-action" onClick={() => {
                  onItemDelete(selectedItem.id);
                  setSelectedItem(null);
                }}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrePlanColumn; 