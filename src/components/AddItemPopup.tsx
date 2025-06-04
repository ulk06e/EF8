import React, { useState } from 'react';
import { TimeType, TaskQuality, Area, AddItemFormData } from '../types';
import '../styles/notion.css';

interface AddItemPopupProps {
  onConfirm: (data: AddItemFormData) => void;
  onCancel: () => void;
}

const AddItemPopup: React.FC<AddItemPopupProps> = ({ onConfirm, onCancel }) => {
  const [formData, setFormData] = useState<AddItemFormData>({
    description: '',
    timeType: 'to-goal',
    taskQuality: 'A',
    estimatedMinutes: '',
    area: 'Noesis',
    priority: 1,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted with data:', formData);
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
        <h2 className="popup-title">Create a Task</h2>
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
            >
              <option value="to-goal">To Goal</option>
              <option value="to-time">To Time</option>
            </select>

            <select
              value={formData.taskQuality}
              onChange={(e) => setFormData({ ...formData, taskQuality: e.target.value as TaskQuality })}
            >
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
            </select>

            <select
              value={formData.area}
              onChange={(e) => setFormData({ ...formData, area: e.target.value as Area })}
            >
              <option value="Noesis">Noesis</option>
              <option value="Grace">Grace</option>
              <option value="Rete">Rete</option>
              <option value="Panoptic">Panoptic</option>
            </select>
          </div>

          <div className="form-row">
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
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
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={onCancel} className="cancel-button">
              Cancel
            </button>
            <button type="submit" className="confirm-button">
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddItemPopup; 