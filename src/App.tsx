import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Column from './components/Column';
import AddItemPopup from './components/AddItemPopup';
import Timer from './components/Timer';
import FailurePopup from './components/FailurePopup';
import { Stats, Column as ColumnType, AddItemFormData, ColumnItem } from './types';
import storage from './services/storage';
import './styles/notion.css';

function App() {
  const [stats, setStats] = useState<Stats>({
    currentXP: 0,
    nextLevelXP: 100,
    currentLevel: 1,
    todayXP: 0,
    bestDayXP: 0,
    todayMinutes: 0,
    bestMinutes: 0,
    todayPureMinutes: 0,
    bestPureMinutes: 0,
    streak: 0,
  });

  const [columns, setColumns] = useState<{ [key: string]: ColumnType }>({
    plan: { title: 'Plan', items: [] },
    fact: { title: 'Fact', items: [] },
  });

  const [showAddPopup, setShowAddPopup] = useState(false);
  const [activeTimer, setActiveTimer] = useState<ColumnItem | null>(null);
  const [failedItem, setFailedItem] = useState<ColumnItem | null>(null);

  // Subscribe to storage changes
  useEffect(() => {
    // Initial load
    const data = storage.getData();
    setStats({
      currentXP: data.totalXP,
      nextLevelXP: data.nextLevelXP,
      currentLevel: data.currentLevel,
      todayXP: data.currentDay.stats.dayXP,
      bestDayXP: data.records.highestDayXP,
      todayMinutes: data.currentDay.stats.dayMinutes,
      bestMinutes: data.records.mostWorkTimeInDay,
      todayPureMinutes: data.currentDay.stats.dayPureMinutes,
      bestPureMinutes: data.records.mostPureTimeInDay,
      streak: data.streak,
    });

    setColumns({
      plan: {
        title: 'Plan',
        items: data.currentDay.planItems,
      },
      fact: {
        title: 'Fact',
        items: data.currentDay.factItems,
      },
    });

    // Subscribe to future changes
    const unsubscribe = storage.subscribe(() => {
      const updatedData = storage.getData();
      setStats({
        currentXP: updatedData.totalXP,
        nextLevelXP: updatedData.nextLevelXP,
        currentLevel: updatedData.currentLevel,
        todayXP: updatedData.currentDay.stats.dayXP,
        bestDayXP: updatedData.records.highestDayXP,
        todayMinutes: updatedData.currentDay.stats.dayMinutes,
        bestMinutes: updatedData.records.mostWorkTimeInDay,
        todayPureMinutes: updatedData.currentDay.stats.dayPureMinutes,
        bestPureMinutes: updatedData.records.mostPureTimeInDay,
        streak: updatedData.streak,
      });

      setColumns({
        plan: {
          title: 'Plan',
          items: updatedData.currentDay.planItems,
        },
        fact: {
          title: 'Fact',
          items: updatedData.currentDay.factItems,
        },
      });
    });

    return () => unsubscribe();
  }, []);

  const handleAddClick = () => {
    console.log('handleAddClick called');
    setShowAddPopup(true);
  };

  const handlePopupConfirm = (data: AddItemFormData) => {
    const newItem: ColumnItem = {
      id: Date.now().toString(),
      ...data,
      completed: false,
      columnOrigin: 'plan',
      xpValue: 0,
      createdTime: new Date(),
    };

    storage.addPlanItem(newItem);
    setShowAddPopup(false);
  };

  const handleItemToggle = (itemId: string) => {
    storage.removePlanItem(itemId);
  };

  const handleItemClick = (item: ColumnItem) => {
    if (item.columnOrigin === 'plan') {
      setActiveTimer(item);
    }
  };

  const handleTimerFail = () => {
    if (activeTimer) {
      setFailedItem(activeTimer);
      setActiveTimer(null);
    }
  };

  const handleTimerFinish = (actualDuration: number, isPure: boolean) => {
    if (!activeTimer) return;

    const completedItem: ColumnItem = {
      ...activeTimer,
      completed: true,
      actualDuration,
      timeQuality: isPure ? 'pure' : 'not-pure',
      completedTime: new Date(),
    };

    // Calculate XP
    let basePoints = 0;
    switch (completedItem.taskQuality) {
      case 'A': basePoints = 8; break;
      case 'B': basePoints = 4; break;
      case 'C': basePoints = 2; break;
      case 'D': basePoints = 1; break;
    }
    if (isPure) basePoints += 3;
    if (completedItem.priority === 1) basePoints += 3;
    else if (completedItem.priority === 2) basePoints += 1;
    
    const timeMultiplier = Math.floor(1 + actualDuration / 60);
    const xpValue = basePoints * timeMultiplier;
    completedItem.xpValue = xpValue;

    storage.removePlanItem(activeTimer.id);
    storage.addFactItem(completedItem);
    storage.addXP(xpValue);
    storage.updateStats(actualDuration, isPure ? actualDuration : 0);

    setActiveTimer(null);
  };

  const handleFailureDelete = () => {
    if (!failedItem) return;
    storage.removePlanItem(failedItem.id);
    setFailedItem(null);
  };

  const handleFailureRepeat = () => {
    if (!failedItem) return;

    const estimatedMinutesNum = typeof failedItem.estimatedMinutes === 'string'
      ? parseInt(failedItem.estimatedMinutes)
      : failedItem.estimatedMinutes;

    const repeatedItem: ColumnItem = {
      ...failedItem,
      id: Date.now().toString(),
      completed: false,
      estimatedMinutes: estimatedMinutesNum + (failedItem.actualDuration || 0),
      createdTime: new Date(),
    };

    storage.addPlanItem(repeatedItem);
    storage.removePlanItem(failedItem.id);
    setFailedItem(null);
  };

  const handleNewDay = () => {
    if (window.confirm('Are you sure you want to start a new day? This will clear today\'s data and subtract today\'s XP from your total.')) {
      storage.transitionToNewDay(false);
    }
  };

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear ALL data? This cannot be undone!')) {
      storage.clearAllData();
    }
  };

  return (
    <div className="container">
      <Header stats={stats} />
      <Dashboard stats={stats} />
      <div className="columns-container">
        <Column 
          data={columns.plan} 
          onItemToggle={handleItemToggle}
          onAddClick={handleAddClick}
          onItemClick={handleItemClick}
          columnId="plan"
        />
        <Column 
          data={columns.fact} 
          onItemToggle={() => {}}
          columnId="fact"
        />
      </div>
      <div className="bottom-actions">
        <button onClick={handleNewDay} className="new-day-button">New Day</button>
        <button onClick={handleClearData} className="clear-data-button">Clear All Data</button>
      </div>
      {showAddPopup && (
        <AddItemPopup
          onConfirm={handlePopupConfirm}
          onCancel={() => setShowAddPopup(false)}
        />
      )}
      {activeTimer && (
        <Timer
          item={activeTimer}
          onFail={handleTimerFail}
          onFinish={handleTimerFinish}
          onClose={() => setActiveTimer(null)}
        />
      )}
      {failedItem && (
        <FailurePopup
          onDelete={handleFailureDelete}
          onRepeat={handleFailureRepeat}
          onClose={() => setFailedItem(null)}
        />
      )}
    </div>
  );
}

export default App;
