import React, { useState } from 'react';
import { Column as ColumnType, ColumnItem } from '../types';

interface ColumnProps {
  data: ColumnType;
  onItemToggle: (id: string) => void;
  onAddClick?: () => void;
  columnId: string;
  onItemClick?: (item: ColumnItem) => void;
}

const Column: React.FC<ColumnProps> = ({ data, onItemToggle, onAddClick, columnId, onItemClick }) => {
  const [selectedItem, setSelectedItem] = useState<ColumnItem | null>(null);

  const sortedItems = [...data.items].sort((a, b) => {
    if (columnId === 'plan') {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return a.taskQuality.localeCompare(b.taskQuality);
    }
    return new Date(b.completedTime || 0).getTime() - new Date(a.completedTime || 0).getTime();
  });

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const calculateXP = (item: ColumnItem): number => {
    let basePoints = 0;
    
    // Task quality points
    switch (item.taskQuality) {
      case 'A': basePoints = 8; break;
      case 'B': basePoints = 4; break;
      case 'C': basePoints = 2; break;
      case 'D': basePoints = 1; break;
    }

    // Pure time bonus
    if (item.timeQuality === 'pure') {
      basePoints += 3;
    }

    // Priority bonus
    if (item.priority === 1) {
      basePoints += 3;
    } else if (item.priority === 2) {
      basePoints += 1;
    }

    // Time multiplier
    const timeMultiplier = Math.floor(1 + (item.actualDuration || 0) / 60);
    
    return basePoints * timeMultiplier;
  };

  const getTotalXP = () => {
    return sortedItems.reduce((total, item) => total + (item.xpValue || 0), 0);
  };

  const isHighPriority = (priority: number) => priority === 1 || priority === 2;

  const handleItemClick = (item: ColumnItem) => {
    if (columnId === 'plan') {
      setSelectedItem(item);
    }
  };

  const handleStartClick = () => {
    if (selectedItem && onItemClick) {
      onItemClick(selectedItem);
      setSelectedItem(null);
    }
  };

  const handleDeleteClick = () => {
    if (selectedItem && onItemToggle) {
      onItemToggle(selectedItem.id);
      setSelectedItem(null);
    }
  };

  const getUnaccountedMinutes = (currentItem: ColumnItem, index: number) => {
    if (columnId !== 'fact' || !currentItem.completedTime) return null;

    const currentTime = new Date(currentItem.completedTime);
    let previousTime: Date;

    if (index === sortedItems.length - 1) {
      // For the last item (earliest in the day), compare with 4:00
      previousTime = new Date(currentTime);
      previousTime.setHours(4, 0, 0, 0);
      if (previousTime > currentTime) {
        previousTime.setDate(previousTime.getDate() - 1);
      }
    } else {
      const nextItem = sortedItems[index + 1];
      if (!nextItem.completedTime) return null;
      previousTime = new Date(nextItem.completedTime);
    }

    const diffMinutes = Math.floor((currentTime.getTime() - previousTime.getTime()) / (1000 * 60));
    const accountedMinutes = currentItem.actualDuration || 0;
    const unaccountedMinutes = diffMinutes - accountedMinutes;

    return unaccountedMinutes > 0 ? unaccountedMinutes : null;
  };

  return (
    <div className="column">
      <div className="column-header">
        <h2>{data.title}</h2>
        {columnId === 'plan' && onAddClick && (
          <button onClick={onAddClick} className="add-button">Add</button>
        )}
        {columnId === 'fact' && (
          <button className="xp-display">{getTotalXP()} XP</button>
        )}
      </div>
      <div className="column-items">
        {sortedItems.map((item: ColumnItem, index) => (
          <React.Fragment key={item.id}>
            {columnId === 'fact' && (
              <div className="unaccounted-time">
                {getUnaccountedMinutes(item, index) !== null && (
                  <div className="unaccounted-minutes">
                    Unaccounted: {getUnaccountedMinutes(item, index)}m
                  </div>
                )}
              </div>
            )}
            <div 
              className={`column-item ${item.completed ? 'completed' : ''} 
                ${columnId === 'plan' && index === 0 ? 'top-priority' : ''}
                ${columnId === 'fact' && item.timeQuality === 'pure' ? 'pure-time' : ''}
                ${columnId === 'fact' && (item.priority === 1 || item.priority === 2) ? 'high-priority' : ''}`}
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
                {columnId === 'plan' ? (
                  <div className="item-details">
                    <span>{item.estimatedMinutes}m - {item.timeType}</span>
                  </div>
                ) : (
                  <div className="item-details">
                    <div>{item.actualDuration}m/{item.estimatedMinutes}m - {item.completedTime && formatDate(new Date(item.completedTime))}</div>
                    <div className="xp-value">+{item.xpValue} XP</div>
                  </div>
                )}
              </div>
            </div>
          </React.Fragment>
        ))}
      </div>
      {selectedItem && (
        <div className="task-actions-overlay" onClick={() => setSelectedItem(null)}>
          <div className="task-actions-content" onClick={e => e.stopPropagation()}>
            <h3>{selectedItem.description}</h3>
            <div className="task-actions-buttons">
              <button className="delete-action" onClick={handleDeleteClick}>
                Delete
              </button>
              <button className="start-action" onClick={handleStartClick}>
                Start
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Column; 