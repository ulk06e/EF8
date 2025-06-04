import React from 'react';
import { Stats } from '../types';

interface DashboardProps {
  stats: Stats;
}

const Dashboard: React.FC<DashboardProps> = ({ stats }) => {
  return (
    <div className="dashboard">
      <h2>Dashboard</h2>
      <div className="stats-grid">
        <div className="stat-item">
          <span className="stat-label">Today</span>
          <span className="stat-value">{stats.todayXP} XP / {stats.bestDayXP} XP🔥</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Tracked time</span>
          <span className="stat-value">{stats.todayMinutes}m / {stats.bestMinutes}m🔥</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Pure time</span>
          <span className="stat-value">{stats.todayPureMinutes}m / {stats.bestPureMinutes}m🔥</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Streak</span>
          <span className="streak-value">🔥{stats.streak} days</span>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 