import React from 'react';
import { Stats } from '../types';
import '../styles/notion.css';

interface GoalsProps {
  stats: Stats;
}

const Goals: React.FC<GoalsProps> = ({ stats }) => {
  return (
    <div className="container">
      <div className="columns-container">
        <div className="column">
          <div className="column-header">
            <h2>Projects</h2>
            <button className="add-button">Add</button>
          </div>
          <div className="column-items">
            {/* Projects will be added here */}
          </div>
        </div>
        <div className="column">
          <div className="column-header">
            <h2>Tasks</h2>
            <button className="add-button">Add</button>
          </div>
          <div className="column-items">
            {/* Tasks will be added here */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Goals; 