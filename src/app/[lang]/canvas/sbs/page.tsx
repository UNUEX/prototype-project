// app/[lang]/canvas/sbs/page.tsx
'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUpload, faFileImport, faBook, faCalendar,
  faChalkboard, faMicroscope, faChalkboardUser,
  faPenToSquare, faClipboardList, faLayerGroup,
  faGraduationCap, faArrowRight, faCheckCircle,
  faSpinner, faWandMagicSparkles, faRocket,
  faDownload,
  faFileLines, faClock,
  faCircle,
  faGear, faFileWord, faStar, faExclamationTriangle,
  faChevronDown, faUser, faHashtag,
  faFlask, faBuilding,
} from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { toast } from 'react-hot-toast';
import Header from '@/components/Header';

import { CalendarFormData } from '@/components/calendarform';
import { apiFetch, LimitExceededError, GlobalLimitExceededError, AuthRequiredError } from '@/lib/apiFetch';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGenerationLimit } from '@/hooks/useGenerationLimit';
import { openLimitModal, openGlobalLimitModal } from '@/components/LimitModal';
import { RupFormData } from '../../types/types';
import SBSPageStyles from './SBSPageDesign';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

type Step = 'upload' | 'parse' | 'select' | 'generate' | 'complete';
type DocumentType = 'calendar' | 'lectures' | 'labs' | 'practicals' | 'sro' | 'srop' | 'kp' | 'sro_full' | 'boundary_control' | 'final_control';
type GenerationMode = 'quick' | 'detailed';
type GenerationDocType = 'rup' | 'calendar';

type DocGenStatus = 'pending' | 'running' | 'done' | 'error';

interface DocGenState {
  id: DocumentType;
  status: DocGenStatus;
  filename?: string;
  error?: string;
  blob?: Blob;
}

interface StepItem {
  id: DocumentType;
  icon: IconDefinition;
  label: string;
  description: string;
  color: string;
  disabled?: boolean;
}

interface SyllabusData {
  discipline: string;
  hasLectures: boolean;
  hasLabs: boolean;
  hasPracticals: boolean;
  hasSRO: boolean;
  hasSROP: boolean;
  hasKP: boolean;
  hours?: number;
  teacher?: string;
  program?: string;
  rawText?: string;
  lectureTopics?: string[];
  labTopics?: string[];
  practicalTopics?: string[];
  sropTopics?: string[];
  sropTable?: Array<{ theme: string; goal: string; task: string }>;
  sroTasks?: string[];
  sroQuestions?: string[];
  kpTopics?: string[];
}

function buildEnrichedContext(kind: string, syllabus: SyllabusData): string {
  const syllabusContext = syllabus.rawText
    ? (kind === 'sro_full' ? syllabus.rawText.slice(0, 20000) : syllabus.rawText.slice(0, 8000))
    : '';
  const parts: string[] = [];
  if (syllabusContext) parts.push(syllabusContext);
  if (kind === 'lectures' && syllabus.lectureTopics?.length)
    parts.push('\n\n=== ТЕМЫ ЛЕКЦИЙ ИЗ СИЛЛАБУСА ===\n' + syllabus.lectureTopics.join('\n'));
  if (kind === 'labs' && syllabus.labTopics?.length)
    parts.push('\n\n=== ТЕМЫ ЛАБОРАТОРНЫХ РАБОТ ИЗ СИЛЛАБУСА ===\n' + syllabus.labTopics.join('\n'));
  if (kind === 'practicals' && syllabus.practicalTopics?.length)
    parts.push('\n\n=== ТЕМЫ ПРАКТИЧЕСКИХ ЗАНЯТИЙ ИЗ СИЛЛАБУСА ===\n' + syllabus.practicalTopics.join('\n'));
  if (kind === 'sro' && syllabus.sroTasks?.length)
    parts.push('\n\n=== ЗАДАНИЯ СРО ИЗ СИЛЛАБУСА ===\n' + syllabus.sroTasks.join('\n'));
  if (kind === 'srop') {
    const sropLines = syllabus.sropTopics?.length
      ? syllabus.sropTopics
      : (syllabus.sropTable || []).map(t => t.theme);
    if (sropLines.length)
      parts.push('\n\n=== ТЕМЫ СРОП ИЗ СИЛЛАБУСА ===\n' + sropLines.join('\n'));
  }
  if (kind === 'kp' && syllabus.kpTopics?.length)
    parts.push('\n\n=== ТЕМЫ КУРСОВЫХ ПРОЕКТОВ ИЗ СИЛЛАБУСА ===\n' + syllabus.kpTopics.join('\n'));
  return parts.join('').slice(0, 10000);
}

async function generateDocumentApi(kind: DocumentType, syllabus: SyllabusData, userId: string): Promise<Blob> {
  const discipline = syllabus.discipline;
  const syllabusContext = syllabus.rawText?.slice(0, 8000) || '';
  const doFetch = async (endpoint: string, body: object) => {
    const res = await apiFetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }, userId);
    if (!res.ok) throw new Error(`Ошибка сервера: ${res.status}`);
    return new Blob([await res.arrayBuffer()]);
  };
  if (kind === 'calendar') {
    return doFetch('/generate-calendar-from-prompt', {
      prompt: discipline, syllabusContext,
      lectureTopics: syllabus.lectureTopics || [],
      labTopics: syllabus.labTopics || [],
      practicalTopics: syllabus.practicalTopics || [],
      sropTopics: syllabus.sropTopics || (syllabus.sropTable || []).map(t => t.theme),
    });
  } else if (kind === 'sro_full') {
    return doFetch('/generate-sro-full', {
      subject: discipline,
      syllabusContext: syllabus.rawText?.slice(0, 20000) || '',
      teacher: syllabus.teacher || '', department: '', program: syllabus.program || '',
      sropTable: syllabus.sropTable || [], sroTasks: syllabus.sroTasks || [],
      sroQuestions: syllabus.sroQuestions || [],
    });
  } else {
    return doFetch('/generate-component', {
      type: kind, discipline,
      syllabusContext: buildEnrichedContext(kind, syllabus), prompt: '',
    });
  }
}

// ─── Progressive Detail Form ───────────────────────────────────────────────

type DetailSection = 'discipline' | 'hours' | 'teacher' | 'summary';

interface DetailFormState {
  // Section 1 — Discipline
  disciplineName: string;
  disciplineCode: string;
  // Section 2 — Hours
  course: string;
  semester: string;
  totalHours: string;
  credits: string;
  lectures: string;
  labs: string;
  practicals: string;
  hasKP: boolean;
  // Section 3 — Teacher
  teacherName: string;
  program: string;
  department: string;
  prerequisites: string;
  postrequisites: string;
  // Calendar extras
  group: string;
  weeks: string;
  controlType: string;
  weekParity: string;
}

const emptyDetailForm: DetailFormState = {
  disciplineName: '', disciplineCode: '',
  course: '', semester: '', totalHours: '', credits: '',
  lectures: '', labs: '', practicals: '', hasKP: false,
  teacherName: '', program: '', department: '', prerequisites: '', postrequisites: '',
  group: '', weeks: '', controlType: '', weekParity: '',
};

function buildPromptFromDetail(form: DetailFormState, docType: GenerationDocType): string {
  if (docType === 'rup') {
    const parts = [form.disciplineName];
    if (form.disciplineCode) parts.push(`код ${form.disciplineCode}`);
    if (form.course) parts.push(`${form.course} курс`);
    if (form.semester) parts.push(`${form.semester} семестр`);
    if (form.totalHours) parts.push(`${form.totalHours} часов`);
    if (form.credits) parts.push(`${form.credits} кредитов`);
    if (form.teacherName) parts.push(`преподаватель ${form.teacherName}`);
    if (form.program) parts.push(`ОП: ${form.program}`);
    if (form.department) parts.push(`кафедра: ${form.department}`);
    if (form.prerequisites) parts.push(`пререквизиты: ${form.prerequisites}`);
    if (form.postrequisites) parts.push(`постреквизиты: ${form.postrequisites}`);
    if (form.lectures) parts.push(`лекции ${form.lectures}`);
    if (form.labs) parts.push(`лабораторных ${form.labs}`);
    if (form.practicals) parts.push(`практических ${form.practicals}`);
    parts.push(form.hasKP ? 'с КП' : 'без КП');
    return parts.join(', ');
  } else {
    const parts = [form.disciplineName];
    if (form.group) parts.push(`группа ${form.group}`);
    if (form.totalHours) parts.push(`${form.totalHours} часов`);
    if (form.weeks) parts.push(`${form.weeks} недель`);
    if (form.controlType) parts.push(form.controlType);
    if (form.teacherName) parts.push(`преподаватель ${form.teacherName}`);
    if (form.weekParity) parts.push(form.weekParity);
    return parts.join(', ');
  }
}

// Section completion check
function isSectionDone(section: DetailSection, form: DetailFormState, docType: GenerationDocType): boolean {
  if (section === 'discipline') return form.disciplineName.trim().length > 1;
  if (section === 'hours') {
    if (docType === 'rup') return form.totalHours.trim().length > 0;
    return form.totalHours.trim().length > 0 || form.group.trim().length > 0;
  }
  if (section === 'teacher') return true; // optional
  if (section === 'summary') return true;
  return false;
}

const DETAIL_SECTIONS: { id: DetailSection; label: string }[] = [
  { id: 'discipline', label: 'sbs.section_discipline' },
  { id: 'hours',      label: 'sbs.section_hours' },
  { id: 'teacher',    label: 'sbs.section_teacher' },
  { id: 'summary',    label: 'sbs.section_summary' },
];

// ── Progressive Detail Form Component ──────────────────────────────────────
interface ProgressiveDetailFormProps {
  docType: GenerationDocType;
  isLoading: boolean;
  onGenerate: (prompt: string) => void;
}

function ProgressiveDetailForm({ docType, isLoading, onGenerate }: ProgressiveDetailFormProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<DetailFormState>(emptyDetailForm);
  const [activeSection, setActiveSection] = useState<DetailSection>('discipline');

  const sections: DetailSection[] = ['discipline', 'hours', 'teacher', 'summary'];

  const set = (key: keyof DetailFormState, val: string | boolean) =>
    setForm(prev => ({ ...prev, [key]: val }));

  const unlocked = (s: DetailSection) => {
    const idx = sections.indexOf(s);
    if (idx === 0) return true;
    return isSectionDone(sections[idx - 1], form, docType);
  };

  const sectionStatus = (s: DetailSection): 'active' | 'done' | 'locked' => {
    if (s === activeSection) return 'active';
    if (isSectionDone(s, form, docType)) return 'done';
    return 'locked';
  };

  return (
    <div className="detailed-panel">
      {/* Steps bar */}
      <div className="detail-steps-bar">
        {DETAIL_SECTIONS.map((sec) => {
          const status = sectionStatus(sec.id);
          const canClick = unlocked(sec.id);
          return (
            <button
              key={sec.id}
              className={`detail-step-pill ${status === 'active' ? 'active' : ''} ${status === 'done' ? 'done' : ''}`}
              onClick={() => canClick && setActiveSection(sec.id)}
              style={{ cursor: canClick ? 'pointer' : 'default', border: 'none', background: 'transparent', fontFamily: 'inherit' }}
            >
              <span className="dsp-num">
                {status === 'done' ? '✓' : (sections.indexOf(sec.id) + 1)}
              </span>
              <span>{t(sec.label)}</span>
            </button>
          );
        })}
      </div>

      {/* Section 1 — Discipline */}
      {activeSection === 'discipline' && (
        <div className="detail-section" style={{ animationDelay: '0s' }}>
          <div className="detail-section-header">
            <div className="detail-section-num">1</div>
            <div>
              <div className="detail-section-title">{t('sbs.detail_discipline_title')}</div>
              <div className="detail-section-desc">{t('sbs.detail_discipline_desc')}</div>
            </div>
          </div>

          <div className="field-card field-full" style={{ marginBottom: 12 }}>
            <div className="field-card-label">
              <FontAwesomeIcon icon={faBook} />
              {t('sbs.detail_discipline_name')} *
            </div>
            <input
              className="field-card-input"
              placeholder={t('sbs.detail_discipline_placeholder')}
              value={form.disciplineName}
              onChange={e => set('disciplineName', e.target.value)}
              style={{ fontSize: '1.05rem' }}
            />
            <div className="field-card-hint">{t('sbs.detail_discipline_hint')}</div>
          </div>

          <div className="field-card field-full">
            <div className="field-card-label">
              <FontAwesomeIcon icon={faHashtag} />
              {t('sbs.detail_discipline_code')}
            </div>
            <input
              className="field-card-input"
              placeholder={t('sbs.detail_discipline_code_placeholder')}
              value={form.disciplineCode}
              onChange={e => set('disciplineCode', e.target.value)}
            />
            <div className="field-card-hint">{t('sbs.detail_discipline_code_hint')}</div>
          </div>

          {form.disciplineName.trim().length > 1 && (
            <button
              className="detail-next-btn"
              onClick={() => setActiveSection('hours')}
            >
              {t('sbs.detail_next_params')} <FontAwesomeIcon icon={faArrowRight} />
            </button>
          )}
        </div>
      )}

      {/* Section 2 — Hours / Params */}
      {activeSection === 'hours' && (
        <div className="detail-section" style={{ animationDelay: '0s' }}>
          <div className="detail-section-header">
            <div className="detail-section-num">2</div>
            <div>
              <div className="detail-section-title">
                {docType === 'rup' ? t('sbs.detail_hours_title_rup') : t('sbs.detail_hours_title_calendar')}
              </div>
              <div className="detail-section-desc">{t('sbs.detail_hours_desc')}</div>
            </div>
            {isSectionDone('discipline', form, docType) && (
              <span className="section-complete-badge" style={{ marginLeft: 'auto' }}>
                <FontAwesomeIcon icon={faCheckCircle} />
                {form.disciplineName.slice(0, 22)}{form.disciplineName.length > 22 ? '…' : ''}
              </span>
            )}
          </div>

          {docType === 'rup' ? (
            <>
              <div className="fields-grid" style={{ marginBottom: 12 }}>
                <div className="field-card">
                  <div className="field-card-label">{t('sbs.detail_course')}</div>
                  <input className="field-card-input" placeholder={t('sbs.detail_course_placeholder')} value={form.course} onChange={e => set('course', e.target.value)} />
                </div>
                <div className="field-card">
                  <div className="field-card-label">{t('sbs.detail_semester')}</div>
                  <input className="field-card-input" placeholder={t('sbs.detail_semester_placeholder')} value={form.semester} onChange={e => set('semester', e.target.value)} />
                </div>
              </div>

              <div className="number-cards" style={{ marginBottom: 12 }}>
                <div className="number-card">
                  <div className="number-card-label">{t('sbs.detail_total_hours')}</div>
                  <input type="number" className="number-card-input" placeholder="150" value={form.totalHours} onChange={e => set('totalHours', e.target.value)} />
                  <div className="number-card-unit">{t('sbs.detail_hours_unit')}</div>
                </div>
                <div className="number-card">
                  <div className="number-card-label">{t('sbs.detail_credits')}</div>
                  <input type="number" className="number-card-input" placeholder="5" value={form.credits} onChange={e => set('credits', e.target.value)} />
                  <div className="number-card-unit">{t('sbs.detail_credits_unit')}</div>
                </div>
                <div className="number-card">
                  <div className="number-card-label">{t('sbs.detail_lectures')}</div>
                  <input type="number" className="number-card-input" placeholder="8" value={form.lectures} onChange={e => set('lectures', e.target.value)} />
                  <div className="number-card-unit">{t('sbs.detail_classes_unit')}</div>
                </div>
                <div className="number-card">
                  <div className="number-card-label">{t('sbs.detail_labs')}</div>
                  <input type="number" className="number-card-input" placeholder="0" value={form.labs} onChange={e => set('labs', e.target.value)} />
                  <div className="number-card-unit">{t('sbs.detail_classes_unit')}</div>
                </div>
                <div className="number-card">
                  <div className="number-card-label">{t('sbs.detail_practicals')}</div>
                  <input type="number" className="number-card-input" placeholder="8" value={form.practicals} onChange={e => set('practicals', e.target.value)} />
                  <div className="number-card-unit">{t('sbs.detail_classes_unit')}</div>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div className="field-card-label" style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.73rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-3)' }}>
                  <FontAwesomeIcon icon={faFlask} style={{ color: 'var(--accent)', opacity: 0.7 }} />
                  {t('sbs.detail_course_project')}
                </div>
                <div className="toggle-cards">
                  <button
                    type="button"
                    className={`toggle-card ${!form.hasKP ? 'active' : ''}`}
                    onClick={() => set('hasKP', false)}
                  >
                    <span className="toggle-card-check">{!form.hasKP && '✓'}</span>
                    {t('sbs.detail_without_kp')}
                  </button>
                  <button
                    type="button"
                    className={`toggle-card ${form.hasKP ? 'active' : ''}`}
                    onClick={() => set('hasKP', true)}
                  >
                    <span className="toggle-card-check">{form.hasKP && '✓'}</span>
                    {t('sbs.detail_with_kp')}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="fields-grid" style={{ marginBottom: 12 }}>
                <div className="field-card">
                  <div className="field-card-label">{t('sbs.detail_group')}</div>
                  <input className="field-card-input" placeholder={t('sbs.detail_group_placeholder')} value={form.group} onChange={e => set('group', e.target.value)} />
                </div>
                <div className="field-card">
                  <div className="field-card-label">{t('sbs.detail_control_type')}</div>
                  <input className="field-card-input" placeholder={t('sbs.detail_control_placeholder')} value={form.controlType} onChange={e => set('controlType', e.target.value)} />
                </div>
              </div>
              <div className="number-cards" style={{ marginBottom: 12 }}>
                <div className="number-card">
                  <div className="number-card-label">{t('sbs.detail_total_hours')}</div>
                  <input type="number" className="number-card-input" placeholder="120" value={form.totalHours} onChange={e => set('totalHours', e.target.value)} />
                  <div className="number-card-unit">{t('sbs.detail_hours_unit')}</div>
                </div>
                <div className="number-card">
                  <div className="number-card-label">{t('sbs.detail_weeks')}</div>
                  <input type="number" className="number-card-input" placeholder="15" value={form.weeks} onChange={e => set('weeks', e.target.value)} />
                  <div className="number-card-unit">{t('sbs.detail_weeks_unit')}</div>
                </div>
              </div>
              <div className="field-card" style={{ marginBottom: 12 }}>
                <div className="field-card-label">{t('sbs.detail_week_parity')}</div>
                <input className="field-card-input" placeholder={t('sbs.detail_parity_placeholder')} value={form.weekParity} onChange={e => set('weekParity', e.target.value)} />
                <div className="field-card-hint">{t('sbs.detail_parity_hint')}</div>
              </div>
            </>
          )}

          <button className="detail-next-btn" onClick={() => setActiveSection('teacher')}>
            {t('sbs.detail_next_teacher')} <FontAwesomeIcon icon={faArrowRight} />
          </button>
        </div>
      )}

      {/* Section 3 — Teacher */}
      {activeSection === 'teacher' && (
        <div className="detail-section" style={{ animationDelay: '0s' }}>
          <div className="detail-section-header">
            <div className="detail-section-num">3</div>
            <div>
              <div className="detail-section-title">{t('sbs.detail_teacher_title')}</div>
              <div className="detail-section-desc">{t('sbs.detail_teacher_desc')}</div>
            </div>
          </div>

          <div className="fields-grid" style={{ marginBottom: 12 }}>
            <div className="field-card">
              <div className="field-card-label">
                <FontAwesomeIcon icon={faUser} />
                {t('sbs.detail_teacher_name')}
              </div>
              <input className="field-card-input" placeholder={t('sbs.detail_teacher_placeholder')} value={form.teacherName} onChange={e => set('teacherName', e.target.value)} />
            </div>
            <div className="field-card">
              <div className="field-card-label">
                <FontAwesomeIcon icon={faBuilding} />
                {t('sbs.detail_department')}
              </div>
              <input className="field-card-input" placeholder={t('sbs.detail_department_placeholder')} value={form.department} onChange={e => set('department', e.target.value)} />
            </div>
          </div>

          {docType === 'rup' && (
            <>
              <div className="field-card" style={{ marginBottom: 12 }}>
                <div className="field-card-label">
                  <FontAwesomeIcon icon={faGraduationCap} />
                  {t('sbs.detail_program')}
                </div>
                <input className="field-card-input" placeholder={t('sbs.detail_program_placeholder')} value={form.program} onChange={e => set('program', e.target.value)} />
              </div>
              <div className="fields-grid" style={{ marginBottom: 12 }}>
                <div className="field-card">
                  <div className="field-card-label">{t('sbs.detail_prerequisites')}</div>
                  <input className="field-card-input" placeholder={t('sbs.detail_prerequisites_placeholder')} value={form.prerequisites} onChange={e => set('prerequisites', e.target.value)} />
                  <div className="field-card-hint">{t('sbs.detail_comma_separated')}</div>
                </div>
                <div className="field-card">
                  <div className="field-card-label">{t('sbs.detail_postrequisites')}</div>
                  <input className="field-card-input" placeholder={t('sbs.detail_postrequisites_placeholder')} value={form.postrequisites} onChange={e => set('postrequisites', e.target.value)} />
                  <div className="field-card-hint">{t('sbs.detail_comma_separated')}</div>
                </div>
              </div>
            </>
          )}

          <button className="detail-next-btn" onClick={() => setActiveSection('summary')}>
            {t('sbs.detail_next_summary')} <FontAwesomeIcon icon={faArrowRight} />
          </button>
        </div>
      )}

      {/* Section 4 — Summary */}
      {activeSection === 'summary' && (
        <div className="detail-section" style={{ animationDelay: '0s' }}>
          <div className="detail-section-header">
            <div className="detail-section-num" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>✓</div>
            <div>
              <div className="detail-section-title">{t('sbs.detail_summary_title')}</div>
              <div className="detail-section-desc">{t('sbs.detail_summary_desc')}</div>
            </div>
          </div>

          {/* Summary preview */}
          <div style={{
            background: 'var(--off-white)', border: '1px solid var(--border)',
            borderRadius: 'var(--r-lg)', padding: '16px 20px', marginBottom: 20,
            fontSize: '0.875rem', color: 'var(--text-2)', lineHeight: 1.8,
          }}>
            <strong style={{ color: 'var(--text)', fontWeight: 700 }}>{form.disciplineName}</strong>
            {form.disciplineCode && <span style={{ color: 'var(--text-3)' }}> · {form.disciplineCode}</span>}
            <br />
            {(form.course || form.semester) && (
              <span>{form.course && `${form.course} курс`}{form.semester && `, ${form.semester} сем.`}</span>
            )}
            {form.totalHours && <span> · {form.totalHours} ч.</span>}
            {form.credits && <span> · {form.credits} кр.</span>}
            {form.teacherName && <><br /><span>{t('sbs.detail_teacher_prefix')} {form.teacherName}</span></>}
            {form.program && <><br /><span>ОП: {form.program}</span></>}
            {docType === 'rup' && <><br /><span>{form.hasKP ? t('sbs.detail_with_kp_short') : t('sbs.detail_without_kp_short')}</span></>}
            {form.group && <><br /><span>{t('sbs.detail_group_prefix')} {form.group}</span></>}
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              className="prompt-gen-btn"
              onClick={() => onGenerate(buildPromptFromDetail(form, docType))}
              disabled={!form.disciplineName.trim() || isLoading}
              style={{ flex: 1, minWidth: 200, justifyContent: 'center' }}
            >
              {isLoading
                ? <><span className="btn-spinner" /><span>{t('sbs.generating')}</span></>
                : <><FontAwesomeIcon icon={faWandMagicSparkles} /><span>{t('sbs.create_document')}</span><FontAwesomeIcon icon={faArrowRight} className="btn-arrow" /></>
              }
            </button>
            <button
              onClick={() => setActiveSection('discipline')}
              style={{
                padding: '11px 18px', background: 'transparent',
                border: '1px solid var(--border)', borderRadius: '100px',
                color: 'var(--text-3)', fontSize: '0.855rem', fontWeight: 600,
                fontFamily: 'inherit', cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {t('sbs.detail_edit')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────
function SBSPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const { remaining, used, dailyLimit, isReady: isLimitReady, incrementOptimistic } = useGenerationLimit();
  const { language } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialGenerationMode = (searchParams.get('generationMode') as GenerationMode) || 'quick';
  const initialDocType = (searchParams.get('docType') as GenerationDocType) || 'rup';
  const initialPrompt = searchParams.get('prompt') || '';
  const initialFormData = searchParams.get('formData');

  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [syllabusData, setSyllabusData] = useState<SyllabusData | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseProgress, setParseProgress] = useState(0);
  const [selectedDocuments, setSelectedDocuments] = useState<DocumentType[]>([]);
  const [docGenStates, setDocGenStates] = useState<DocGenState[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationMode, setGenerationMode] = useState<GenerationMode>(initialGenerationMode);
  const [generationDocType, setGenerationDocType] = useState<GenerationDocType>(initialDocType);
  const [quickPrompt, setQuickPrompt] = useState(initialPrompt);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [rupFormData, setRupFormData] = useState<RupFormData | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [calendarFormData, setCalendarFormData] = useState<CalendarFormData | null>(null);
  const [isDocLoading, setIsDocLoading] = useState(false);

  useEffect(() => {
    if (initialFormData) {
      try {
        const parsedData = JSON.parse(decodeURIComponent(initialFormData));
        if (initialDocType === 'rup') { setRupFormData(parsedData as RupFormData); toast.success(t('sbs.form_data_loaded')); }
        else { setCalendarFormData(parsedData as CalendarFormData); toast.success(t('sbs.form_data_loaded')); }
      } catch (e) { console.error('Ошибка парсинга formData', e); }
    }
    if (initialPrompt) setQuickPrompt(initialPrompt);
  }, [t]); // eslint-disable-line

  useEffect(() => {
    if (isParsing) {
      const interval = setInterval(() => {
        setParseProgress(prev => { if (prev >= 90) { clearInterval(interval); return 90; } return prev + 10; });
      }, 300);
      return () => clearInterval(interval);
    }
  }, [isParsing]);

  const checkAuthAndLimit = (): boolean => {
    if (authLoading) { toast.error('Подождите, идёт загрузка...'); return false; }
    if (!user) { window.dispatchEvent(new CustomEvent('hivers:open-auth', { detail: { mode: 'login' } })); return false; }
    if (isLimitReady && remaining <= 0) { openLimitModal(used, dailyLimit); return false; }
    return true;
  };

  const handleQuickGenerate = async (prompt: string, docType: GenerationDocType) => {
    if (!prompt.trim()) { toast.error(t('errors.fill_required')); return; }
    if (!checkAuthAndLimit()) return;
    setIsDocLoading(true);
    try {
      const endpoint = docType === 'rup' ? `${API_BASE}/generate-from-prompt` : `${API_BASE}/generate-calendar-from-prompt`;
      const response = await apiFetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }) }, user?.id);
      if (!response.ok) throw new Error(`${t('errors.server_error')} ${response.status}`);
      const contentType = response.headers.get('Content-Type') || '';
      if (contentType.includes('application/json')) { const ed = await response.json(); throw new Error(ed.message || ed.error || 'Ошибка генерации'); }
      const blob = await response.blob();
      if (blob.size < 100) throw new Error('Сервер вернул пустой файл');
      const filename = docType === 'rup' ? 'sillabus.docx' : 'calendar.docx';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
      incrementOptimistic(); toast.success(t('sbs.document_created'));
    } catch (error: unknown) {
      if (error instanceof GlobalLimitExceededError) openGlobalLimitModal(error.globalUsed, error.globalLimit);
      else if (error instanceof LimitExceededError) openLimitModal(error.used, error.dailyLimit);
      else if (error instanceof AuthRequiredError || (error instanceof Error && error?.message === 'AUTH_REQUIRED')) { toast.error('Необходима авторизация'); window.dispatchEvent(new CustomEvent('hivers:open-auth', { detail: { mode: 'login' } })); }
      else if (error instanceof Error && error?.message) toast.error(error.message);
    } finally { setIsDocLoading(false); }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDetailedRupGenerate = async (formData: RupFormData) => {
    if (!checkAuthAndLimit()) return;
    setRupFormData(formData); setIsDocLoading(true);
    try {
      const response = await apiFetch(`${API_BASE}/generate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) }, user?.id);
      if (!response.ok) throw new Error(`${t('errors.server_error')} ${response.status}`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'sillabus.docx'; a.click(); URL.revokeObjectURL(url);
      incrementOptimistic(); toast.success(t('sbs.syllabus_created'));
    } catch (error: unknown) {
      if (error instanceof GlobalLimitExceededError) openGlobalLimitModal(error.globalUsed, error.globalLimit);
      else if (error instanceof LimitExceededError) openLimitModal(error.used, error.dailyLimit);
      else if (error instanceof AuthRequiredError || (error instanceof Error && error?.message === 'AUTH_REQUIRED')) { toast.error('Необходима авторизация'); window.dispatchEvent(new CustomEvent('hivers:open-auth', { detail: { mode: 'login' } })); }
      else if (error instanceof Error && error?.message) toast.error(error.message);
    } finally { setIsDocLoading(false); }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDetailedCalendarGenerate = async (formData: CalendarFormData) => {
    if (!checkAuthAndLimit()) return;
    setCalendarFormData(formData); setIsDocLoading(true);
    try {
      const response = await apiFetch(`${API_BASE}/generate-calendar`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) }, user?.id);
      if (!response.ok) throw new Error(`${t('errors.server_error')} ${response.status}`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'calendar.docx'; a.click(); URL.revokeObjectURL(url);
      incrementOptimistic(); toast.success(t('sbs.calendar_created'));
    } catch (error: unknown) {
      if (error instanceof GlobalLimitExceededError) openGlobalLimitModal(error.globalUsed, error.globalLimit);
      else if (error instanceof LimitExceededError) openLimitModal(error.used, error.dailyLimit);
      else if (error instanceof AuthRequiredError || (error instanceof Error && error?.message === 'AUTH_REQUIRED')) { toast.error('Необходима авторизация'); window.dispatchEvent(new CustomEvent('hivers:open-auth', { detail: { mode: 'login' } })); }
      else if (error instanceof Error && error?.message) toast.error(error.message);
    } finally { setIsDocLoading(false); }
  };

  const handleFileUpload = async (file: File) => {
    setUploadedFile(file); setCurrentStep('parse'); setIsParsing(true); setParseProgress(10);
    try {
      const formData = new FormData(); formData.append('file', file);
      const response = await fetch(`${API_BASE}/parse-syllabus`, { method: 'POST', body: formData });
      if (!response.ok) throw new Error(t('errors.file_upload_error'));
      const data = await response.json(); setParseProgress(100);
      setTimeout(() => { setSyllabusData(data); setCurrentStep('select'); setIsParsing(false); toast.success(t('sbs.syllabus_analyzed')); }, 500);
    } catch { toast.error(t('errors.file_upload_error')); setCurrentStep('upload'); setIsParsing(false); }
  };

  const toggleDocument = (docId: DocumentType) =>
    setSelectedDocuments(prev => prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]);

  const startGeneration = async () => {
    if (!checkAuthAndLimit()) return;
    if (!syllabusData || selectedDocuments.length === 0) return;
    const initialStates: DocGenState[] = selectedDocuments.map(id => ({ id, status: 'pending' }));
    setDocGenStates(initialStates); setCurrentStep('generate'); setIsGenerating(true);
    const updatedStates = [...initialStates];
    for (let i = 0; i < selectedDocuments.length; i++) {
      const docId = selectedDocuments[i];
      const step = STEPS.find(s => s.id === docId)!;
      updatedStates[i] = { ...updatedStates[i], status: 'running' }; setDocGenStates([...updatedStates]);
      try {
        const blob = await generateDocumentApi(docId, syllabusData, user?.id ?? '');
        const filename = `${step.label}_${syllabusData.discipline.slice(0, 18).trim()}.docx`;
        updatedStates[i] = { ...updatedStates[i], status: 'done', filename, blob }; setDocGenStates([...updatedStates]);
        incrementOptimistic(); toast.success(t('sbs.document_generated').replace('{label}', step.label));
      } catch (err: unknown) {
        if (err instanceof GlobalLimitExceededError) { updatedStates[i] = { ...updatedStates[i], status: 'error', error: 'Сервис недоступен' }; setDocGenStates([...updatedStates]); openGlobalLimitModal(err.globalUsed, err.globalLimit); break; }
        else if (err instanceof LimitExceededError) { updatedStates[i] = { ...updatedStates[i], status: 'error', error: 'Лимит исчерпан' }; setDocGenStates([...updatedStates]); openLimitModal(used, dailyLimit); break; }
        else if (err instanceof AuthRequiredError || (err instanceof Error && err?.message === 'AUTH_REQUIRED')) { updatedStates[i] = { ...updatedStates[i], status: 'error', error: 'Требуется авторизация' }; setDocGenStates([...updatedStates]); window.dispatchEvent(new CustomEvent('hivers:open-auth', { detail: { mode: 'login' } })); break; }
        const errMessage = err instanceof Error ? err.message : 'Unknown error';
        updatedStates[i] = { ...updatedStates[i], status: 'error', error: errMessage }; setDocGenStates([...updatedStates]);
        toast.error(t('sbs.document_error').replace('{label}', step.label).replace('{error}', errMessage));
      }
    }
    setIsGenerating(false); setCurrentStep('complete');
    const doneCount = updatedStates.filter(s => s.status === 'done').length;
    toast.success(t('sbs.generation_complete').replace('{done}', String(doneCount)).replace('{total}', String(selectedDocuments.length)));
  };

  const downloadDoc = (state: DocGenState) => {
    if (!state.blob || !state.filename) return;
    const url = URL.createObjectURL(state.blob);
    const a = document.createElement('a'); a.href = url; a.download = state.filename; a.click(); URL.revokeObjectURL(url);
  };

  const downloadAll = () => docGenStates.filter(s => s.status === 'done').forEach((s, i) => setTimeout(() => downloadDoc(s), i * 400));

  const getAvailableDocuments = () => {
    if (!syllabusData) return STEPS;
    return STEPS.map(step => {
      let disabled = false;
      switch (step.id) {
        case 'lectures': disabled = !syllabusData.hasLectures; break;
        case 'labs': disabled = !syllabusData.hasLabs; break;
        case 'practicals': disabled = !syllabusData.hasPracticals; break;
        case 'sro': disabled = !syllabusData.hasSRO; break;
        case 'srop': disabled = !syllabusData.hasSROP; break;
        case 'kp': disabled = !syllabusData.hasKP; break;
        case 'sro_full': disabled = !(syllabusData.hasSRO || syllabusData.hasSROP); break;
        default: disabled = false;
      }
      return { ...step, disabled };
    });
  };

  const STEPS: StepItem[] = [
    { id: 'calendar', icon: faCalendar, label: t('sbs.calendar'), description: t('sbs.calendar_desc'), color: '#6B8E7A' },
    { id: 'lectures', icon: faChalkboard, label: t('sbs.lectures'), description: t('sbs.lectures_desc'), color: '#9A7B8C' },
    { id: 'labs', icon: faMicroscope, label: t('sbs.labs'), description: t('sbs.labs_desc'), color: '#C49A6C' },
    { id: 'practicals', icon: faChalkboardUser, label: t('sbs.practicals'), description: t('sbs.practicals_desc'), color: '#7C9A92' },
    { id: 'sro', icon: faPenToSquare, label: t('sbs.sro'), description: t('sbs.sro_desc'), color: '#8A7C9A' },
    { id: 'srop', icon: faClipboardList, label: t('sbs.srop'), description: t('sbs.srop_desc'), color: '#9A8A7C' },
    { id: 'kp', icon: faLayerGroup, label: t('sbs.kp'), description: t('sbs.kp_desc'), color: '#7C8A9A' },
    { id: 'sro_full', icon: faFileLines, label: t('sbs.sro_full'), description: t('sbs.sro_full_desc'), color: '#4A7A8C' },
    { id: 'boundary_control', icon: faClipboardList, label: t('sbs.boundary_control'), description: t('sbs.boundary_control_desc'), color: '#A06A9A' },
    { id: 'final_control', icon: faGraduationCap, label: t('sbs.final_control'), description: t('sbs.final_control_desc'), color: '#6A8ACA' },
  ];

  const availableDocs = getAvailableDocuments();
  const doneCount = docGenStates.filter(s => s.status === 'done').length;
  const errorCount = docGenStates.filter(s => s.status === 'error').length;

  const resetFlow = () => { setCurrentStep('upload'); setUploadedFile(null); setSyllabusData(null); setSelectedDocuments([]); setDocGenStates([]); };

// Определяем интерфейсы для данных
interface ExampleItem {
  tag: string;
  label: string;
  text: string;
  hint: string;
}

// Получаем данные с правильной типизацией
let RUP_EXAMPLES: ExampleItem[] = [];
let CAL_EXAMPLES: ExampleItem[] = [];
let tipsRup: string[] = [];
let tipsCal: string[] = [];

try {
  // Пытаемся получить данные как объекты
  const rawRup = t('sbs.rup_examples');
  const rawCal = t('sbs.cal_examples');
  const rawTipsRup = t('sbs.tips_rup');
  const rawTipsCal = t('sbs.tips_calendar');
  
  // Проверяем и присваиваем
  RUP_EXAMPLES = Array.isArray(rawRup) ? rawRup as ExampleItem[] : [];
  CAL_EXAMPLES = Array.isArray(rawCal) ? rawCal as ExampleItem[] : [];
  tipsRup = Array.isArray(rawTipsRup) ? rawTipsRup as string[] : [];
  tipsCal = Array.isArray(rawTipsCal) ? rawTipsCal as string[] : [];
  
  // Если данные не загрузились, используем запасные
  if (RUP_EXAMPLES.length === 0) {
    RUP_EXAMPLES = [
      { tag: "⚡", label: "Пример 1 (рус.)", text: "Базы данных", hint: "Только название. ИИ сам придумает темы, цели и задачи." },
      { tag: "⚡", label: "Пример 2 (каз.)", text: "Қазақстан тарихы", hint: "Тек атауы жеткілікті. ИИ барлығын қазақша толтырады." },
      { tag: "📋", label: "Пример 3", text: "Базы данных, 5 кредитов, лекции 8, нет лабораторных, практических 8, без КП", hint: "Можно указать какие занятия нужны" },
      { tag: "🎯", label: "Пример 4 (рус.)", text: "Базы данных, преподаватель Иванов А.А., ОП: Информационные системы, кафедра: Информационные технологии, лекции 8, лабораторных 8, практических 8, без КП", hint: "Все поля заполнены — документ без плейсхолдеров" },
      { tag: "🎯", label: "Пример 5 (каз.)", text: "Қазақстан тарихы, оқытушы Нұрланов А.Б., кафедра: Тарих кафедрасы, дәріс 8, практика 8, КЖ жоқ", hint: "Барлық өрістер толтырылған — толықтай қазақша" }
    ];
  }
  
  if (CAL_EXAMPLES.length === 0) {
    CAL_EXAMPLES = [
      { tag: "⚡", label: "Пример 1", text: "История Казахстана, сгенерируй с темами", hint: "ИИ сам определит темы и часы" },
      { tag: "📋", label: "Пример 2", text: "Математика, группа ИС-24-1, 120 часов, 15 недель, зачёт, преподаватель Алиева Г.С., сгенерируй с темами", hint: "Группа, часы, контроль и преподаватель" },
      { tag: "🗓️", label: "Пример 3", text: "Физика, группа ХТ-23-1, 150 часов, 15 недель, экзамен, лекции по числителям, лабораторные по знаменателям, сгенерируй с темами", hint: "ИИ учтёт чётность недель" },
      { tag: "🎯", label: "Пример 4 (каз.)", text: "Деректер қорлары, қазақша, ИС-24-1 тобы, 150 сағат, 15 апта, емтихан, оқытушы ТАӘ, дәрістер аптасына бір рет, зертханалық жұмыстар екі аптада бір рет, тақырыптарды генерацияла", hint: "Барлық деректер, соның ішінде кесте" }
    ];
  }
  
  if (tipsRup.length === 0) {
    tipsRup = ["Название дисциплины", "Код (напр. VBD 3213)", "ФИО преподавателя", "ОП и пререквизиты", "КП или «без КП»"];
  }
  
  if (tipsCal.length === 0) {
    tipsCal = ["Название дисциплины", "Группа", "Количество часов", "Форма контроля", "Чётность недель"];
  }
  
} catch (error) {
  console.error('Error loading translations:', error);
  // Запасные значения на случай ошибки
  RUP_EXAMPLES = [
    { tag: "⚡", label: "Пример 1 (рус.)", text: "Базы данных", hint: "Только название. ИИ сам придумает темы, цели и задачи." },
    { tag: "⚡", label: "Пример 2 (каз.)", text: "Қазақстан тарихы", hint: "Тек атауы жеткілікті. ИИ барлығын қазақша толтырады." },
    { tag: "📋", label: "Пример 3", text: "Базы данных, 5 кредитов, лекции 8, нет лабораторных, практических 8, без КП", hint: "Можно указать какие занятия нужны" },
    { tag: "🎯", label: "Пример 4 (рус.)", text: "Базы данных, преподаватель Иванов А.А., ОП: Информационные системы, кафедра: Информационные технологии, лекции 8, лабораторных 8, практических 8, без КП", hint: "Все поля заполнены — документ без плейсхолдеров" },
    { tag: "🎯", label: "Пример 5 (каз.)", text: "Қазақстан тарихы, оқытушы Нұрланов А.Б., кафедра: Тарих кафедрасы, дәріс 8, практика 8, КЖ жоқ", hint: "Барлық өрістер толтырылған — толықтай қазақша" }
  ];
  CAL_EXAMPLES = [
    { tag: "⚡", label: "Пример 1", text: "Биология, сгенерируй с темами", hint: "ИИ сам определит темы и часы" },
    { tag: "📋", label: "Пример 2", text: "Математика, группа ИС-24-1, 120 часов, 15 недель, зачёт, преподаватель Алиева Г.С., сгенерируй с темами", hint: "Группа, часы, контроль и преподаватель" },
    { tag: "🗓️", label: "Пример 3", text: "Химия, группа ХТ-23-1, 150 часов, 15 недель, экзамен, лекции по числителям, лабораторные по знаменателям, сгенерируй с темами", hint: "ИИ учтёт чётность недель" },
    { tag: "🎯", label: "Пример 4 (каз.)", text: "Деректер қорлары, қазақша, ИС-24-1 тобы, 150 сағат, 15 апта, емтихан, оқытушы ТАӘ, дәрістер аптасына бір рет, зертханалық жұмыстар екі аптада бір рет, тақырыптарды генерацияла", hint: "Барлық деректер, соның ішінде кесте" }
  ];
  tipsRup = ["Название дисциплины", "Код (напр. VBD 3213)", "ФИО преподавателя", "ОП и пререквизиты", "КП или «без КП»"];
  tipsCal = ["Название дисциплины", "Группа", "Количество часов", "Форма контроля", "Чётность недель"];
}

// Используем полученные данные
const examples = generationDocType === 'rup' ? RUP_EXAMPLES : CAL_EXAMPLES;
const tips = generationDocType === 'rup' ? tipsRup : tipsCal;

  return (
    <div className="sbs-page">
      <Header solidBg={true} />

      <main className="sbs-main">
        <div className="sbs-container">

          {/* ══ HERO HEADER ══ */}
          <div className="sbs-header">
            <div className="sbs-header-left">
              <div className="sbs-badge">
                <span className="sbs-badge-dot" />
                <FontAwesomeIcon icon={faWandMagicSparkles} />
                <span>{t('sbs.step_by_step')}</span>
              </div>
              <h1 className="sbs-title">
                {t('sbs.title')} <em>{t('sbs.title_gradient')}</em>
              </h1>
              <p className="sbs-subtitle">{t('sbs.subtitle')}</p>
            </div>

            <div className="sbs-hero-stats">
              <div className="sbs-stat">
                <div className="sbs-stat-icon"><FontAwesomeIcon icon={faRocket} /></div>
                <div className="sbs-stat-body">
                  <span className="sbs-stat-num">30s</span>
                  <span className="sbs-stat-label">{t('sbs.seconds')}</span>
                </div>
              </div>
              <div className="sbs-stat">
                <div className="sbs-stat-icon"><FontAwesomeIcon icon={faFileWord} /></div>
                <div className="sbs-stat-body">
                  <span className="sbs-stat-num">2</span>
                  <span className="sbs-stat-label">{t('sbs.doc_types')}</span>
                </div>
              </div>
              <div className="sbs-stat">
                <div className="sbs-stat-icon"><FontAwesomeIcon icon={faWandMagicSparkles} /></div>
                <div className="sbs-stat-body">
                  <span className="sbs-stat-num">AI</span>
                  <span className="sbs-stat-label">{t('sbs.ai_generation')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ══ GEN BLOCK ══ */}
          <div className="gen-block">
            <div className="gen-block-bg">
              <div className="gen-sphere gen-sphere-1" />
              <div className="gen-sphere gen-sphere-2" />
              <div className="gen-sphere gen-sphere-3" />
            </div>

            <div className="gen-block-inner">

              {/* Top label */}
              <div className="gen-block-top">
                <div className="gen-block-label">
                  <span className="gen-block-label-dot" />
                  <FontAwesomeIcon icon={faWandMagicSparkles} />
                  <span>{t('sbs.generation')}</span>
                </div>
                <span className="gen-block-desc">{t('sbs.generation_desc')}</span>
              </div>

              {/* ── Mode switcher (Apple segment control) ── */}
              <div className="gen-mode-switcher">
                <button
                  className={`gen-mode-btn ${generationMode === 'quick' ? 'active' : ''}`}
                  onClick={() => setGenerationMode('quick')}
                >
                  <div className="gm-icon"><FontAwesomeIcon icon={faRocket} /></div>
                  <div className="gm-text">
                    <span className="gm-name">{t('sbs.quick_mode')}</span>
                    <span className="gm-hint">{t('sbs.promt_desc')}</span>
                  </div>
                </button>
                <button
                  className={`gen-mode-btn ${generationMode === 'detailed' ? 'active' : ''}`}
                  onClick={() => setGenerationMode('detailed')}
                >
                  <div className="gm-icon"><FontAwesomeIcon icon={faGear} /></div>
                  <div className="gm-text">
                    <span className="gm-name">{t('sbs.detailed_mode')}</span>
                    <span className="gm-hint">{t('sbs.form_desc')}</span>
                  </div>
                </button>
              </div>

              {/* ── Doc type pills ── */}
              <div className="gen-doctype-row">
                <span className="gen-doctype-label">{t('sbs.type_label')}</span>
                <button
                  className={`gen-pill ${generationDocType === 'rup' ? 'active' : ''}`}
                  onClick={() => setGenerationDocType('rup')}
                >
                  <FontAwesomeIcon icon={faBook} />
                  <span>{t('sbs.rup')}</span>
                </button>
                <button
                  className={`gen-pill ${generationDocType === 'calendar' ? 'active' : ''}`}
                  onClick={() => setGenerationDocType('calendar')}
                >
                  <FontAwesomeIcon icon={faCalendar} />
                  <span>{t('sbs.calendar')}</span>
                </button>
              </div>

              {/* ══ QUICK PANEL ══ */}
              {generationMode === 'quick' && (
                <div className="quick-panel">

                  {/* Prompt field */}
                  <div className={`prompt-wrap ${quickPrompt ? 'filled' : ''}`}>
                    <div className="prompt-header">
                      <div className="prompt-header-left">
                        <div className="prompt-header-icon">
                          <FontAwesomeIcon icon={faWandMagicSparkles} />
                        </div>
                        <span className="prompt-header-title">
                          {generationDocType === 'rup' ? t('sbs.describe_syllabus') : t('sbs.describe_calendar')}
                        </span>
                      </div>
                      <span className="prompt-counter">
                        <b>{quickPrompt.length}</b>/5000
                      </span>
                    </div>

                    <textarea
                      value={quickPrompt}
                      onChange={e => setQuickPrompt(e.target.value)}
                      placeholder={generationDocType === 'rup' ? t('sbs.prompt_placeholder_rup') : t('sbs.prompt_placeholder_calendar')}
                      rows={4}
                      maxLength={5000}
                      className="prompt-textarea"
                    />
                    <div className="prompt-shine" />

                    <div className="prompt-footer">
                      <div className="prompt-chips">
                        <span className="prompt-chip"><FontAwesomeIcon icon={faClock} /> 30–90 {t('sbs.seconds')}</span>
                        <span className="prompt-chip"><FontAwesomeIcon icon={faFileWord} /> .docx</span>
                        <span className="prompt-chip"><FontAwesomeIcon icon={faStar} /> AI</span>
                      </div>
                      <button
                        className="prompt-gen-btn"
                        onClick={() => handleQuickGenerate(quickPrompt, generationDocType)}
                        disabled={!quickPrompt.trim() || isDocLoading}
                      >
                        {isDocLoading
                          ? <><span className="btn-spinner" /><span>{t('sbs.generating')}</span></>
                          : <><span>{t('sbs.create_document')}</span><FontAwesomeIcon icon={faArrowRight} className="btn-arrow" /></>
                        }
                      </button>
                    </div>
                  </div>

                  {/* Tips + Examples */}
                  <div className="quick-bottom-grid">

                    <div className="tips-card">
                      <div className="tips-card-header">
                        <div className="tips-card-icon"><FontAwesomeIcon icon={faStar} /></div>
                        <span className="tips-card-title">{t('sbs.tips_title')}</span>
                      </div>
                      <div className="tips-list">
                        {tips.map((tip, i) => (
                          <div key={i} className="tip-row" style={{ animationDelay: `${i * 0.06}s` }}>
                            <span className="tip-bullet" />
                            <span>{tip}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="examples-card">
                      <div className="examples-card-header">
                        <div className="examples-card-icon"><FontAwesomeIcon icon={faWandMagicSparkles} /></div>
                        <span className="examples-card-title">{t('sbs.examples_title')}</span>
                      </div>
                      <div className="examples-list">
                        {examples.map((ex, i) => (
                          <div
                            key={i}
                            className="example-row"
                            style={{ animationDelay: `${i * 0.05}s` }}
                            onClick={() => { setQuickPrompt(ex.text); toast.success(t('sbs.example_applied')); }}
                          >
                            <div className="example-row-body">
                              <div className="example-row-top">
                                <span className="example-tag-emoji">{ex.tag}</span>
                                <span className="example-tag-label">{ex.label}</span>
                              </div>
                              <span className="example-text">{ex.text.length > 72 ? ex.text.slice(0, 72) + '…' : ex.text}</span>
                              <span className="example-hint">{ex.hint}</span>
                            </div>
                            <div className="example-apply">
                              <FontAwesomeIcon icon={faArrowRight} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* ══ DETAILED PANEL ══ */}
              {generationMode === 'detailed' && (
                <ProgressiveDetailForm
                  docType={generationDocType}
                  isLoading={isDocLoading}
                  onGenerate={(prompt) => handleQuickGenerate(prompt, generationDocType)}
                />
              )}

            </div>
          </div>

          {/* Separator */}
          <div className="block-separator">
            <div className="separator-line" />
            <div className="separator-icon"><FontAwesomeIcon icon={faChevronDown} /></div>
            <div className="separator-line" />
          </div>

          {/* ══ PART 2: SBS from Syllabus (UNCHANGED) ══ */}
          <div className="content-block">
            <div className="block-header">
              <div className="block-icon"><FontAwesomeIcon icon={faUpload} /></div>
              <div>
                <h2 className="block-title">{t('sbs.sbs_from_syllabus')}</h2>
                <p className="block-subtitle">{t('sbs.sbs_desc')}</p>
              </div>
            </div>

            <div className="syllabus-flow-content">
              {/* Progress track */}
              <div className="sbs-progress-track">
                {['upload', 'parse', 'select', 'generate', 'complete'].map((step, index) => {
                  const isActive = currentStep === step;
                  const isCompleted =
                    (step === 'upload' && uploadedFile) ||
                    (step === 'parse' && syllabusData) ||
                    (step === 'select' && selectedDocuments.length > 0) ||
                    (step === 'generate' && docGenStates.length > 0) ||
                    (step === 'complete' && currentStep === 'complete');
                  const stepLabels = [t('sbs.upload'), t('sbs.analysis'), t('sbs.select'), t('sbs.generation'), t('sbs.done')];
                  return (
                    <React.Fragment key={step}>
                      <div className={`progress-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                        <div className="step-indicator">
                          {isCompleted ? <FontAwesomeIcon icon={faCheckCircle} /> : <span>{index + 1}</span>}
                        </div>
                        <span className="step-label">{stepLabels[index]}</span>
                      </div>
                      {index < 4 && <div className={`progress-line ${isCompleted ? 'active' : ''}`} />}
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Step 1: Upload */}
              {currentStep === 'upload' && (
                <div className="sbs-step-content upload-step">
                  <div
                    className="upload-area"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => { e.preventDefault(); const file = e.dataTransfer.files[0]; if (file) handleFileUpload(file); }}
                  >
                    <input ref={fileInputRef} type="file" accept=".doc,.docx,.pdf,.txt"
                      onChange={e => { const file = e.target.files?.[0]; if (file) handleFileUpload(file); }}
                      style={{ display: 'none' }}
                    />
                    <div className="upload-icon-wrapper"><FontAwesomeIcon icon={faUpload} className="upload-icon" /></div>
                    <h3 className="upload-title">{t('sbs.upload_area')}</h3>
                    <p className="upload-description">{t('sbs.upload_desc')}</p>
                    <p className="upload-hint">{t('sbs.upload_hint')}</p>
                    <button className="upload-btn"><FontAwesomeIcon icon={faFileImport} /> {t('sbs.select_file')}</button>
                  </div>
                </div>
              )}

              {/* Step 2: Parse */}
              {currentStep === 'parse' && (
                <div className="sbs-step-content parse-step">
                  <div className="parse-animation">
                    <div className="parse-spinner">
                      <FontAwesomeIcon icon={faFileWord} className="brain-icon" />
                      <div className="spinner-ring" />
                    </div>
                    <h3 className="parse-title">{t('sbs.analyzing')}</h3>
                    <p className="parse-subtitle">{t('sbs.analyzing_desc')}</p>
                    <div className="parse-progress">
                      <div className="progress-bar"><div className="progress-fill" style={{ width: `${parseProgress}%` }} /></div>
                      <span className="progress-text">{parseProgress}%</span>
                    </div>
                    <div className="parse-messages">
                      {parseProgress < 30 && t('sbs.reading_doc')}
                      {parseProgress >= 30 && parseProgress < 60 && t('sbs.finding_sections')}
                      {parseProgress >= 60 && parseProgress < 90 && t('sbs.analyzing_structure')}
                      {parseProgress >= 90 && t('sbs.almost_ready')}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Select */}
              {currentStep === 'select' && (
                <div className="sbs-step-content select-step">
                  {syllabusData && (
                    <div className="select-header">
                      <div className="syllabus-info">
                        <FontAwesomeIcon icon={faBook} className="syllabus-icon" />
                        <div>
                          <h3 className="syllabus-title">{syllabusData.discipline}</h3>
                          <p className="syllabus-meta">
                            {syllabusData.hours && `• ${syllabusData.hours} ${t('sbs.hours')}`}
                            {syllabusData.teacher && ` • ${syllabusData.teacher}`}
                          </p>
                        </div>
                      </div>
                      <div className="select-actions">
                        <button className="select-action-btn" onClick={() => setSelectedDocuments(availableDocs.filter(d => !d.disabled).map(d => d.id))}>{t('sbs.select_all')}</button>
                        <button className="select-action-btn" onClick={() => setSelectedDocuments([])}>{t('sbs.clear')}</button>
                      </div>
                    </div>
                  )}
                  <div className="docs-grid">
                    {availableDocs.map(doc => (
                      <div
                        key={doc.id}
                        className={`doc-card ${selectedDocuments.includes(doc.id) ? 'selected' : ''} ${doc.disabled ? 'disabled' : ''}`}
                        style={{ '--card-color': doc.color } as React.CSSProperties}
                        onClick={() => !doc.disabled && toggleDocument(doc.id)}
                      >
                        <div className="doc-card-header">
                          <div className="doc-icon-wrapper" style={{ background: `${doc.color}20` }}>
                            <FontAwesomeIcon icon={doc.icon} style={{ color: doc.color }} />
                          </div>
                          {doc.disabled
                            ? <span className="doc-disabled-badge">{t('sbs.not_in_syllabus')}</span>
                            : selectedDocuments.includes(doc.id)
                              ? <FontAwesomeIcon icon={faCheckCircle} style={{ color: doc.color }} className="doc-check" />
                              : <FontAwesomeIcon icon={faCircle} style={{ color: 'rgba(0,0,0,0.12)' }} className="doc-check" />
                          }
                        </div>
                        <div className="doc-title">{doc.label}</div>
                        <div className="doc-description">{doc.description}</div>
                      </div>
                    ))}
                  </div>
                  <div className="select-footer">
                    <span className="selected-count">{t('sbs.selected')}: <span>{selectedDocuments.length}</span> {t('sbs.documents')}</span>
                    <button className="generate-start-btn" onClick={startGeneration} disabled={selectedDocuments.length === 0}>
                      <FontAwesomeIcon icon={faRocket} />
                      {t('sbs.create_selected')}
                      <FontAwesomeIcon icon={faArrowRight} className="btn-icon" />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4: Generating */}
              {currentStep === 'generate' && (
                <div className="sbs-step-content generate-step">
                  <div className="generate-header">
                    <h3 className="generate-title"><FontAwesomeIcon icon={faWandMagicSparkles} />{t('sbs.generating_docs')}</h3>
                    <p className="generate-subtitle">{isGenerating ? t('sbs.processing') : t('sbs.completed')}</p>
                  </div>
                  <div className="generate-queue">
                    {docGenStates.map((state) => {
                      const doc = STEPS.find(s => s.id === state.id)!;
                      return (
                        <div key={state.id} className={`queue-item ${state.status}`}>
                          <div className="queue-item-left">
                            <div className={`queue-icon ${state.status}`}>
                              {state.status === 'running' ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={doc.icon} />}
                            </div>
                            <div className="queue-info">
                              <span className="queue-title">{doc.label}</span>
                              <span className={`queue-status ${state.status}`}>
                                {state.status === 'pending' && t('sbs.pending')}
                                {state.status === 'running' && t('sbs.running')}
                                {state.status === 'done' && `✓ ${t('sbs.done')}`}
                                {state.status === 'error' && `${t('sbs.error')}: ${state.error}`}
                              </span>
                            </div>
                          </div>
                          {state.status === 'done' && <button className="queue-download-btn" onClick={() => downloadDoc(state)} title={t('sbs.download')}><FontAwesomeIcon icon={faDownload} /></button>}
                          {state.status === 'error' && <FontAwesomeIcon icon={faExclamationTriangle} style={{ color: '#ef4444', fontSize: '1.2rem' }} />}
                          {state.status === 'done' && <FontAwesomeIcon icon={faCheckCircle} className="queue-check" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 5: Complete */}
              {currentStep === 'complete' && (
                <div className="sbs-step-content complete-step">
                  <div className="complete-animation">
                    <div className="complete-checkmark"><FontAwesomeIcon icon={faCheckCircle} /></div>
                    <h2 className="complete-title">{t('sbs.generation_complete_title')}</h2>
                    <p className="complete-description">
                      {t('sbs.generation_complete_desc').replace('{done}', String(doneCount)).replace('{total}', String(docGenStates.length))}
                      {errorCount > 0 && ` (${t('sbs.errors')}: ${errorCount})`}
                    </p>
                    <div className="complete-files-list">
                      {docGenStates.map((state) => {
                        const doc = STEPS.find(s => s.id === state.id)!;
                        return (
                          <div key={state.id} className={`complete-file-item ${state.status}`}>
                            <div className="complete-file-left">
                              <div className="complete-file-icon" style={{ background: `${doc.color}20` }}><FontAwesomeIcon icon={doc.icon} style={{ color: doc.color }} /></div>
                              <div className="complete-file-info">
                                <span className="complete-file-name">{doc.label}</span>
                                {state.filename && <span className="complete-file-fname">{state.filename}</span>}
                                {state.status === 'error' && <span className="complete-file-error">{state.error}</span>}
                              </div>
                            </div>
                            {state.status === 'done' && <button className="complete-download-btn" onClick={() => downloadDoc(state)}><FontAwesomeIcon icon={faDownload} /> {t('sbs.download')}</button>}
                            {state.status === 'error' && <span className="complete-error-badge">{t('sbs.error')}</span>}
                          </div>
                        );
                      })}
                    </div>
                    <div className="complete-actions">
                      {doneCount > 1 && <button className="complete-action-btn primary" onClick={downloadAll}><FontAwesomeIcon icon={faDownload} /> {t('sbs.download_all')} ({doneCount})</button>}
                      <button className="complete-action-btn" onClick={() => router.push(`/${language}/canvas`)}><FontAwesomeIcon icon={faLayerGroup} /> {t('sbs.go_to_editor')}</button>
                      <button className="complete-action-btn" onClick={resetFlow}><FontAwesomeIcon icon={faRocket} /> {t('sbs.create_again')}</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>

      <SBSPageStyles />
    </div>
  );
}

export default function SBSPage() {
  return (
    <Suspense fallback={<div style={{ background: '#fff', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' }}>Загрузка...</div>}>
      <SBSPageInner />
    </Suspense>
  );
}