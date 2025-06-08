import React from 'react';
import { Stats } from '../../../../types';

interface DashboardProps {
  stats: Stats;
}

const Dashboard: React.FC<DashboardProps> = ({ stats }) => {
  return (
    <div className="dashboard">
      <h2 className='dashboard-title'>Dashboard</h2>
      <div className="stats-grid">
        <div className="stat-item">
          <span className="stat-label">Today</span>
          <div className="stat-value-container">
            <span className="stat-value">{stats.todayXP} XP</span>
            <span className="stat-best">Best: {stats.bestDayXP} XP 🔥</span>
          </div>
        </div>
        <div className="stat-item">
          <span className="stat-label">Tracked time</span>
          <div className="stat-value-container">
            <span className="stat-value">{stats.todayMinutes}m</span>
            <span className="stat-best">Best: {stats.bestMinutes}m 🔥</span>
          </div>
        </div>
        <div className="stat-item">
          <span className="stat-label">Streak</span>
          <div className="stat-value-container">
            <span className="streak-value">🔥 {stats.streak} days</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 