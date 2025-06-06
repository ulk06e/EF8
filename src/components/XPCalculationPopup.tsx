import React from 'react';
import { ColumnItem } from '../types';
import '../styles/notion.css';

interface XPCalculationPopupProps {
  item: ColumnItem;
  onClose: () => void;
}

const XPCalculationPopup: React.FC<XPCalculationPopupProps> = ({ item, onClose }) => {
  const baseXP = Math.floor(item.actualDuration! / 20);
  const qualityMultiplier = { A: 4, B: 3, C: 2, D: 1 }[item.taskQuality];
  const timeQualityMultiplier = item.timeQuality === 'pure' ? 1.5 : 1;
  const priorityMultiplier = { 1: 1.5, 2: 1.4, 3: 1.3, 7: 1.5, 8: 1.4, 9: 1.3, 10: 1.2 }[item.priority] || 1;
  const prePlannedMultiplier = item.wasPrePlanned ? 1.3 : 1;
  
  const estimatedMinutes = typeof item.estimatedMinutes === 'string' 
    ? parseInt(item.estimatedMinutes) 
    : item.estimatedMinutes;
  
  const durationRatio = item.actualDuration! / estimatedMinutes;
  const accuracyMultiplier = (durationRatio > 1.2 || durationRatio < 0.5) ? 0.7 : 1;

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-content xp-calculation" onClick={e => e.stopPropagation()}>
        <h3>XP Calculation</h3>
        <div className="xp-breakdown">
          <div className="xp-row">
            <span>Base XP (1 per 20min)</span>
            <span>{baseXP}</span>
          </div>
          
          <div className={`xp-row multiplier-${qualityMultiplier === 4 ? 'max' : qualityMultiplier >= 2 ? 'partial' : 'none'}`}>
            <span>Quality ({item.taskQuality})</span>
            <span>×{qualityMultiplier}</span>
          </div>

          {item.timeQuality === 'pure' && (
            <div className="xp-row multiplier-max">
              <span>Pure Time Bonus</span>
              <span>×1.5</span>
            </div>
          )}

          {(item.priority <= 3 || item.priority >= 7) && (
            <div className="xp-row multiplier-partial">
              <span>Priority #{item.priority}</span>
              <span>×{priorityMultiplier}</span>
            </div>
          )}

          {item.wasPrePlanned && (
            <div className="xp-row multiplier-max">
              <span>Pre-planned Bonus</span>
              <span>×1.3</span>
            </div>
          )}

          {accuracyMultiplier < 1 && (
            <div className="xp-row multiplier-none">
              <span>Accuracy Penalty</span>
              <span>×0.7</span>
            </div>
          )}

          <div className="xp-total">
            <span>Total XP</span>
            <span>{item.xpValue}</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default XPCalculationPopup; 

