import React, { useState } from 'react';
import { Project } from '../types/index';
import '../styles/notion.css';

interface ProjectsProps {
  onAddProject: (name: string) => void;
  onDeleteProject?: (id: string) => void;
  onProjectSelect?: (id: string) => void;
  projects: Project[];
  selectedProjectId: string;
}

const Projects: React.FC<ProjectsProps> = ({ 
  onAddProject, 
  onDeleteProject, 
  onProjectSelect,
  projects,
  selectedProjectId 
}) => {
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

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

  const handleProjectClick = (projectId: string) => {
    if (onProjectSelect) {
      onProjectSelect(projectId);
    }
  };

  const handleProjectDoubleClick = (projectId: string) => {
    if (projectId === 'all-projects' || projectId === 'other-projects') return; // Prevent deletion of default projects
    
    if (onDeleteProject && window.confirm('Are you sure you want to delete this project?')) {
      onDeleteProject(projectId);
    }
  };

  const calculateProgress = (current: number, next: number) => {
    return (current / next) * 100;
  };

  const sortProjects = (projectsList: Project[]) => {
    const allProjects = projectsList.find(p => p.id === 'all-projects');
    const otherProjects = projectsList.find(p => p.id === 'other-projects');
    const regularProjects = projectsList.filter(p => 
      p.id !== 'all-projects' && p.id !== 'other-projects'
    ).sort((a, b) => {
      if (a.currentLevel !== b.currentLevel) {
        return b.currentLevel - a.currentLevel;
      }
      return b.currentXP - a.currentXP;
    });

    return [
      ...(allProjects ? [allProjects] : []),
      ...regularProjects,
      ...(otherProjects ? [otherProjects] : [])
    ];
  };

  const sortedProjects = sortProjects(projects);

  return (
    <div className="dashboard">
      <div className="column-header">
        <h2>Projects</h2>
        <button onClick={handleAddClick} className="add-button">Add Project</button>
      </div>

      <div className="projects-list">
        {sortedProjects.map((project) => (
          <div 
            key={project.id} 
            className={`column-item ${project.id === selectedProjectId ? 'selected-project' : ''} ${
              project.id === 'all-projects' ? 'all-projects' : ''
            }`}
            onClick={() => handleProjectClick(project.id)}
            onDoubleClick={() => handleProjectDoubleClick(project.id)}
          >
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