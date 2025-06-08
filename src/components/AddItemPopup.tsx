import React, { useState, useEffect } from 'react';
import { TimeType, TaskQuality, AddItemFormData, ColumnItem } from '../types/index';
import '../styles/notion.css';

interface AddItemPopupProps {
  onConfirm: (data: AddItemFormData) => void;
  onCancel: () => void;
  initialData?: ColumnItem;
  selectedDate: Date;
  selectedProjectId: string;
}

const AddItemPopup: React.FC<AddItemPopupProps> = ({ 
  onConfirm, 
  onCancel, 
  initialData, 
  selectedDate,
  selectedProjectId 
}) => {
  const [formData, setFormData] = useState<AddItemFormData>({
    description: initialData?.description || '',
    timeType: initialData?.timeType || 'to-goal',
    taskQuality: initialData?.taskQuality as TaskQuality || 'C',
    estimatedMinutes: initialData?.estimatedMinutes || '',
    priority: initialData?.priority || 3,
    date: selectedDate,
    projectId: selectedProjectId
  });

  const [showProjectWarning, setShowProjectWarning] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        description: initialData.description || '',
        timeType: initialData.timeType,
        taskQuality: initialData.taskQuality as TaskQuality,
        estimatedMinutes: initialData.estimatedMinutes,
        priority: initialData.priority,
        date: initialData.date,
        projectId: initialData.projectId
      });
    }
  }, [initialData]);

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      date: selectedDate,
      projectId: selectedProjectId
    }));
  }, [selectedDate, selectedProjectId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedProjectId === 'all-projects') {
      setShowProjectWarning(true);
      return;
    }

    onConfirm({
      ...formData,
      estimatedMinutes: parseInt(formData.estimatedMinutes.toString()) || 0,
      priority: typeof formData.priority === 'string' ? parseInt(formData.priority) : formData.priority,
      date: selectedDate,
      projectId: selectedProjectId
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="popup-overlay" onClick={(e) => {
      if (e.target === e.currentTarget) onCancel();
    }}>
      <div className="popup-content" onClick={e => e.stopPropagation()}>
        <h2 className="popup-title">
          {initialData ? 'Edit Task' : 'Create a Task'} for {formatDate(selectedDate)}
        </h2>

        {showProjectWarning && (
          <div className="project-warning">
            Please select a specific project before creating a task.
          </div>
        )}

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
