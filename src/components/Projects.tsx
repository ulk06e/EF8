import React, { useState } from 'react';
import { Project } from '../types/index';
import '../styles/notion.css';

interface ProjectsProps {
  onAddProject: (name: string) => void;
}

const Projects: React.FC<ProjectsProps> = ({ onAddProject }) => {
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  // Default projects
  const defaultProjects: Project[] = [
    {
      id: 'all-projects',
      name: 'All Projects',
      currentXP: 150,
      nextLevelXP: 200,
      currentLevel: 2,
      taskIds: []
    },
    {
      id: 'other-projects',
      name: 'Other Projects',
      currentXP: 75,
      nextLevelXP: 100,
      currentLevel: 1,
      taskIds: []
    }
  ];

  const handleAddClick = () => {
    setShowAddPopup(true);
  };

  const handleConfirm = () => {
    if (newProjectName.trim()) {
      onAddProject(newProjectName.trim());
      setNewProjectName('');
      setShowAddPopup(false);
    }
  };

  const calculateProgress = (current: number, next: number) => {
    return (current / next) * 100;
  };

  return (
    <div className="dashboard">
      <div className="column-header">
        <h2>Projects</h2>
        <button onClick={handleAddClick} className="add-button">Add Project</button>
      </div>

      <div className="projects-list">
        {defaultProjects.map((project) => (
          <div key={project.id} className="column-item">
            <div className="project-header">
              <div className="project-name">{project.name}</div>
              <div className="project-level">Level {project.currentLevel}</div>
            </div>
            <div className="project-progress">
              <div className="progress-bar">
                <div 
                  className="progress-bar-fill"
                  style={{ width: `${calculateProgress(project.currentXP, project.nextLevelXP)}%` }}
                />
              </div>
              <div className="project-xp">
                {project.currentXP} / {project.nextLevelXP} XP
              </div>
            </div>
          </div>
        ))}
      </div>

      {showAddPopup && (
        <div className="popup-overlay">
          <div className="popup-content">
            <h3>New Project</h3>
            <div className="form-group">
              <input
                type="text"
                className="full-width"
                placeholder="Project name"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleConfirm()}
              />
            </div>
            <div className="form-actions">
              <button className="cancel-button" onClick={() => setShowAddPopup(false)}>
                Cancel
              </button>
              <button className="confirm-button" onClick={handleConfirm}>
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects; 