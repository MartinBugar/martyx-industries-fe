import React, { useState, useRef } from 'react';
import './BuildProgressTracker.css';

interface BuildStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  timeSpent?: number; // minutes
  photos?: string[];
  problems?: BuildProblem[];
}

interface BuildProblem {
  id: string;
  description: string;
  solution?: string;
  severity: 'low' | 'medium' | 'high';
  resolved: boolean;
  timestamp: Date;
}

interface BuildProject {
  id: string;
  name: string;
  modelName: string;
  startDate: Date;
  totalTimeSpent: number;
  steps: BuildStep[];
  status: 'not_started' | 'in_progress' | 'completed' | 'paused';
  completionPercentage: number;
}

const BuildProgressTracker: React.FC = () => {
  const [projects, setProjects] = useState<BuildProject[]>([]);
  const [activeProject, setActiveProject] = useState<string | null>(null);
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  const [timer, setTimer] = useState<{ isRunning: boolean; startTime: Date | null; stepId: string | null }>({
    isRunning: false,
    startTime: null,
    stepId: null
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createNewProject = (name: string, modelName: string) => {
    const defaultSteps: BuildStep[] = [
      { id: '1', title: 'Parts Inspection', description: 'Check all parts and components', completed: false },
      { id: '2', title: 'Surface Preparation', description: 'Clean and prepare surfaces', completed: false },
      { id: '3', title: 'Assembly - Main Body', description: 'Assemble main body components', completed: false },
      { id: '4', title: 'Detail Work', description: 'Add detail parts and accessories', completed: false },
      { id: '5', title: 'Painting/Finishing', description: 'Apply paint and final finish', completed: false },
      { id: '6', title: 'Final Assembly', description: 'Complete final assembly and testing', completed: false }
    ];

    const newProject: BuildProject = {
      id: Date.now().toString(),
      name,
      modelName,
      startDate: new Date(),
      totalTimeSpent: 0,
      steps: defaultSteps,
      status: 'not_started',
      completionPercentage: 0
    };

    setProjects([...projects, newProject]);
    setActiveProject(newProject.id);
    setShowNewProjectForm(false);
  };

  const startTimer = (stepId: string) => {
    setTimer({
      isRunning: true,
      startTime: new Date(),
      stepId
    });
  };

  const stopTimer = () => {
    if (timer.isRunning && timer.startTime && timer.stepId && activeProject) {
      const timeSpent = Math.floor((new Date().getTime() - timer.startTime.getTime()) / (1000 * 60));

      setProjects(projects.map(project => {
        if (project.id === activeProject) {
          return {
            ...project,
            totalTimeSpent: project.totalTimeSpent + timeSpent,
            steps: project.steps.map(step => {
              if (step.id === timer.stepId) {
                return {
                  ...step,
                  timeSpent: (step.timeSpent || 0) + timeSpent
                };
              }
              return step;
            })
          };
        }
        return project;
      }));
    }

    setTimer({ isRunning: false, startTime: null, stepId: null });
  };

  const toggleStepCompletion = (stepId: string) => {
    if (!activeProject) return;

    setProjects(projects.map(project => {
      if (project.id === activeProject) {
        const updatedSteps = project.steps.map(step =>
          step.id === stepId ? { ...step, completed: !step.completed } : step
        );

        const completedSteps = updatedSteps.filter(step => step.completed).length;
        const completionPercentage = Math.round((completedSteps / updatedSteps.length) * 100);

        return {
          ...project,
          steps: updatedSteps,
          completionPercentage,
          status: completionPercentage === 100 ? 'completed' :
                  completionPercentage > 0 ? 'in_progress' : 'not_started'
        };
      }
      return project;
    }));
  };

  const addPhotoToStep = (stepId: string, file: File) => {
    if (!activeProject) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const photoUrl = e.target?.result as string;

      setProjects(projects.map(project => {
        if (project.id === activeProject) {
          return {
            ...project,
            steps: project.steps.map(step => {
              if (step.id === stepId) {
                return {
                  ...step,
                  photos: [...(step.photos || []), photoUrl]
                };
              }
              return step;
            })
          };
        }
        return project;
      }));
    };
    reader.readAsDataURL(file);
  };

  const addProblemToStep = (stepId: string, description: string, severity: 'low' | 'medium' | 'high') => {
    if (!activeProject) return;

    const newProblem: BuildProblem = {
      id: Date.now().toString(),
      description,
      severity,
      resolved: false,
      timestamp: new Date()
    };

    setProjects(projects.map(project => {
      if (project.id === activeProject) {
        return {
          ...project,
          steps: project.steps.map(step => {
            if (step.id === stepId) {
              return {
                ...step,
                problems: [...(step.problems || []), newProblem]
              };
            }
            return step;
          })
        };
      }
      return project;
    }));
  };

  const currentProject = projects.find(p => p.id === activeProject);

  if (showNewProjectForm) {
    return (
      <div className="build-tracker">
        <NewProjectForm
          onSubmit={createNewProject}
          onCancel={() => setShowNewProjectForm(false)}
        />
      </div>
    );
  }

  return (
    <div className="build-tracker">
      <div className="tracker-header">
        <h2>Build Progress Tracker</h2>

        {projects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <h3>No Build Projects Yet</h3>
            <p>Start tracking your model building progress</p>
            <button
              className="create-project-btn"
              onClick={() => setShowNewProjectForm(true)}
            >
              Create First Project
            </button>
          </div>
        ) : (
          <>
            <div className="project-selector">
              <select
                value={activeProject || ''}
                onChange={(e) => setActiveProject(e.target.value)}
              >
                <option value="">Select a project...</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name} - {project.completionPercentage}% complete
                  </option>
                ))}
              </select>
              <button
                className="new-project-btn"
                onClick={() => setShowNewProjectForm(true)}
              >
                + New Project
              </button>
            </div>

            {currentProject && (
              <div className="project-details">
                <div className="project-info">
                  <h3>{currentProject.name}</h3>
                  <div className="project-meta">
                    <span className="model-name">{currentProject.modelName}</span>
                    <span className="status-badge status-{currentProject.status}">
                      {currentProject.status.replace('_', ' ')}
                    </span>
                    <span className="time-spent">
                      Total time: {Math.floor(currentProject.totalTimeSpent / 60)}h {currentProject.totalTimeSpent % 60}m
                    </span>
                  </div>

                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${currentProject.completionPercentage}%` }}
                    />
                    <span className="progress-text">{currentProject.completionPercentage}%</span>
                  </div>
                </div>

                <div className="steps-list">
                  {currentProject.steps.map(step => (
                    <div key={step.id} className={`step-card ${step.completed ? 'completed' : ''}`}>
                      <div className="step-header">
                        <div className="step-main">
                          <button
                            className="step-checkbox"
                            onClick={() => toggleStepCompletion(step.id)}
                          >
                            {step.completed ? '✓' : '○'}
                          </button>
                          <div className="step-info">
                            <h4>{step.title}</h4>
                            <p>{step.description}</p>
                            {step.timeSpent && (
                              <span className="time-spent">
                                Time spent: {Math.floor(step.timeSpent / 60)}h {step.timeSpent % 60}m
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="step-actions">
                          {timer.isRunning && timer.stepId === step.id ? (
                            <button className="timer-btn active" onClick={stopTimer}>
                              ⏸ Stop Timer
                            </button>
                          ) : (
                            <button
                              className="timer-btn"
                              onClick={() => startTimer(step.id)}
                              disabled={timer.isRunning}
                            >
                              ⏱ Start Timer
                            </button>
                          )}

                          <button
                            className="expand-btn"
                            onClick={() => setSelectedStep(selectedStep === step.id ? null : step.id)}
                          >
                            {selectedStep === step.id ? '▼' : '▶'}
                          </button>
                        </div>
                      </div>

                      {selectedStep === step.id && (
                        <StepDetails
                          step={step}
                          onAddPhoto={(file) => addPhotoToStep(step.id, file)}
                          onAddProblem={(desc, severity) => addProblemToStep(step.id, desc, severity)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files?.[0] && selectedStep) {
            addPhotoToStep(selectedStep, e.target.files[0]);
          }
        }}
      />
    </div>
  );
};

const NewProjectForm: React.FC<{
  onSubmit: (name: string, modelName: string) => void;
  onCancel: () => void;
}> = ({ onSubmit, onCancel }) => {
  const [name, setName] = useState('');
  const [modelName, setModelName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && modelName.trim()) {
      onSubmit(name.trim(), modelName.trim());
    }
  };

  return (
    <div className="new-project-form">
      <h3>Create New Build Project</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="projectName">Project Name</label>
          <input
            id="projectName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., My First Gundam Build"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="modelName">Model Name</label>
          <input
            id="modelName"
            type="text"
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            placeholder="e.g., RG RX-78-2 Gundam"
            required
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="create-btn">Create Project</button>
          <button type="button" className="cancel-btn" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </div>
  );
};

const StepDetails: React.FC<{
  step: BuildStep;
  onAddPhoto: (file: File) => void;
  onAddProblem: (description: string, severity: 'low' | 'medium' | 'high') => void;
}> = ({ step, onAddPhoto, onAddProblem }) => {
  const [showProblemForm, setShowProblemForm] = useState(false);
  const [problemDescription, setProblemDescription] = useState('');
  const [problemSeverity, setProblemSeverity] = useState<'low' | 'medium' | 'high'>('low');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddProblem = (e: React.FormEvent) => {
    e.preventDefault();
    if (problemDescription.trim()) {
      onAddProblem(problemDescription.trim(), problemSeverity);
      setProblemDescription('');
      setShowProblemForm(false);
    }
  };

  return (
    <div className="step-details">
      <div className="step-section">
        <h5>📸 Progress Photos</h5>
        <div className="photos-grid">
          {step.photos?.map((photo, index) => (
            <div key={index} className="photo-item">
              <img src={photo} alt={`Step progress ${index + 1}`} />
            </div>
          ))}
          <button
            className="add-photo-btn"
            onClick={() => fileInputRef.current?.click()}
          >
            + Add Photo
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => {
            if (e.target.files?.[0]) {
              onAddPhoto(e.target.files[0]);
            }
          }}
        />
      </div>

      <div className="step-section">
        <h5>⚠️ Problems & Issues</h5>
        {step.problems && step.problems.length > 0 ? (
          <div className="problems-list">
            {step.problems.map(problem => (
              <div key={problem.id} className={`problem-item severity-${problem.severity}`}>
                <div className="problem-header">
                  <span className="severity-badge">{problem.severity}</span>
                  <span className="problem-date">
                    {problem.timestamp.toLocaleDateString()}
                  </span>
                </div>
                <p className="problem-description">{problem.description}</p>
                {problem.solution && (
                  <div className="problem-solution">
                    <strong>Solution:</strong> {problem.solution}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="no-problems">No problems reported for this step</p>
        )}

        {showProblemForm ? (
          <form className="problem-form" onSubmit={handleAddProblem}>
            <textarea
              value={problemDescription}
              onChange={(e) => setProblemDescription(e.target.value)}
              placeholder="Describe the problem or issue..."
              required
            />
            <div className="problem-form-footer">
              <select
                value={problemSeverity}
                onChange={(e) => setProblemSeverity(e.target.value as 'low' | 'medium' | 'high')}
              >
                <option value="low">Low Severity</option>
                <option value="medium">Medium Severity</option>
                <option value="high">High Severity</option>
              </select>
              <div className="problem-form-actions">
                <button type="submit">Add Problem</button>
                <button type="button" onClick={() => setShowProblemForm(false)}>Cancel</button>
              </div>
            </div>
          </form>
        ) : (
          <button
            className="add-problem-btn"
            onClick={() => setShowProblemForm(true)}
          >
            + Report Problem
          </button>
        )}
      </div>
    </div>
  );
};

export default BuildProgressTracker;