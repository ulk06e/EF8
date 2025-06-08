import React from 'react';
import { Stats } from '../../../types';
import '../../../styles/notion.css';

interface HeaderProps {
  stats: Stats;
  onTitleClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ stats, onTitleClick }) => {
  const progressPercentage = (stats.currentXP / stats.nextLevelXP) * 100;

  return (
    <div className="header">
      <h1 onClick={onTitleClick} className="clickable-title">Game's Pace</h1>
      <div className="level-block">
        <span>Level {stats.currentLevel}</span>
        <div className="progress-bar">
          <div 
            className="progress-bar-fill" 
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <span>{stats.currentXP} / {stats.nextLevelXP} XP</span>
      </div>
    </div>
  );
};

export default Header; 