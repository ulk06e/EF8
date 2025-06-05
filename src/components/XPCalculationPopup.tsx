import React from 'react';
import { ColumnItem } from '../types';
import '../styles/notion.css';

interface XPCalculationPopupProps {
  item: ColumnItem;
  onClose: () => void;
}

const XPCalculationPopup: React.FC<XPCalculationPopupProps> = ({ item, onClose }) => {
  const getQualityXP = (quality: string) => {
    const map = { 'A': 8, 'B': 4, 'C': 2, 'D': 1 };
    return map[quality as keyof typeof map] || 0;
  };

  const getMultiplierClass = (value: number, maxValue: number) => {
    if (value === 0) return 'multiplier-none';
    if (value === maxValue) return 'multiplier-max';
    return 'multiplier-partial';
  };

  const qualityXP = getQualityXP(item.taskQuality);
  const focusBonus = item.timeQuality === 'pure' ? 3 : 0;
  const priorityBonus = item.priority === 1 ? 3 : item.priority === 2 ? 1 : 0;
  const planBonus = item.columnOrigin === 'plan' ? 2 : 0;
  
  const actualDuration = item.actualDuration || 0;
  const estimatedMinutes = typeof item.estimatedMinutes === 'string' 
    ? parseInt(item.estimatedMinutes) 
    : item.estimatedMinutes;

  const timeXP = item.taskQuality === 'A' || item.taskQuality === 'B'
    ? Math.floor(actualDuration / 10)
    : actualDuration > estimatedMinutes
    ? -Math.floor((actualDuration - estimatedMinutes) / 10)
    : 0;

  const efficiencyBonus = (item.taskQuality === 'A' || item.taskQuality === 'B') && actualDuration < estimatedMinutes
    ? Math.floor((estimatedMinutes - actualDuration) / 15)
    : 0;

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-content xp-calculation" onClick={e => e.stopPropagation()}>
        <h2>XP Calculation</h2>
        <div className="xp-breakdown">
          <div className={`xp-row ${getMultiplierClass(qualityXP, 8)}`}>
            <span>Task Quality ({item.taskQuality})</span>
            <span>+{qualityXP} XP</span>
          </div>
          <div className={`xp-row ${getMultiplierClass(focusBonus, 3)}`}>
            <span>Focus Quality ({item.timeQuality})</span>
            <span>+{focusBonus} XP</span>
          </div>
          <div className={`xp-row ${getMultiplierClass(priorityBonus, 3)}`}>
            <span>Priority (#{item.priority})</span>
            <span>+{priorityBonus} XP</span>
          </div>
          <div className={`xp-row ${getMultiplierClass(planBonus, 2)}`}>
            <span>Plan Bonus</span>
            <span>+{planBonus} XP</span>
          </div>
          <div className={`xp-row ${getMultiplierClass(timeXP, Math.floor(actualDuration / 10))}`}>
            <span>Time XP ({actualDuration}m)</span>
            <span>{timeXP > 0 ? '+' : ''}{timeXP} XP</span>
          </div>
          <div className={`xp-row ${getMultiplierClass(efficiencyBonus, Math.floor((estimatedMinutes - actualDuration) / 15))}`}>
            <span>Efficiency Bonus</span>
            <span>+{efficiencyBonus} XP</span>
          </div>
          <div className="xp-total">
            <span>Total</span>
            <span>+{item.xpValue} XP</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default XPCalculationPopup; 