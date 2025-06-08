import React from 'react';
import '../styles/notion.css';

const ProjectColumns: React.FC = () => {
  return (
    <div className="projects-tasks-container">
      <div className="project-column">
        <div className="column-header">
          <h2>Projects</h2>
          <button className="add-button" disabled>Add</button>
        </div>
      </div>
      <div className="tasks-column">
        <div className="column-header">
          <h2>Tasks</h2>
          <button className="add-button" disabled>Add</button>
        </div>
      </div>
    </div>
  );
};

export default ProjectColumns; 