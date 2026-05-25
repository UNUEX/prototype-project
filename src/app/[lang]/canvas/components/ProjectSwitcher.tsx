// app/canvas/components/ProjectSwitcher.tsx
// ИЗМЕНЕНИЯ: убран выбор режима 'master' при создании проекта.
// Проекты теперь создаются только в режиме 'constructor'.
// Мастер-режим вынесен на отдельную страницу /canvas/master.

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFolderOpen, faPlus, faChevronDown,
  faDiagramProject, faLayerGroup,
  faCheckCircle,
  faSpinner, faTrash,
  faPen, faClock,
  faTag,
} from '@fortawesome/free-solid-svg-icons';
import { CanvasProject, CanvasMode, MODES } from '../page.functional';
import { useTranslation } from '@/hooks/useTranslation';

interface ProjectSwitcherProps {
  projects: CanvasProject[];
  currentProjectId: string | null;
  onSwitchProject: (projectId: string) => void;
  onCreateProject: (name: string, description?: string, mode?: CanvasMode) => Promise<void>;
  onDeleteProject: (projectId: string) => void;
  onUpdateProject: (projectId: string, updates: Partial<CanvasProject>) => void;
}

const ProjectSwitcher: React.FC<ProjectSwitcherProps> = ({
  projects,
  currentProjectId,
  onSwitchProject,
  onCreateProject,
  onDeleteProject,
  onUpdateProject,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');

  const [mounted, setMounted] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentProject = projects.find(p => p.id === currentProjectId);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (editingProject && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingProject]);

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    // Всегда создаём в режиме constructor — master вынесен в /canvas/master
    await onCreateProject(newProjectName.trim(), newProjectDesc.trim(), 'constructor');
    setShowCreateModal(false);
    setNewProjectName('');
    setNewProjectDesc('');
  };

  const handleEditProject = (projectId: string, currentName: string) => {
    setEditingProject(projectId);
    setEditName(currentName);
  };

  const handleSaveEdit = (projectId: string) => {
    if (editName.trim()) {
      onUpdateProject(projectId, { name: editName.trim() });
    }
    setEditingProject(null);
    setEditName('');
  };

  const getModeIcon = (mode: CanvasMode) => {
    switch (mode) {
      case 'constructor': return faLayerGroup;
      default: return faDiagramProject;
    }
  };

  const getModeColor = (mode: CanvasMode) => {
    return MODES[mode]?.color || '#C49A6C';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 86400000);
    if (diff === 0) return t('project.today');
    if (diff === 1) return t('project.yesterday');
    if (diff < 7) return t('project.days_ago').replace('{days}', String(diff));
    return date.toLocaleDateString();
  };

  return (
    <>
      <div className="project-switcher" ref={menuRef}>
        <button
          className="project-switcher-button"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="project-info">
            {currentProject ? (
              <>
                <div
                  className="project-mode-indicator"
                  style={{ background: getModeColor(currentProject.mode) }}
                />
                <span className="project-name">{currentProject.name}</span>
                {currentProject.discipline && (
                  <span className="project-discipline">{currentProject.discipline}</span>
                )}
              </>
            ) : (
              <span className="project-name">{t('project.select_project')}</span>
            )}
          </div>
          <FontAwesomeIcon
            icon={faChevronDown}
            className={`chevron ${isOpen ? 'open' : ''}`}
          />
        </button>

        {isOpen && (
          <div className="project-dropdown">
            <div className="dropdown-header">
              <span className="dropdown-title">{t('project.projects')}</span>
              <button
                className="create-project-btn"
                onClick={() => {
                  setIsOpen(false);
                  setShowCreateModal(true);
                }}
              >
                <FontAwesomeIcon icon={faPlus} />
                <span>{t('project.new')}</span>
              </button>
            </div>

            <div className="projects-list">
              {projects.length === 0 ? (
                <div className="empty-projects">
                  <FontAwesomeIcon icon={faFolderOpen} />
                  <p>{t('project.no_projects')}</p>
                </div>
              ) : (
                projects.map(project => {
                  const isCurrent = project.id === currentProjectId;
                  const modeColor = getModeColor(project.mode);
                  const isEditing = editingProject === project.id;

                  return (
                    <div
                      key={project.id}
                      className={`project-item ${isCurrent ? 'current' : ''}`}
                    >
                      <div
                        className="project-item-content"
                        onClick={() => {
                          if (!isCurrent && !isEditing) {
                            onSwitchProject(project.id);
                            setIsOpen(false);
                          }
                        }}
                      >
                        <div className="project-item-icon" style={{ background: `${modeColor}15` }}>
                          <FontAwesomeIcon
                            icon={getModeIcon(project.mode)}
                            style={{ color: modeColor }}
                          />
                        </div>

                        <div className="project-item-details">
                          {isEditing ? (
                            <input
                              ref={inputRef}
                              type="text"
                              className="edit-project-input"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              onBlur={() => handleSaveEdit(project.id)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveEdit(project.id);
                                if (e.key === 'Escape') setEditingProject(null);
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <>
                              <div className="project-item-name">
                                <span>{project.name}</span>
                                {project.status === 'completed' && (
                                  <FontAwesomeIcon icon={faCheckCircle} style={{ color: '#10b981' }} />
                                )}
                                {project.status === 'in_progress' && (
                                  <FontAwesomeIcon icon={faSpinner} spin style={{ color: '#f59e0b' }} />
                                )}
                              </div>
                              <div className="project-item-meta">
                                <span className="project-item-mode" style={{ color: modeColor }}>
                                  {MODES[project.mode]?.label}
                                </span>
                                <span className="project-item-date">
                                  <FontAwesomeIcon icon={faClock} />
                                  {formatDate(project.updated_at)}
                                </span>
                                {project.nodes.length > 0 && (
                                  <span className="project-item-nodes">
                                    {project.nodes.length} {t('project.blocks')}
                                  </span>
                                )}
                                {project.discipline && (
                                  <span className="project-item-discipline">
                                    <FontAwesomeIcon icon={faTag} />
                                    {project.discipline}
                                  </span>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="project-item-actions">
                        {!isEditing && (
                          <button
                            className="project-action-btn edit"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditProject(project.id, project.name);
                            }}
                          >
                            <FontAwesomeIcon icon={faPen} />
                          </button>
                        )}
                        <button
                          className="project-action-btn delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(t('project.confirm_delete').replace('{name}', project.name))) {
                              onDeleteProject(project.id);
                              if (isCurrent) setIsOpen(false);
                            }
                          }}
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {showCreateModal && mounted && createPortal(
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="create-project-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">{t('project.create_new')}</h3>

            <div className="modal-form">
              <div className="form-group">
                <label>{t('project.name_required')} *</label>
                <input
                  type="text"
                  className="modal-input"
                  placeholder={t('project.name_placeholder')}
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
                />
              </div>

              <div className="form-group">
                <label>{t('project.description_optional')}</label>
                <textarea
                  className="modal-textarea"
                  placeholder={t('project.description_placeholder')}
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Режим выбора убран — все новые проекты создаются в constructor.
                  Для мастер-настройки используйте /canvas/master */}
            </div>

            <div className="modal-actions">
              <button
                className="modal-cancel-btn"
                onClick={() => setShowCreateModal(false)}
              >
                {t('common.cancel')}
              </button>
              <button
                className="modal-create-btn"
                onClick={handleCreateProject}
                disabled={!newProjectName.trim()}
              >
                <FontAwesomeIcon icon={faPlus} />
                {t('project.create')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <style jsx>{`
        .project-switcher {
          position: relative;
          margin-right: 16px;
        }

        .project-switcher-button {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 100px;
          cursor: pointer;
          transition: all 0.2s;
          min-width: 240px;
        }

        .project-switcher-button:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(99, 102, 241, 0.3);
        }

        .project-info {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 8px;
          overflow: hidden;
        }

        .project-mode-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .project-name {
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .project-discipline {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.5);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .chevron {
          color: rgba(255, 255, 255, 0.5);
          transition: transform 0.2s;
        }

        .chevron.open {
          transform: rotate(180deg);
        }

        .project-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          width: 380px;
          background: rgba(25, 25, 35, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 8px;
          z-index: 1000;
          box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.5);
          animation: dropdownFade 0.2s ease;
        }

        .dropdown-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          margin-bottom: 4px;
        }

        .dropdown-title {
          font-size: 0.85rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.6);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .create-project-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          background: rgba(99, 102, 241, 0.1);
          border: 1px solid rgba(99, 102, 241, 0.2);
          border-radius: 100px;
          color: #818cf8;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .create-project-btn:hover {
          background: rgba(99, 102, 241, 0.2);
          transform: translateY(-1px);
        }

        .projects-list {
          max-height: 400px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .project-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px;
          border-radius: 12px;
          transition: all 0.2s;
          cursor: pointer;
        }

        .project-item:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .project-item.current {
          background: rgba(99, 102, 241, 0.1);
          border: 1px solid rgba(99, 102, 241, 0.2);
        }

        .project-item-content {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .project-item-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .project-item-details {
          flex: 1;
          min-width: 0;
        }

        .project-item-name {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 600;
          margin-bottom: 2px;
        }

        .project-item-name span {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .project-item-meta {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.5);
        }

        .project-item-mode {
          font-weight: 600;
        }

        .project-item-date,
        .project-item-nodes,
        .project-item-discipline {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .project-item-discipline svg {
          font-size: 0.6rem;
        }

        .edit-project-input {
          width: 100%;
          padding: 4px 8px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid #6366f1;
          border-radius: 6px;
          color: #fff;
          font-size: 0.9rem;
          outline: none;
        }

        .project-item-actions {
          display: flex;
          gap: 4px;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .project-item:hover .project-item-actions {
          opacity: 1;
        }

        .project-action-btn {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          border: none;
          background: transparent;
          color: rgba(255, 255, 255, 0.4);
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .project-action-btn.edit:hover {
          background: rgba(99, 102, 241, 0.2);
          color: #818cf8;
        }

        .project-action-btn.delete:hover {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        .empty-projects {
          padding: 32px;
          text-align: center;
          color: rgba(255, 255, 255, 0.4);
        }

        .empty-projects svg {
          font-size: 2rem;
          margin-bottom: 8px;
        }

        :global(.modal-overlay) {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 99999;
          animation: fadeIn 0.2s ease;
          padding: 16px;
          box-sizing: border-box;
        }

        :global(.create-project-modal) {
          width: 100%;
          max-width: 440px;
          background: rgba(25, 25, 35, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          padding: 24px;
          animation: scaleIn 0.3s ease;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
        }

        :global(.modal-title) {
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 20px;
          color: #fff;
        }

        :global(.form-group) {
          margin-bottom: 16px;
        }

        :global(.form-group label) {
          display: block;
          font-size: 0.85rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 6px;
        }

        :global(.modal-input),
        :global(.modal-textarea) {
          width: 100%;
          padding: 10px 12px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          color: #fff;
          font-size: 0.95rem;
          transition: all 0.2s;
          box-sizing: border-box;
        }

        :global(.modal-input:focus),
        :global(.modal-textarea:focus) {
          outline: none;
          border-color: #6366f1;
          background: rgba(255, 255, 255, 0.05);
        }

        :global(.modal-textarea) {
          resize: vertical;
          font-family: inherit;
        }

        :global(.modal-actions) {
          display: flex;
          gap: 12px;
          margin-top: 24px;
        }

        :global(.modal-cancel-btn),
        :global(.modal-create-btn) {
          flex: 1;
          padding: 12px;
          border-radius: 100px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        :global(.modal-cancel-btn) {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.7);
        }

        :global(.modal-cancel-btn:hover) {
          background: rgba(255, 255, 255, 0.05);
        }

        :global(.modal-create-btn) {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border: none;
          color: #fff;
        }

        :global(.modal-create-btn:hover:not(:disabled)) {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px -5px rgba(99, 102, 241, 0.3);
        }

        :global(.modal-create-btn:disabled) {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @keyframes dropdownFade {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </>
  );
};

export default ProjectSwitcher;