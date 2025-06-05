import React from 'react';
import { ColumnItem, TaskQuality } from '../types';
import '../styles/notion.css';

interface XPCalculationPopupProps {
  item: ColumnItem;
  onClose: () => void;
}

const XPCalculationPopup: React.FC<XPCalculationPopupProps> = ({ item, onClose }) => {
  const getMultiplierClass = (type: string, value: number) => {
    switch (type) {
      case 'quality':
        return value === 4 ? 'multiplier-max' : 
               value === 3 ? 'multiplier-partial' : 
               'multiplier-none';
      case 'priority':
        return value === 1.5 ? 'multiplier-max' : 
               value === 1.4 ? 'multiplier-partial' : 
               value === 1.3 ? 'multiplier-partial' :
               'multiplier-none';
      case 'timeQuality':
        return value > 1 ? 'multiplier-max' : 'multiplier-none';
      case 'accuracy':
        return value === 1 ? 'multiplier-max' : 'multiplier-none';
      default:
        return '';
    }
  };

  const actualDuration = item.actualDuration || 0;
  const estimatedMinutes = typeof item.estimatedMinutes === 'string' 
    ? parseInt(item.estimatedMinutes) 
    : item.estimatedMinutes;

  // Base XP calculation
  const baseXP = Math.floor(actualDuration / 20);

  // Multipliers
  const qualityMultiplier = {
    'A': 4,
    'B': 3,
    'C': 2,
    'D': 1,
  }[item.taskQuality] || 1;

  const timeQualityMultiplier = item.timeQuality === 'pure' ? 1.5 : 1;

  const priorityMultiplier = {
    1: 1.5, 
    2: 1.4,
    3: 1.3,
    4: 1,
    5: 1,
    6: 1,
    7: 1,
    8: 1,
    9: 1,
    10: 1,
  }[item.priority] || 1;

  const accuracyMultiplier = (() => {
    if (actualDuration === 0 || estimatedMinutes === 0) return 1;
    const ratio = actualDuration / estimatedMinutes;
    if (ratio > 1.2 || ratio < 0.5) {
      return 0.7;
    }
    return 1;
  })();

  const finalXP = Math.round(
    baseXP * 
    qualityMultiplier * 
    timeQualityMultiplier * 
    priorityMultiplier * 
    accuracyMultiplier
  );

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-content xp-calculation" onClick={e => e.stopPropagation()}>
        <h2>XP Calculation</h2>
        <div className="xp-breakdown">
          <div className="xp-row">
            <span>Base XP (20min = 1pt)</span>
            <span>{baseXP} XP</span>
          </div>
          <div className={`xp-row ${getMultiplierClass('quality', qualityMultiplier)}`}>
            <span>Quality Multiplier ({item.taskQuality})</span>
            <span>×{qualityMultiplier.toFixed(2)}</span>
          </div>
          <div className={`xp-row ${getMultiplierClass('timeQuality', timeQualityMultiplier)}`}>
            <span>Time Quality ({item.timeQuality})</span>
            <span>×{timeQualityMultiplier.toFixed(1)}</span>
          </div>
          <div className={`xp-row ${getMultiplierClass('priority', priorityMultiplier)}`}>
            <span>Priority (#{item.priority})</span>
            <span>×{priorityMultiplier.toFixed(1)}</span>
          </div>
          <div className={`xp-row ${getMultiplierClass('accuracy', accuracyMultiplier)}`}>
            <span>Accuracy Multiplier</span>
            <span>×{accuracyMultiplier.toFixed(1)}</span>
          </div>
          <div className="xp-total">
            <span>Total</span>
            <span>{finalXP} XP</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default XPCalculationPopup; 



  // {timeXP > 0 ? '+' : ''}{timeXP}