import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Column from './components/Column';
import AddItemPopup from './components/AddItemPopup';
import Timer from './components/Timer';
import FailurePopup from './components/FailurePopup';
import Menu from './components/Menu';
import DailyReflectionPopup from './components/DailyReflectionPopup';
import Statistics from './components/Statistics';
import Goals from './components/Goals';
import { Stats, Column as ColumnType, AddItemFormData, ColumnItem } from './types';
import { calculateXP } from './utils/xp';
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
    planAdherence: 0,
  });

  const [columns, setColumns] = useState<{ [key: string]: ColumnType }>({
    plan: { title: 'Plan', items: [] },
    fact: { title: 'Fact', items: [] },
  });

  const [showAddPopup, setShowAddPopup] = useState(false);
  const [activeTimer, setActiveTimer] = useState<ColumnItem | null>(null);
  const [failedItem, setFailedItem] = useState<ColumnItem | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showReflection, setShowReflection] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);
  const [showGoals, setShowGoals] = useState(false);

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
      planAdherence: data.currentDay.stats.planAdherence,
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

    // Check if we should show reflection
    if (storage.shouldShowReflection()) {
      setShowReflection(true);
    }

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
        planAdherence: updatedData.currentDay.stats.planAdherence,
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
      creationColumn: 'plan',
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

    const xpValue = calculateXP(
      completedItem.taskQuality,
      completedItem.timeQuality || 'not-pure',
      completedItem.priority,
      completedItem.columnOrigin,
      actualDuration,
      Number(completedItem.estimatedMinutes),
      false // hasReflection is always false for now
    );
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

  const handleDailyPlanner = () => {
    setShowStatistics(false);
    setShowGoals(false);
  };

  const handleStatistics = () => {
    setShowStatistics(true);
    setShowGoals(false);
  };

  const handleSetGoals = () => {
    setShowGoals(true);
    setShowStatistics(false);
  };

  const handleItemEdit = (item: ColumnItem, formData: AddItemFormData) => {
    if (item.columnOrigin !== 'plan') return;

    const updatedItem = {
      ...item,
      ...formData,
      estimatedMinutes: typeof formData.estimatedMinutes === 'string' 
        ? parseInt(formData.estimatedMinutes) 
        : formData.estimatedMinutes
    };
    storage.updatePlanItem(updatedItem);
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

  const handleReflectionSubmit = (reflection: string) => {
    storage.addReflection(reflection);
    setShowReflection(false);
  };

  const getCurrentPage = () => {
    if (showGoals) return 'goals';
    if (showStatistics) return 'statistics';
    return 'planner';
  };

  return (
    <div className="container">
      <div className="top-bar">
        <button className="menu-button" onClick={() => setIsMenuOpen(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <Header stats={stats} onTitleClick={handleDailyPlanner} />
      </div>
      {showGoals ? (
        <Goals stats={stats} />
      ) : showStatistics ? (
        <Statistics 
          data={storage.getData()} 
          onClose={() => setShowStatistics(false)} 
        />
      ) : (
        <>
          <Dashboard stats={stats} />
          <div className="columns-container">
            <Column 
              data={columns.plan} 
              onItemToggle={handleItemToggle}
              onAddClick={handleAddClick}
              onItemClick={handleItemClick}
              onItemEdit={handleItemEdit}
              columnId="plan"
            />
            <Column 
              data={columns.fact} 
              onItemToggle={() => {}}
              columnId="fact"
            />
          </div>
        </>
      )}
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
      <Menu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onNewDay={handleNewDay}
        onClearData={handleClearData}
        onStatistics={handleStatistics}
        onDailyPlanner={handleDailyPlanner}
        onSetGoals={handleSetGoals}
        currentPage={getCurrentPage()}
      />
      {showReflection && (
        <DailyReflectionPopup
          onConfirm={handleReflectionSubmit}
          onClose={() => setShowReflection(false)}
          stats={{
            todayXP: stats.todayXP,
            todayMinutes: stats.todayMinutes,
            todayPureMinutes: stats.todayPureMinutes,
          }}
        />
      )}
    </div>
  );
}

export default App;
