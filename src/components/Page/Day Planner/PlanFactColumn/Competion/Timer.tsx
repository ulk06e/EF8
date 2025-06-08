import React, { useState, useEffect } from 'react';
import { ColumnItem } from '../../../../../types';
import '../../../../../styles/notion.css';

interface TimerProps {
  item: ColumnItem;
  onFail: () => void;
  onFinish: (actualDuration: number, isPure: boolean) => void;
  onClose: () => void;
}

const Timer: React.FC<TimerProps> = ({ item, onFail, onFinish, onClose }) => {
  const estimatedMinutesNum = typeof item.estimatedMinutes === 'string' 
    ? parseInt(item.estimatedMinutes) 
    : item.estimatedMinutes;

  const [remainingTime, setRemainingTime] = useState(estimatedMinutesNum * 60);
  const [isPure, setIsPure] = useState(true);
  const [isRunning, setIsRunning] = useState(true);
  const [startTime] = useState(new Date());
  const [totalPausedTime, setTotalPausedTime] = useState(0);
  const [pauseStartTime, setPauseStartTime] = useState<number | null>(null);
  const [lastTickTime, setLastTickTime] = useState(Date.now());

  useEffect(() => {
    if (!isRunning) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, store the current time
        setLastTickTime(Date.now());
      } else {
        // Page is visible again, calculate missed time
        const now = Date.now();
        const missedTime = Math.floor((now - lastTickTime) / 1000);
        setRemainingTime(prev => prev - missedTime);
        setLastTickTime(now);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    const timer = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - lastTickTime) / 1000);
      setLastTickTime(now);
      setRemainingTime(prev => prev - elapsed);
    }, 1000);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isRunning, lastTickTime]);

  const formatTime = (seconds: number) => {
    const isNegative = seconds < 0;
    const absSeconds = Math.abs(seconds);
    const minutes = Math.floor(absSeconds / 60);
    const secs = absSeconds % 60;
    return `${isNegative ? '-' : ''}${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePause = () => {
    setIsRunning(false);
    setPauseStartTime(Date.now());
    setIsPure(false);
  };

  const handleContinue = () => {
    setIsRunning(true);
    setLastTickTime(Date.now());
    if (pauseStartTime) {
      setTotalPausedTime(prev => prev + (Date.now() - pauseStartTime));
    }
    setPauseStartTime(null);
  };

  const handleFinish = () => {
    const endTime = new Date();
    const actualDuration = Math.ceil(
      ((endTime.getTime() - startTime.getTime()) - totalPausedTime) / (1000 * 60)
    );
    const totalDuration = remainingTime <= 0 
      ? estimatedMinutesNum + Math.abs(Math.floor(remainingTime / 60))
      : actualDuration;
    onFinish(totalDuration, isPure);
  };

  return (
    <div className="timer-overlay">
      <div className="timer-content">
        <h3>{item.description}</h3>
        <div className={`timer-display ${remainingTime < 0 ? 'negative' : ''}`}>
          {formatTime(remainingTime)}
        </div>
        <div className="timer-controls">
          <button onClick={onFail} className="fail-button">
            Fail
          </button>
          <button 
            onClick={isRunning ? handlePause : handleContinue}
            className={`pause-button ${!isRunning ? 'paused' : ''}`}
          >
            {isRunning ? 'Pause' : 'Continue'}
          </button>
          <button onClick={handleFinish} className="complete-button">
            Complete
          </button>
        </div>
      </div>
    </div>
  );
};

export default Timer; 