import React from 'react';
import '../styles/notion.css';

interface MenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNewDay: () => void;
  onClearData: () => void;
  onStatistics: () => void;
  onDailyPlanner: () => void;
  onSetGoals: () => void;
}

const Menu: React.FC<MenuProps> = ({ 
  isOpen, 
  onClose, 
  onNewDay, 
  onClearData, 
  onStatistics,
  onDailyPlanner,
  onSetGoals
}) => {
  const handleMenuItemClick = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <>
      {isOpen && (
        <div className="menu-overlay" onClick={onClose}>
          <div className="menu-content" onClick={e => e.stopPropagation()}>
            <h2>Menu</h2>
            <div className="menu-items">
              <button 
                onClick={() => handleMenuItemClick(onDailyPlanner)} 
                className="menu-item"
              >
                Daily Planner
              </button>
              <button 
                onClick={() => handleMenuItemClick(onSetGoals)} 
                className="menu-item"
              >
                Set Goals
              </button>
              <button 
                onClick={() => handleMenuItemClick(onStatistics)} 
                className="menu-item"
              >
                Statistics
              </button>
              <button 
                onClick={() => handleMenuItemClick(onNewDay)} 
                className="menu-item danger"
              >
                New Day
              </button>
              <button 
                onClick={() => handleMenuItemClick(onClearData)} 
                className="menu-item danger"
              >
                Clear All Data
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Menu; 