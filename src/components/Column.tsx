import React, { useState } from 'react';
import { Column as ColumnType, ColumnItem, AddItemFormData } from '../types';
import XPCalculationPopup from './XPCalculationPopup';
import AddItemPopup from './AddItemPopup';

interface ColumnProps {
  data: ColumnType;
  onItemToggle: (id: string) => void;
  onAddClick?: () => void;
  columnId: string;
  onItemClick?: (item: ColumnItem) => void;
  onItemEdit?: (item: ColumnItem, formData: AddItemFormData) => void;
  selectedDate: Date;
}

const Column: React.FC<ColumnProps> = ({ data, onItemToggle, onAddClick, columnId, onItemClick, onItemEdit, selectedDate }) => {
  const [selectedItem, setSelectedItem] = useState<ColumnItem | null>(null);
  const [showXPCalculation, setShowXPCalculation] = useState<ColumnItem | null>(null);
  const [editingItem, setEditingItem] = useState<ColumnItem | null>(null);

  const sortedItems = [...data.items].sort((a, b) => {
    if (columnId === 'plan') {
      if (a.priority !== b.priority) {
        const aPriority = typeof a.priority === 'string' ? parseInt(a.priority) : a.priority;
        const bPriority = typeof b.priority === 'string' ? parseInt(b.priority) : b.priority;
        return aPriority - bPriority;
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
    const priority = typeof item.priority === 'string' ? parseInt(item.priority) : item.priority;
    if (priority <= 3) {
      basePoints += 3;
    } else if (priority <= 6) {
      basePoints += 1;
    }

    // Plan bonus
    if (item.columnOrigin === 'plan') {
      basePoints += 2;
    }

    // Time multiplier
    const timeMultiplier = Math.floor(1 + (item.actualDuration || 0) / 60);
    
    return basePoints * timeMultiplier;
  };

  const getTotalXP = () => {
    return sortedItems.reduce((total, item) => total + (item.xpValue || 0), 0);
  };

  const isHighPriority = (priority: string | number) => {
    const priorityNum = typeof priority === 'string' ? parseInt(priority) : priority;
    return priorityNum <= 3;
  };

  const handleItemClick = (item: ColumnItem) => {
    if (columnId === 'plan') {
      setSelectedItem(item);
    } else if (columnId === 'fact') {
      setShowXPCalculation(item);
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

  const handleEditClick = () => {
    if (selectedItem && columnId === 'plan') {
      setEditingItem(selectedItem);
      setSelectedItem(null);
    }
  };

  const handleEditConfirm = (formData: AddItemFormData) => {
    if (editingItem && onItemEdit && columnId === 'plan') {
      onItemEdit(editingItem, formData);
      setEditingItem(null);
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
                ${columnId === 'fact' && isHighPriority(item.priority) ? 'high-priority' : ''}`}
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
                    <span>{item.estimatedMinutes}m</span>
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
      {selectedItem && columnId === 'plan' && (
        <div className="task-actions-overlay" onClick={() => setSelectedItem(null)}>
          <div className="task-actions-content" onClick={e => e.stopPropagation()}>
            <h3>{selectedItem.description}</h3>
            <div className="task-actions-buttons">
              <button className="delete-action" onClick={handleDeleteClick}>
                Delete
              </button>
              <button className="edit-action" onClick={handleEditClick}>
                Edit
              </button>
              <button className="start-action" onClick={handleStartClick}>
                Start
              </button>
            </div>
          </div>
        </div>
      )}
      {editingItem && columnId === 'plan' && (
        <AddItemPopup
          initialData={editingItem}
          onConfirm={handleEditConfirm}
          onCancel={() => setEditingItem(null)}
          selectedDate={selectedDate}
        />
      )}
      {showXPCalculation && columnId === 'fact' && (
        <XPCalculationPopup 
          item={showXPCalculation} 
          onClose={() => setShowXPCalculation(null)} 
        />
      )}
    </div>
  );
};

export default Column; 