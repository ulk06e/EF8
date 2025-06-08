import React from 'react';

interface FailurePopupProps {
  onDelete: () => void;
  onRepeat: () => void;
  onClose: () => void;
}

const FailurePopup: React.FC<FailurePopupProps> = ({ onDelete, onRepeat, onClose }) => {
  return (
    <div className="popup-overlay">
      <div className="popup-content failure-popup">
        <h3>Task Failed</h3>
        <p>What would you like to do with this task?</p>
        <div className="failure-actions">
          <button onClick={onDelete} className="delete-button">
            Delete Task
          </button>
          <button onClick={onRepeat} className="repeat-button">
            Repeat Task
          </button>
        </div>
      </div>
    </div>
  );
};

export default FailurePopup; 