import React, { useState, useEffect } from 'react';
import { TimeType, TaskQuality, AddItemFormData, ColumnItem } from '../types';
import '../styles/notion.css';

interface AddItemPopupProps {
  onConfirm: (data: AddItemFormData) => void;
  onCancel: () => void;
  initialData?: ColumnItem;
}

const AddItemPopup: React.FC<AddItemPopupProps> = ({ onConfirm, onCancel, initialData }) => {
  const [formData, setFormData] = useState<AddItemFormData>({
    description: '',
    timeType: 'to-goal',
    taskQuality: 'A',
    estimatedMinutes: '',
    priority: 1,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        description: initialData.description,
        timeType: initialData.timeType,
        taskQuality: initialData.taskQuality,
        estimatedMinutes: initialData.estimatedMinutes,
        priority: initialData.priority,
      });
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({
      ...formData,
      estimatedMinutes: parseInt(formData.estimatedMinutes as string) || 0
    });
  };

  return (
    <div className="popup-overlay" onClick={(e) => {
      if (e.target === e.currentTarget) onCancel();
    }}>
      <div className="popup-content" onClick={e => e.stopPropagation()}>
        <h2 className="popup-title">{initialData ? 'Edit Task' : 'Create a Task'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <textarea
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              className="full-width"
            />
          </div>
          
          <div className="form-row">
            <select
              value={formData.timeType}
              onChange={(e) => setFormData({ ...formData, timeType: e.target.value as TimeType })}
              className="full-width"
            >
              <option value="to-goal">To Goal</option>
              <option value="to-time">To Time</option>
            </select>

            <select
              value={formData.taskQuality}
              onChange={(e) => setFormData({ ...formData, taskQuality: e.target.value as TaskQuality })}
              className="full-width"
            >
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
            </select>
          </div>

          <div className="form-row">
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
              className="full-width"
            >
              {[...Array(10)].map((_, i) => (
                <option key={i + 1} value={i + 1}>#{i + 1}</option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Estimated minutes"
              value={formData.estimatedMinutes}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, '');
                setFormData({ ...formData, estimatedMinutes: value });
              }}
              required
              className="full-width"
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={onCancel} className="cancel-button">
              Cancel
            </button>
            <button type="submit" className="confirm-button">
              {initialData ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddItemPopup; 