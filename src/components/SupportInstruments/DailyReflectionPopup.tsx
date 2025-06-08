import React, { useState } from 'react';
import '../../styles/notion.css';

interface DailyReflectionPopupProps {
  onConfirm: (reflection: string) => void;
  onClose: () => void;
  stats: {
    todayXP: number;
    todayMinutes: number;
    todayPureMinutes: number;
  };
}

const DailyReflectionPopup: React.FC<DailyReflectionPopupProps> = ({ onConfirm, onClose, stats }) => {
  const [reflection, setReflection] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(reflection);
  };

  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <h2>Daily Reflection</h2>
        <div className="reflection-stats">
          <p>Today's achievements:</p>
          <ul>
            <li>XP earned: {stats.todayXP}</li>
            <li>Total time: {stats.todayMinutes}m</li>
            <li>Pure focus time: {stats.todayPureMinutes}m</li>
          </ul>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Share your thoughts about today (+2 XP)</label>
            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="What went well? What could be improved? Any insights?"
              className="full-width"
            />
          </div>
          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-button">
              Skip
            </button>
            <button 
              type="submit" 
              className="confirm-button"
              disabled={!reflection.trim()}
            >
              Submit (+2 XP)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DailyReflectionPopup; 