import React from 'react';
import { ColumnItem } from '../../../../../types';
import { calculateXP } from '../../../../../utils/xp';
import '../../../../../styles/notion.css';

interface XPCalculationPopupProps {
  item: ColumnItem;
  onClose: () => void;
}

const XPCalculationPopup: React.FC<XPCalculationPopupProps> = ({ item, onClose }) => {
  // Calculate XP using the centralized function
  const xp = calculateXP(
    item.taskQuality,
    item.timeQuality || 'not-pure',
    typeof item.priority === 'string' ? parseInt(item.priority) : item.priority,
    item.columnOrigin,
    item.actualDuration || 0,
    Number(item.estimatedMinutes),
    false // removed pre-planned bonus
  );

  // Base XP calculation (1 point per 10 minutes)
  const baseXP = Math.floor((item.actualDuration || 0) / 10);

  // Helper function to determine quality multiplier class
  const getQualityClass = (quality: string) => {
    switch (quality) {
      case 'A': return 'multiplier-max';
      case 'B': return 'multiplier-partial';
      default: return 'multiplier-none';
    }
  };

  // Helper function to determine priority multiplier class
  const getPriorityClass = (priority: number) => {
    if (priority === 1) return 'multiplier-max';
    if (priority === 2 || priority === 3) return 'multiplier-partial';
    return 'multiplier-none';
  };

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-content xp-calculation" onClick={e => e.stopPropagation()}>
        <h3>XP Calculation</h3>
        <div className="xp-breakdown">
          <div className="xp-row">
            <span>Base XP (1 per 10min)</span>
            <span>{baseXP}</span>
          </div>
          
          {/* Quality multiplier - always shown */}
          <div className={`xp-row ${getQualityClass(item.taskQuality)}`}>
            <span>Quality ({item.taskQuality})</span>
            <span>×{item.taskQuality === 'A' ? '4' : item.taskQuality === 'B' ? '3' : item.taskQuality === 'C' ? '2' : '1'}</span>
          </div>

          {/* Pure Time multiplier - always shown */}
          <div className={`xp-row ${item.timeQuality === 'pure' ? 'multiplier-max' : 'multiplier-none'}`}>
            <span>Pure Time Bonus</span>
            <span>×{item.timeQuality === 'pure' ? '1.5' : '1'}</span>
          </div>

          {/* Priority multiplier - always shown */}
          <div className={`xp-row ${getPriorityClass(typeof item.priority === 'string' ? parseInt(item.priority) : item.priority)}`}>
            <span>Priority #{item.priority}</span>
            <span>×{item.priority === 1 ? '1.5' : item.priority === 2 ? '1.4' : item.priority === 3 ? '1.3' : '1'}</span>
          </div>

          {/* Accuracy multiplier - always shown */}
          <div className={`xp-row ${
            !(item.actualDuration && item.estimatedMinutes && 
              (item.actualDuration / Number(item.estimatedMinutes) > 1.2 || 
               item.actualDuration / Number(item.estimatedMinutes) < 0.5)) ? 'multiplier-max' : 'multiplier-none'
          }`}>
            <span>Accuracy Multiplier</span>
            <span>×{(item.actualDuration && item.estimatedMinutes && 
                   (item.actualDuration / Number(item.estimatedMinutes) > 1.2 || 
                    item.actualDuration / Number(item.estimatedMinutes) < 0.5)) ? '0.7' : '1'}</span>
          </div>

          <div className="xp-total">
            <span>Total XP</span>
            <span>{xp}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default XPCalculationPopup; 