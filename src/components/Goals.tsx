import React, { useState, useEffect } from 'react';
import { Stats, Column, ColumnItem, WeekDay, AddItemFormData } from '../types';
import PrePlanColumn from './PrePlanColumn';
import AddItemPopup from './AddItemPopup';
import storage from '../services/storage';
import '../styles/notion.css';

interface GoalsProps {
  stats: Stats;
}

const Goals: React.FC<GoalsProps> = ({ stats }) => {
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekData, setWeekData] = useState<WeekDay[]>([]);
  const [prePlanColumn, setPrePlanColumn] = useState<Column>({
    title: 'Pre-Plan',
    items: [],
  });
  const [showSundayBonus, setShowSundayBonus] = useState(false);
  const [editingItem, setEditingItem] = useState<ColumnItem | null>(null);

  useEffect(() => {
    loadWeekData();
    checkSundayBonus();
  }, []);

  const loadWeekData = () => {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1);

    const week: WeekDay[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      
      const items = storage.getPrePlannedItems(date);
      const totalMinutes = items.reduce((sum, item) => {
        const minutes = typeof item.estimatedMinutes === 'string' 
          ? parseInt(item.estimatedMinutes) 
          : item.estimatedMinutes;
        return sum + (isNaN(minutes) ? 0 : minutes);
      }, 0);

      week.push({
        date,
        totalMinutes,
        items,
      });
    }

    setWeekData(week);
    setPrePlanColumn({
      title: 'Pre-Plan',
      items: storage.getPrePlannedItems(selectedDate),
    });
  };

  const checkSundayBonus = () => {
    const today = new Date();
    if (today.getDay() === 0 && weekData && weekData.length > 0) { // Sunday and weekData exists
      const greenDays = weekData.filter(day => day.totalMinutes > 480).length;
      const redDays = weekData.filter(day => day.totalMinutes < 240).length;

      if (greenDays >= 3 && redDays === 0) {
        storage.addXP(50);
        setShowSundayBonus(true);
        setTimeout(() => setShowSundayBonus(false), 5000);
      }
    }
  };

  const handleAddClick = () => {
    setEditingItem(null);
    setShowAddPopup(true);
  };

  const handlePopupConfirm = (data: AddItemFormData) => {
    if (editingItem) {
      const updatedItem: ColumnItem = {
        ...editingItem,
        ...data,
        plannedDate: selectedDate,
      };
      storage.updatePrePlannedItem(updatedItem);
    } else {
      const newItem: ColumnItem = {
        id: Date.now().toString(),
        ...data,
        completed: false,
        columnOrigin: 'pre-plan',
        creationColumn: 'pre-plan',
        xpValue: 0,
        createdTime: new Date(),
        plannedDate: selectedDate,
        wasPrePlanned: true,
      };
      storage.addPrePlannedItem(newItem);
    }
    
    loadWeekData();
    setShowAddPopup(false);
    setEditingItem(null);
  };

  const handleItemEdit = (item: ColumnItem) => {
    setEditingItem(item);
    setShowAddPopup(true);
  };

  const handleItemDelete = (itemId: string) => {
    storage.removePrePlannedItem(itemId);
    loadWeekData();
  };

  const handleDaySelect = (date: Date) => {
    setSelectedDate(date);
    setPrePlanColumn({
      title: 'Pre-Plan',
      items: storage.getPrePlannedItems(date),
    });
  };

  return (
    <div className="goals-page">
      <div className="goals-content">
        {/* Show pre-plan reminder on Sundays */}
        {new Date().getDay() === 0 && (
          <div className="preplan-reminder">
            Don't forget to pre-plan your tasks for next week!
          </div>
        )}

        <PrePlanColumn
          data={prePlanColumn}
          weekData={weekData}
          onAddClick={handleAddClick}
          onItemEdit={handleItemEdit}
          onItemDelete={handleItemDelete}
          onDaySelect={handleDaySelect}
          selectedDate={selectedDate}
        />

{showAddPopup && (
  <AddItemPopup
    onConfirm={handlePopupConfirm}
    onCancel={() => {
      setShowAddPopup(false);
      setEditingItem(null);
    }}
    initialData={editingItem || undefined}
  />
)}

        {showSundayBonus && (
          <div className="sunday-bonus">
            <h4>Congratulations! 🎉</h4>
            <p>You've earned 50 bonus XP for good weekly planning!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Goals; 