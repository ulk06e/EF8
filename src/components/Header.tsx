import React from 'react';
import { Stats } from '../types';

interface HeaderProps {
  stats: Stats;
}

const Header: React.FC<HeaderProps> = ({ stats }) => {
  const progressPercentage = (stats.currentXP / stats.nextLevelXP) * 100;

  return (
    <header className="header">
      <h1>Plan Tracker</h1>
      <div className="xp-info">
        <div className="level-info">
          <span>Level {stats.currentLevel}</span>
          <span>{stats.currentXP} / {stats.nextLevelXP} XP</span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-bar-fill" 
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
    </header>
  );
};

export default Header; 