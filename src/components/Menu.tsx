import React from 'react';
import '../styles/notion.css';

interface MenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNewDay: () => void;
  onClearData: () => void;
  onStatistics: () => void;
  onDailyPlanner: () => void;
  currentPage: 'statistics' | 'planner';
}

const Menu: React.FC<MenuProps> = ({
  isOpen,
  onClose,
  onNewDay,
  onClearData,
  onStatistics,
  onDailyPlanner,
  currentPage,
}) => {
  if (!isOpen) return null;

  return (
    <div className="menu-overlay" onClick={onClose}>
      <div className="menu-content" onClick={e => e.stopPropagation()}>
        <h2>Menu</h2>
        <div className="menu-items">
          <button
            className={`menu-item ${currentPage === 'planner' ? 'active' : ''}`}
            onClick={() => {
              onDailyPlanner();
              onClose();
            }}
          >
            Daily Planner
          </button>
          <button
            className={`menu-item ${currentPage === 'statistics' ? 'active' : ''}`}
            onClick={() => {
              onStatistics();
              onClose();
            }}
          >
            Statistics
          </button>
          <button className="menu-item danger" onClick={onClearData}>
            Clear All Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default Menu; 