'use client';

import React, { useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBookOpen, faCube,
  faLayerGroup, faDiagramProject,
  faInfoCircle,
  faRocket, faGraduationCap, faUsers, faBrain,
  faChevronRight, faSearch, faBolt, faLanguage,
  faUser,
} from '@fortawesome/free-solid-svg-icons';
import Header from '@/components/Header';
import { useTranslation } from '@/hooks/useTranslation';

export default function DocsPage() {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState<string>('canvas');
  const [searchQuery, setSearchQuery] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);

  const sections = [
    { id: 'canvas',  label: t('docs.canvas_editor'),  icon: faLayerGroup,     color: '#06b6d4' },
    { id: 'sbs',     label: t('docs.sbs_builder'),    icon: faDiagramProject, color: '#ec4899' },
    { id: 'master',  label: t('docs.master_builder'), icon: faRocket,         color: '#8b5cf6' },
    { id: 'profile', label: t('docs.profile'),        icon: faUser,           color: '#10b981' },
  ];

  const filteredSections = sections.filter(s =>
    s.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSectionClick = (id: string) => {
    setActiveSection(id);
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  };

  const currentSection = sections.find(s => s.id === activeSection);

  const getSectionContent = (sectionId: string) => {
    switch (sectionId) {

      case 'canvas':
        return (
          <div>
            <p className="doc-lead">{t('docs.canvas_description')}</p>

            <h3 className="doc-section-title">{t('docs.ui_elements')}</h3>
            <div className="spec-table">
              {[
                { key: t('docs.toolbar'), val: t('docs.toolbar_desc') },
                { key: t('docs.component_library'), val: t('docs.component_library_desc') },
                { key: t('docs.workspace'), val: t('docs.workspace_desc') },
                { key: t('docs.properties_panel'), val: t('docs.properties_panel_desc') },
              ].map((row, i) => (
                <div className="spec-row" key={i}>
                  <span className="spec-key">{row.key}</span>
                  <span className="spec-val">{row.val}</span>
                </div>
              ))}
            </div>

            <h3 className="doc-section-title">{t('docs.block_types')}</h3>
            <div className="blocks-grid">
              {[
                { icon: faCube,            label: t('docs.import'),     desc: t('docs.import_desc'),     color: '#3b82f6' },
                { icon: faLayerGroup,      label: t('docs.lectures'),   desc: t('docs.lectures_desc'),   color: '#8b5cf6' },
                { icon: faDiagramProject,  label: t('docs.labs'),       desc: t('docs.labs_desc'),       color: '#10b981' },
                { icon: faGraduationCap,   label: t('docs.practicals'), desc: t('docs.practicals_desc'), color: '#f59e0b' },
                { icon: faUsers,           label: t('docs.sro'),        desc: t('docs.sro_desc'),        color: '#06b6d4' },
                { icon: faBrain,           label: t('docs.srop'),       desc: t('docs.srop_desc'),       color: '#ec4899' },
                { icon: faRocket,          label: t('docs.kp'),         desc: t('docs.kp_desc'),         color: '#6366f1' },
              ].map((block, i) => (
                <div className="block-card" key={i}>
                  <FontAwesomeIcon icon={block.icon} style={{ color: block.color, fontSize: '1.2rem', marginBottom: '0.5rem' }} />
                  <strong>{block.label}</strong>
                  <span>{block.desc}</span>
                </div>
              ))}
            </div>

            <h3 className="doc-section-title">{t('docs.hotkeys')}</h3>
            <div className="hotkeys-list">
              {[
                { combo: ['Ctrl', 'S'], action: t('docs.save_project') },
                { combo: ['Ctrl', 'Z'], action: t('docs.undo') },
                { combo: ['Del'], action: t('docs.delete_selected') },
                { combo: ['Ctrl', 'D'], action: t('docs.duplicate') },
                { combo: ['Space', '+', t('docs.drag')], action: t('docs.pan_canvas') },
                { combo: ['Ctrl', '+/-'], action: t('docs.zoom') },
              ].map((hk, i) => (
                <div className="hotkey-row" key={i}>
                  <div className="hotkey-combo">
                    {hk.combo.map((k, j) => (
                      k === '+' || k === t('docs.drag')
                        ? <span key={j} style={{ color: '#94a3b8', margin: '0 2px' }}>{k}</span>
                        : <kbd key={j}>{k}</kbd>
                    ))}
                  </div>
                  <span className="hotkey-action">{hk.action}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'sbs':
        return (
          <div>
            <p className="doc-lead">{t('docs.sbs_description')}</p>

            <h3 className="doc-section-title">{t('docs.sbs_workflow')}</h3>
            <div className="steps-list">
              {[
                { num: 1, title: t('docs.sbs_step1'), desc: t('docs.sbs_step1_desc') },
                { num: 2, title: t('docs.sbs_step2'), desc: t('docs.sbs_step2_desc') },
                { num: 3, title: t('docs.sbs_step3'), desc: t('docs.sbs_step3_desc') },
                { num: 4, title: t('docs.sbs_step4'), desc: t('docs.sbs_step4_desc') },
                { num: 5, title: t('docs.sbs_step5'), desc: t('docs.sbs_step5_desc') },
              ].map((step) => (
                <div className="step-item" key={step.num}>
                  <div className="step-num">{step.num}</div>
                  <div className="step-content">
                    <h4>{step.title}</h4>
                    <p>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <h3 className="doc-section-title">{t('docs.generated_docs')}</h3>
            <div className="spec-table">
              {[
                { key: t('docs.syllabus'), val: t('docs.syllabus_desc') },
                { key: t('docs.calendar_plan'), val: t('docs.calendar_plan_desc') },
                { key: t('docs.lecture_notes'), val: t('docs.lecture_notes_desc') },
                { key: t('docs.lab_works'), val: t('docs.lab_works_desc') },
                { key: t('docs.sro_tasks'), val: t('docs.sro_tasks_desc') },
                { key: t('docs.exam_materials'), val: t('docs.exam_materials_desc') },
              ].map((row, i) => (
                <div className="spec-row" key={i}>
                  <span className="spec-key">{row.key}</span>
                  <span className="spec-val">{row.val}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'master':
        return (
          <div>
            <p className="doc-lead">{t('docs.master_description')}</p>

            <h3 className="doc-section-title">{t('docs.master_workflow')}</h3>
            <div className="steps-list">
              {[
                { num: 1, title: t('docs.master_step1'), desc: t('docs.master_step1_desc') },
                { num: 2, title: t('docs.master_step2'), desc: t('docs.master_step2_desc') },
                { num: 3, title: t('docs.master_step3'), desc: t('docs.master_step3_desc') },
                { num: 4, title: t('docs.master_step4'), desc: t('docs.master_step4_desc') },
              ].map((step) => (
                <div className="step-item" key={step.num}>
                  <div className="step-num">{step.num}</div>
                  <div className="step-content">
                    <h4>{step.title}</h4>
                    <p>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <h3 className="doc-section-title">{t('docs.master_advantages')}</h3>
            <div className="feature-grid">
              <div className="feature-card">
                <div className="feature-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}>
                  <FontAwesomeIcon icon={faRocket} />
                </div>
                <h4>{t('docs.master_advantage_speed')}</h4>
                <p>{t('docs.master_advantage_speed_desc')}</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                  <FontAwesomeIcon icon={faLayerGroup} />
                </div>
                <h4>{t('docs.master_advantage_consistency')}</h4>
                <p>{t('docs.master_advantage_consistency_desc')}</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon" style={{ background: 'linear-gradient(135deg, #06b6d4, #0891b2)' }}>
                  <FontAwesomeIcon icon={faDiagramProject} />
                </div>
                <h4>{t('docs.master_advantage_batch')}</h4>
                <p>{t('docs.master_advantage_batch_desc')}</p>
              </div>
            </div>

            <div className="callout callout-info">
              <FontAwesomeIcon icon={faInfoCircle} className="callout-icon" />
              <div>
                <strong>{t('docs.master_note_title')}</strong>
                <p>{t('docs.master_note_desc')}</p>
              </div>
            </div>
          </div>
        );

      case 'profile':
        return (
          <div>
            <p className="doc-lead">{t('docs.profile_description')}</p>

            <h3 className="doc-section-title">{t('docs.profile_settings')}</h3>
            <div className="spec-table">
              {[
                { key: t('docs.profile_name'),     val: t('docs.profile_name_desc') },
                { key: t('docs.profile_avatar'),   val: t('docs.profile_avatar_desc') },
                { key: t('docs.profile_password'), val: t('docs.profile_password_desc') },
                { key: t('docs.profile_language'), val: t('docs.profile_language_desc') },
              ].map((row, i) => (
                <div className="spec-row" key={i}>
                  <span className="spec-key">{row.key}</span>
                  <span className="spec-val">{row.val}</span>
                </div>
              ))}
            </div>

            <h3 className="doc-section-title">{t('docs.profile_stats')}</h3>
            <div className="feature-grid">
              <div className="feature-card">
                <div className="feature-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                  <FontAwesomeIcon icon={faBolt} />
                </div>
                <h4>{t('docs.profile_stat_today')}</h4>
                <p>{t('docs.profile_stat_today_desc')}</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon" style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
                  <FontAwesomeIcon icon={faBookOpen} />
                </div>
                <h4>{t('docs.profile_stat_history')}</h4>
                <p>{t('docs.profile_stat_history_desc')}</p>
              </div>
            </div>

            <h3 className="doc-section-title">{t('docs.profile_languages')}</h3>
            <div className="tag-cloud">
              <span className="tag">🇷🇺 {t('docs.russian')}</span>
              <span className="tag">🇰🇿 {t('docs.kazakh')}</span>
              <span className="tag">🇬🇧 {t('docs.english')}</span>
            </div>

            <div className="callout callout-info">
              <FontAwesomeIcon icon={faInfoCircle} className="callout-icon" />
              <div>
                <strong>{t('docs.profile_note_title')}</strong>
                <p>{t('docs.profile_note_desc')}</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="docs-root">
      <Header />

      {/* Compact Hero */}
      <section className="docs-hero">
        <div className="hero-bg-shapes">
          <div className="hero-shape shape-1" />
          <div className="hero-shape shape-2" />
          <div className="hero-shape shape-3" />
        </div>
        <div className="hero-inner">
          <div className="hero-badge">
            <FontAwesomeIcon icon={faBookOpen} />
            <span>{t('docs.version_text')}</span>
          </div>
          <h1 className="hero-title">{t('docs.documentation')}</h1>
          <p className="hero-sub">{t('docs.hero_subtitle')}</p>
          <div className="hero-meta">
            <span className="meta-item">
              <FontAwesomeIcon icon={faBolt} />
              v1.0.0
            </span>
            <span className="meta-sep">·</span>
            <span className="meta-item">
              <FontAwesomeIcon icon={faLanguage} />
              {t('docs.docs_available')}
            </span>
          </div>
        </div>
      </section>

      {/* Body */}
      <div className="docs-body">
        {/* Sidebar */}
        <aside className="docs-sidebar">
          <div className="sidebar-search">
            <FontAwesomeIcon icon={faSearch} className="search-icon" />
            <input
              type="text"
              placeholder={t('docs.search_placeholder')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <nav className="sidebar-nav">
            <p className="nav-label-group">{t('docs.sections')}</p>
            {filteredSections.map((section) => (
              <button
                key={section.id}
                className={`nav-item ${activeSection === section.id ? 'active' : ''}`}
                onClick={() => handleSectionClick(section.id)}
              >
                <span
                  className="nav-icon-wrap"
                  style={{ background: activeSection === section.id ? section.color + '20' : 'transparent' }}
                >
                  <FontAwesomeIcon icon={section.icon} style={{ color: section.color }} />
                </span>
                <span className="nav-text">{section.label}</span>
                {activeSection === section.id && (
                  <FontAwesomeIcon icon={faChevronRight} className="nav-arrow" />
                )}
              </button>
            ))}
          </nav>

          <div className="sidebar-footer">
            <div className="footer-status">
              <span className="status-dot" />
              <span>{t('docs.all_systems_operational')}</span>
            </div>
          </div>
        </aside>

        {/* Content */}
        <main className="docs-content" ref={contentRef}>
          <div className="content-inner">
            <div className="content-breadcrumb">
              <span>{t('docs.documentation')}</span>
              <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: '0.6rem', color: '#cbd5e1' }} />
              <span className="breadcrumb-current">{currentSection?.label}</span>
            </div>

            <div className="content-header">
              <div
                className="content-icon"
                style={{ background: `linear-gradient(135deg, ${currentSection?.color}30, ${currentSection?.color}15)`, border: `1px solid ${currentSection?.color}30` }}
              >
                <FontAwesomeIcon icon={currentSection?.icon || faCube} style={{ color: currentSection?.color }} />
              </div>
              <div>
                <h2 className="content-title">{currentSection?.label}</h2>
                <p className="content-subtitle">{t(`docs.${activeSection}_subtitle`)}</p>
              </div>
            </div>

            <div className="content-body">
              {getSectionContent(activeSection)}
            </div>

            <div className="content-footer">
              <span>{t('docs.last_updated')}: 2026</span>
              <span>·</span>
              <span>{t('docs.version')}: 1.0.0</span>
            </div>
          </div>
        </main>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .docs-root {
          font-family: 'Manrope', sans-serif;
          background: #f8fafc;
          height: 100vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          color: #0f172a;
        }

        .docs-hero {
          position: relative;
          background: linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #2563eb 100%);
          padding: 1.5rem 1.5rem;
          flex-shrink: 0;
          overflow: hidden;
        }

        .hero-bg-shapes {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .hero-shape {
          position: absolute;
          border-radius: 50%;
          opacity: 0.08;
          background: white;
        }

        .shape-1 { width: 300px; height: 300px; top: -100px; right: -50px; }
        .shape-2 { width: 200px; height: 200px; bottom: -80px; left: 5%; }
        .shape-3 { width: 150px; height: 150px; top: 20px; left: 45%; }

        .hero-inner {
          position: relative;
          max-width: 1200px;
          margin: 0 auto;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(255,255,255,0.15);
          backdrop-filter: blur(4px);
          padding: 0.25rem 0.75rem;
          border-radius: 30px;
          color: white;
          font-size: 0.7rem;
          font-weight: 500;
          margin-bottom: 0.75rem;
          border: 1px solid rgba(255,255,255,0.2);
        }

        .hero-title {
          font-size: clamp(1.4rem, 2.5vw, 1.8rem);
          font-weight: 800;
          color: white;
          line-height: 1.2;
          margin-bottom: 0.25rem;
          letter-spacing: -0.02em;
        }

        .hero-sub {
          color: rgba(255,255,255,0.8);
          font-size: 0.85rem;
          max-width: 480px;
          line-height: 1.4;
          margin-bottom: 0.5rem;
        }

        .hero-meta {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: rgba(255,255,255,0.6);
          font-size: 0.7rem;
        }

        .meta-item { display: flex; align-items: center; gap: 0.4rem; }
        .meta-sep { opacity: 0.4; }

        .docs-body {
          flex: 1;
          min-height: 0;
          display: flex;
          overflow: hidden;
        }

        .docs-sidebar {
          width: 280px;
          min-width: 280px;
          flex-shrink: 0;
          background: white;
          border-right: 1px solid #e2e8f0;
          height: 100%;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .sidebar-search {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.75rem 1rem;
          border-bottom: 1px solid #f1f5f9;
          background: #f8fafc;
        }

        .search-icon { color: #94a3b8; font-size: 0.85rem; }

        .sidebar-search input {
          border: none;
          background: transparent;
          font-family: 'Manrope', sans-serif;
          font-size: 0.85rem;
          color: #334155;
          outline: none;
          width: 100%;
        }

        .sidebar-search input::placeholder { color: #cbd5e1; }

        .sidebar-nav {
          padding: 0.75rem 0.5rem;
          flex: 1;
          overflow-y: auto;
        }

        .nav-label-group {
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #94a3b8;
          padding: 0.25rem 0.75rem 0.6rem;
        }

        .nav-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 0.7rem;
          padding: 0.55rem 0.75rem;
          border: none;
          background: transparent;
          border-radius: 10px;
          cursor: pointer;
          text-align: left;
          font-family: 'Manrope', sans-serif;
          font-size: 0.875rem;
          color: #475569;
          font-weight: 500;
          transition: all 0.15s;
          margin-bottom: 2px;
        }

        .nav-item:hover { background: #f1f5f9; color: #0f172a; }

        .nav-item.active {
          background: #eff6ff;
          color: #1d4ed8;
          font-weight: 600;
        }

        .nav-icon-wrap {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 7px;
          font-size: 0.8rem;
          flex-shrink: 0;
          transition: background 0.15s;
        }

        .nav-text { flex: 1; }
        .nav-arrow { font-size: 0.65rem; color: #93c5fd; margin-left: auto; }

        .sidebar-footer {
          padding: 0.75rem 1rem;
          border-top: 1px solid #f1f5f9;
          background: #f8fafc;
        }

        .footer-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          color: #64748b;
        }

        .status-dot {
          width: 7px;
          height: 7px;
          background: #10b981;
          border-radius: 50%;
          box-shadow: 0 0 0 2px #d1fae5;
        }

        .docs-content {
          flex: 1;
          min-width: 0;
          background: #f8fafc;
          height: 100%;
          overflow-y: auto;
          overflow-x: hidden;
          scrollbar-width: thin;
          scrollbar-color: #e2e8f0 transparent;
        }

        .docs-content::-webkit-scrollbar { width: 5px; }
        .docs-content::-webkit-scrollbar-track { background: transparent; }
        .docs-content::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }

        .content-inner {
          padding: 1.5rem 2.5rem;
          max-width: 860px;
        }

        .content-breadcrumb {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.78rem;
          color: #94a3b8;
          margin-bottom: 1.5rem;
        }

        .breadcrumb-current { color: #475569; font-weight: 500; }

        .content-header {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #f1f5f9;
        }

        .content-icon {
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          font-size: 1.3rem;
          flex-shrink: 0;
        }

        .content-title {
          font-size: 1.5rem;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.02em;
          line-height: 1.2;
        }

        .content-subtitle {
          font-size: 0.88rem;
          color: #64748b;
          margin-top: 0.25rem;
        }

        .content-body { line-height: 1.7; }

        .content-footer {
          display: flex;
          gap: 0.75rem;
          font-size: 0.75rem;
          color: #cbd5e1;
          margin-top: 2.5rem;
          padding-top: 1rem;
          border-top: 1px solid #f1f5f9;
        }

        .doc-lead {
          font-size: 1rem;
          color: #475569;
          line-height: 1.75;
          margin-bottom: 2rem;
          padding: 1.25rem 1.5rem;
          background: #f8fafc;
          border-radius: 10px;
          border-left: 3px solid #3b82f6;
        }

        .doc-section-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: #0f172a;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin: 2rem 0 1rem;
        }

        .feature-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .feature-card {
          padding: 1.25rem;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          transition: box-shadow 0.2s, transform 0.2s;
        }

        .feature-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          transform: translateY(-2px);
        }

        .feature-icon {
          width: 36px;
          height: 36px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 0.9rem;
          margin-bottom: 0.75rem;
        }

        .feature-card h4 {
          font-size: 0.875rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 0.3rem;
        }

        .feature-card p {
          font-size: 0.8rem;
          color: #64748b;
          line-height: 1.5;
        }

        .spec-table {
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 1.5rem;
        }

        .spec-row {
          display: flex;
          align-items: center;
          padding: 0.75rem 1rem;
          border-bottom: 1px solid #f1f5f9;
          gap: 1rem;
        }

        .spec-row:last-child { border-bottom: none; }
        .spec-row:nth-child(even) { background: #fafbfc; }

        .spec-key {
          min-width: 160px;
          font-size: 0.825rem;
          font-weight: 600;
          color: #334155;
          flex-shrink: 0;
        }

        .spec-val { font-size: 0.825rem; color: #64748b; }

        .callout {
          display: flex;
          gap: 1rem;
          align-items: flex-start;
          padding: 1rem 1.25rem;
          border-radius: 10px;
          margin: 1.5rem 0;
          font-size: 0.875rem;
        }

        .callout-info { background: #eff6ff; border: 1px solid #bfdbfe; }
        .callout-warning { background: #fffbeb; border: 1px solid #fde68a; }

        .callout-icon {
          font-size: 1rem;
          margin-top: 0.15rem;
          flex-shrink: 0;
        }

        .callout-info .callout-icon { color: #3b82f6; }
        .callout-warning .callout-icon { color: #f59e0b; }

        .callout strong {
          display: block;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 0.3rem;
        }

        .callout p {
          color: #475569;
          margin: 0;
          line-height: 1.6;
        }

        .steps-list {
          display: flex;
          flex-direction: column;
          gap: 0;
          margin-bottom: 1.5rem;
        }

        .step-item {
          display: flex;
          gap: 1rem;
          position: relative;
          padding-bottom: 1.5rem;
        }

        .step-item:last-child { padding-bottom: 0; }

        .step-item:not(:last-child)::after {
          content: '';
          position: absolute;
          left: 15px;
          top: 32px;
          width: 2px;
          height: calc(100% - 32px);
          background: linear-gradient(to bottom, #3b82f6, #e2e8f0);
          border-radius: 1px;
        }

        .step-num {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #1d4ed8, #3b82f6);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          font-weight: 800;
          flex-shrink: 0;
          z-index: 1;
        }

        .step-content h4 {
          font-size: 0.9rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 0.3rem;
          padding-top: 0.35rem;
        }

        .step-content p {
          font-size: 0.83rem;
          color: #64748b;
          line-height: 1.6;
        }

        .tag-cloud {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
        }

        .tag {
          padding: 0.3rem 0.75rem;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          border-radius: 999px;
          font-size: 0.78rem;
          font-weight: 500;
          color: #475569;
        }

        .blocks-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .block-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 1rem 0.75rem;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          gap: 0.2rem;
          font-size: 0.78rem;
          transition: box-shadow 0.2s;
        }

        .block-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.07); }

        .block-card strong {
          color: #0f172a;
          font-size: 0.82rem;
        }

        .block-card span { color: #64748b; }

        .hotkeys-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
        }

        .hotkey-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.55rem 0.9rem;
          border: 1px solid #f1f5f9;
          border-radius: 8px;
          font-size: 0.825rem;
        }

        .hotkey-combo {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          min-width: 160px;
          flex-wrap: wrap;
        }

        kbd {
          background: #f1f5f9;
          border: 1px solid #cbd5e1;
          border-bottom: 3px solid #94a3b8;
          border-radius: 5px;
          padding: 0.1rem 0.45rem;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.72rem;
          font-weight: 600;
          color: #334155;
        }

        .hotkey-action { color: #475569; }

        @media (max-width: 900px) {
          .docs-root { height: auto; overflow: visible; }
          .docs-hero { padding: 1.5rem 1.5rem; }
          .docs-body { overflow: visible; flex-direction: column; }
          .docs-sidebar {
            width: 100%;
            min-width: 0;
            height: auto;
            overflow: visible;
            border-right: none;
            border-bottom: 1px solid #e2e8f0;
          }
          .docs-content { height: auto; overflow: visible; }
          .sidebar-nav {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
          }
          .nav-label-group { grid-column: 1 / -1; }
          .content-inner { padding: 1.5rem; }
          .feature-grid { grid-template-columns: 1fr 1fr; }
        }

        @media (max-width: 600px) {
          .sidebar-nav { grid-template-columns: repeat(2, 1fr); }
          .feature-grid { grid-template-columns: 1fr; }
          .blocks-grid { grid-template-columns: repeat(2, 1fr); }
          .spec-key { min-width: 110px; }
          .content-header { flex-direction: column; gap: 0.75rem; }
        }
      `}</style>
    </div>
  );
}