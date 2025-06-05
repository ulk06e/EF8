import React from 'react';
import '../styles/notion.css';

interface MenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNewDay: () => void;
  onClearData: () => void;
  onStatistics: () => void;
}

const Menu: React.FC<MenuProps> = ({ isOpen, onClose, onNewDay, onClearData, onStatistics }) => {
  return (
    <>
      {isOpen && (
        <div className="menu-overlay" onClick={onClose}>
          <div className="menu-content" onClick={e => e.stopPropagation()}>
            <h2>Menu</h2>
            <div className="menu-items">
              <button onClick={onNewDay} className="menu-item">
                New Day
              </button>
              <button onClick={onStatistics} className="menu-item">
                Statistics
              </button>
              <button onClick={onClearData} className="menu-item danger">
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