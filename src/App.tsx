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
import WeekColumn from './components/WeekColumn';
import Projects from './components/Projects';
import { Stats, Column as ColumnType, AddItemFormData, ColumnItem, Project } from './types';
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
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [projects, setProjects] = useState<Project[]>([]);

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

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleTodayClick = () => {
    setSelectedDate(new Date());
  };

  const handleAddClick = () => {
    console.log('handleAddClick called');
    setShowAddPopup(true);
  };

  const handlePopupConfirm = (data: AddItemFormData) => {
    const newItem: ColumnItem = {
      id: crypto.randomUUID(),
      ...data,
      completed: false,
      columnOrigin: 'plan',
      creationColumn: 'plan',
      xpValue: 0,
      createdTime: new Date(),
      date: selectedDate,
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
    storage.addFactItem(completedItem, actualDuration);
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
  };

  const handleStatistics = () => {
    setShowStatistics(true);
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
    if (showStatistics) return 'statistics';
    return 'planner';
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  };

  const filteredColumns = {
    plan: {
      ...columns.plan,
      items: columns.plan.items.filter(item => isSameDay(item.date, selectedDate))
    },
    fact: {
      ...columns.fact,
      items: columns.fact.items.filter(item => isSameDay(item.date, selectedDate))
    }
  };

  const handleAddProject = (name: string) => {
    const newProject: Project = {
      id: Date.now().toString(),
      name,
      currentXP: 0,
      nextLevelXP: 100,
      currentLevel: 1,
      taskIds: []
    };
    setProjects(prev => [...prev, newProject]);
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
      {showStatistics ? (
        <Statistics 
          data={storage.getData()} 
          onClose={() => setShowStatistics(false)} 
        />
      ) : (
        <>
          <Dashboard stats={stats} />
          <Projects onAddProject={handleAddProject} />
          <div className="columns-container">
            <Column 
              data={filteredColumns.plan} 
              onItemToggle={handleItemToggle}
              onAddClick={handleAddClick}
              onItemClick={handleItemClick}
              onItemEdit={handleItemEdit}
              columnId="plan"
              selectedDate={selectedDate}
            />
            <Column 
              data={filteredColumns.fact} 
              onItemToggle={() => {}}
              columnId="fact"
              selectedDate={selectedDate}
            />
          </div>
          <WeekColumn
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            onTodayClick={handleTodayClick}
          />
        </>
      )}
      {showAddPopup && (
        <AddItemPopup
          onConfirm={handlePopupConfirm}
          onCancel={() => setShowAddPopup(false)}
          selectedDate={selectedDate}
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
