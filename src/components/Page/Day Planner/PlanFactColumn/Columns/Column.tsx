import React, { useState } from 'react';
import { Column as ColumnType, ColumnItem, AddItemFormData } from '../../../../../types';
import XPCalculationPopup from './XPCalculationPopup';
import AddItemPopup from './AddItemPopup';
import '../../../../../styles/notion.css';
import { calculateXP } from '../../../../../utils/xp';


interface ColumnProps {
  data: ColumnType;
  onItemToggle: (itemId: string) => void;
  onAddClick?: () => void;
  onItemClick?: (item: ColumnItem) => void;
  onItemEdit?: (item: ColumnItem, formData: AddItemFormData) => void;
  columnId: string;
  selectedDate: Date;
  selectedProjectId: string;
}

const Column: React.FC<ColumnProps> = ({
  data,
  onItemToggle,
  onAddClick,
  onItemClick,
  onItemEdit,
  columnId,
  selectedDate,
  selectedProjectId
}) => {
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

  const handleEditClick = (item: ColumnItem) => {
    setEditingItem(item);
  };

  const handleEditConfirm = (formData: AddItemFormData) => {
    if (editingItem && onItemEdit) {
      onItemEdit(editingItem, formData);
      setEditingItem(null);
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

  const isFutureDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate > today;
  };

  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate < today;
  };

  const canAddOrEditTasks = !isPastDate(selectedDate);

  return (
    <div className="column">
      <div className="column-header">
        <h2>{data.title}</h2>
        {onAddClick && columnId === 'plan' && (
          <button 
            onClick={onAddClick} 
            className={`add-button ${!canAddOrEditTasks ? 'disabled' : ''}`}
            disabled={!canAddOrEditTasks}
          >
            Add Item
          </button>
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
              <button className="edit-action" onClick={() => handleEditClick(selectedItem)}>
                Edit
              </button>
              {!isFutureDate(selectedDate) && (
                <button className="start-action" onClick={handleStartClick}>
                  Start
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {editingItem && columnId === 'plan' && canAddOrEditTasks && (
        <AddItemPopup
          initialData={editingItem}
          onConfirm={handleEditConfirm}
          onCancel={() => setEditingItem(null)}
          selectedDate={selectedDate}
          selectedProjectId={selectedProjectId}
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