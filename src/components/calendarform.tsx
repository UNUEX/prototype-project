import React, { useState, useCallback, memo } from 'react';
import { toast } from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCalendar, faClock, faUser, faDownload, faBook,
  faCalendarWeek, faWandMagicSparkles, faArrowRight,
  faMagic, faUpload, faPlus, faTrash, faUsers,
  faChevronDown, faChevronUp, faInfoCircle, faGraduationCap,
  faLayerGroup, faBolt, faGear, faHashtag
} from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { useTranslation } from '@/hooks/useTranslation';

// ─── ИНТЕРФЕЙСЫ ──────────────────────────────────────────────────────────────

export interface ScheduleConfig {
  intervalDays: number;
  startOffset: number;
  parity?: 'all' | 'numerator' | 'denominator';
}

export interface CalendarFormData {
  subject: string;
  grade: string;
  hours: string;
  weeks: string;
  teacher: string;
  language?: 'russian' | 'kazakh' | 'english';
  code?: string;
  credits?: string;
  semester?: string;
  group?: string;
  academicYear?: string;
  controlType?: string;
  startDate?: string;
  endDate?: string;
  parityType?: 'all' | 'numerator' | 'denominator';
  numeratorDays?: string[];
  denominatorDays?: string[];
  useParity?: boolean;
  hasSubgroups?: boolean;
  subgroupAppliesTo?: ('labs' | 'practicals' | 'lectures')[];
  scheduleConfigs?: {
    lectures?:   ScheduleConfig;
    labs?:       ScheduleConfig;
    practicals?: ScheduleConfig;
    srop?:       ScheduleConfig;
  };
  lectureTopics?: string[];
  labTopics?: string[];
  practicalTopics?: string[];
  sropTopics?: string[];  // темы СРОП — юзер вводит вручную
}

interface CalendarFormProps {
  onSubmit: (data: CalendarFormData) => Promise<void>;
  isLoading: boolean;
  initialData?: Partial<CalendarFormData>;
}

// Тип для импортированного силлабуса
interface ImportedSyllabus {
  discipline?: string;
  hours?: number;
  lectureTopics?: string[];
  labTopics?: string[];
  practicalTopics?: string[];
  sropTopics?: string[];
}

// ─── ВСПОМОГАТЕЛЬНЫЕ КОМПОНЕНТЫ ───────────────────────────────────────────────

// Современное поле ввода с анимацией
interface FieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  icon?: IconDefinition;
  children: React.ReactNode;
}

const Field: React.FC<FieldProps> = ({ label, required, hint, icon, children }) => (
  <div className="cf-field">
    <label className="cf-label">
      <span>{label}</span>
      {required && <span className="cf-required">*</span>}
      {hint && (
        <span className="cf-hint-icon" title={hint}>
          <FontAwesomeIcon icon={faInfoCircle} />
        </span>
      )}
    </label>
    <div className="cf-input-container">
      {icon && <FontAwesomeIcon icon={icon} className="cf-input-icon" />}
      {children}
      <div className="cf-input-glow" />
    </div>
  </div>
);

// Премиум-карточка-секция с эффектом свечения
interface SectionProps {
  icon: IconDefinition;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
}

const Section: React.FC<SectionProps> = ({ icon, title, subtitle, children, collapsible = false, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="cf-section">
      <div className="cf-section-glow" />
      <div
        className={`cf-section-header ${collapsible ? 'cf-section-header--clickable' : ''}`}
        onClick={collapsible ? () => setOpen(o => !o) : undefined}
      >
        <div className="cf-section-icon">
          <FontAwesomeIcon icon={icon} />
        </div>
        <div className="cf-section-title">
          <h3>{title}</h3>
          {subtitle && <span className="cf-section-subtitle">{subtitle}</span>}
        </div>
        {collapsible && (
          <div className="cf-section-toggle">
            <FontAwesomeIcon icon={open ? faChevronUp : faChevronDown} />
          </div>
        )}
      </div>
      {(!collapsible || open) && <div className="cf-section-body">{children}</div>}
    </div>
  );
};

// Редактор тем с премиальным дизайном
interface TopicsEditorProps {
  label: string;
  topics: string[];
  onChange: (topics: string[]) => void;
  placeholder?: string;
  hint?: string;
}

const TopicsEditor = memo<TopicsEditorProps>(({ label, topics, onChange, placeholder, hint }) => {
  const { t } = useTranslation();
  const [newTopic, setNewTopic] = useState('');

  const add = useCallback(() => {
    const v = newTopic.trim();
    if (!v) return;
    onChange([...topics, v]);
    setNewTopic('');
  }, [newTopic, topics, onChange]);

  const remove = useCallback((i: number) => {
    onChange(topics.filter((_, idx) => idx !== i));
  }, [topics, onChange]);

  const update = useCallback((i: number, val: string) => {
    const next = [...topics];
    next[i] = val;
    onChange(next);
  }, [topics, onChange]);

  return (
    <div className="cf-topics">
      <div className="cf-topics-header">
        <span className="cf-topics-label">{label}</span>
        {topics.length > 0 && <span className="cf-topics-badge">{topics.length}</span>}
      </div>

      {hint && <p className="cf-topics-hint">{hint}</p>}

      {topics.length > 0 && (
        <div className="cf-topics-list">
          {topics.map((topic, i) => (
            <div key={i} className="cf-topic-row">
              <span className="cf-topic-num">{i + 1}</span>
              <input
                type="text"
                value={topic}
                onChange={e => update(i, e.target.value)}
                className="cf-input cf-topic-input"
                placeholder={placeholder}
              />
              <button type="button" className="cf-topic-del" onClick={() => remove(i)}
                title={t('calendar_form.delete')}>
                <FontAwesomeIcon icon={faTrash} />
              </button>
              <div className="cf-topic-glow" />
            </div>
          ))}
        </div>
      )}

      <div className="cf-topic-add">
        <div className="cf-input-container cf-input-container--inline">
          <input
            type="text"
            value={newTopic}
            onChange={e => setNewTopic(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
            placeholder={topics.length === 0
              ? (t('calendar_form.add_topic') + (placeholder ? ` (${placeholder})` : ''))
              : t('calendar_form.add_another_topic')}
            className="cf-input"
          />
          <div className="cf-input-glow" />
        </div>
        <button type="button" className="cf-btn cf-btn--secondary" onClick={add} disabled={!newTopic.trim()}>
          <FontAwesomeIcon icon={faPlus} />
          <span>{t('calendar_form.add')}</span>
        </button>
      </div>

      {topics.length === 0 && (
        <p className="cf-topics-empty">{t('calendar_form.topics_empty_hint')}</p>
      )}
    </div>
  );
});

TopicsEditor.displayName = 'TopicsEditor';

// ─── ГЛАВНАЯ ФОРМА ────────────────────────────────────────────────────────────

const CalendarForm = ({ onSubmit, isLoading, initialData }: CalendarFormProps) => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  const getDefaultStart = () => {
    const d = new Date();
    return `${d.getMonth() >= 8 ? d.getFullYear() + 1 : d.getFullYear()}-01-26`;
  };
  const calcEnd = (start: string, weeks: number) => {
    const d = new Date(start);
    d.setDate(d.getDate() + weeks * 7);
    return d.toISOString().split('T')[0];
  };

  const defaultStart = getDefaultStart();

  const [formData, setFormData] = useState<CalendarFormData>({
    subject: '', grade: '', hours: '150', weeks: '15', teacher: '',
    language: 'russian', semester: '2', code: '', credits: '5',
    group: '', academicYear: `${currentYear}-${currentYear + 1}`,
    controlType: 'exam',
    startDate: defaultStart,
    endDate: calcEnd(defaultStart, 15),
    parityType: 'all', useParity: false,
    numeratorDays: ['1', '3', '5'], denominatorDays: ['2', '4'],
    hasSubgroups: false, subgroupAppliesTo: ['labs'],
    scheduleConfigs: {
      lectures:   { intervalDays: 7,  startOffset: 0 },
      labs:       { intervalDays: 7,  startOffset: 1 },
      practicals: { intervalDays: 7,  startOffset: 2 },
      srop:       { intervalDays: 14, startOffset: 3 },
    },
    lectureTopics: [], labTopics: [], practicalTopics: [], sropTopics: [],
    ...initialData,
  });

  const [isUploading, setIsUploading] = useState(false);
  const [importedSyllabus, setImportedSyllabus] = useState<ImportedSyllabus | null>(null);
  const [activeTab, setActiveTab] = useState<'main' | 'schedule' | 'topics'>('main');

  // Обработчики
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    const val = type === 'checkbox' ? checked : value;

    setFormData(prev => {
      const next = { ...prev, [name]: val };
      if (name === 'startDate' && value) {
        next.endDate = calcEnd(value, parseInt(prev.weeks) || 15);
      }
      if (name === 'weeks' && prev.startDate) {
        next.endDate = calcEnd(prev.startDate, parseInt(value) || 15);
      }
      return next;
    });
  }, []);

  const handleDayToggle = useCallback((parityType: 'numerator' | 'denominator', day: string) => {
    setFormData(prev => {
      const key = parityType === 'numerator' ? 'numeratorDays' : 'denominatorDays';
      const cur = prev[key] || [];
      const next = cur.includes(day) ? cur.filter(d => d !== day) : [...cur, day].sort();
      return { ...prev, [key]: next };
    });
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/parse-syllabus`, {
        method: 'POST', body: fd,
      });
      if (!res.ok) throw new Error();
      const parsed = await res.json() as ImportedSyllabus;
      setImportedSyllabus(parsed);
      setFormData(prev => ({
        ...prev,
        subject: parsed.discipline || prev.subject,
        hours: parsed.hours?.toString() || prev.hours,
        lectureTopics: parsed.lectureTopics || [],
        labTopics: parsed.labTopics || [],
        practicalTopics: parsed.practicalTopics || [],
        sropTopics: parsed.sropTopics || [],  // СРОП темы из силлабуса
      }));
      toast.success(t('calendar_form.syllabus_loaded')
        .replace('{lectures}', String(parsed.lectureTopics?.length || 0))
        .replace('{labs}', String(parsed.labTopics?.length || 0)));
    } catch {
      toast.error(t('errors.file_upload_error'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject.trim()) return toast.error(t('errors.fill_required'));
    if (!formData.grade.trim())   return toast.error(t('calendar_form.enter_course'));
    if (!formData.teacher.trim()) return toast.error(t('calendar_form.enter_teacher'));
    if (!formData.group?.trim())  return toast.error(t('calendar_form.enter_group'));
    if (formData.startDate && formData.endDate && new Date(formData.startDate) >= new Date(formData.endDate))
      return toast.error(t('calendar_form.date_error'));
    if (formData.useParity) {
      if (!formData.numeratorDays?.length)   return toast.error(t('calendar_form.numerator_error'));
      if (!formData.denominatorDays?.length) return toast.error(t('calendar_form.denominator_error'));
    }
    try { await onSubmit(formData); } catch {}
  };

  const updateScheduleCfg = useCallback((
    key: 'lectures' | 'labs' | 'practicals' | 'srop',
    field: 'intervalDays' | 'startOffset',
    val: number
  ) => {
    setFormData(prev => ({
      ...prev,
      scheduleConfigs: {
        ...prev.scheduleConfigs,
        [key]: { ...(prev.scheduleConfigs?.[key] || { intervalDays: 7, startOffset: 0 }), [field]: val }
      }
    }));
  }, []);

  const onLectureTopicsChange = useCallback((topics: string[]) =>
    setFormData(prev => ({ ...prev, lectureTopics: topics })), []);
  const onLabTopicsChange = useCallback((topics: string[]) =>
    setFormData(prev => ({ ...prev, labTopics: topics })), []);
  const onPracticalTopicsChange = useCallback((topics: string[]) =>
    setFormData(prev => ({ ...prev, practicalTopics: topics })), []);
  const onSropTopicsChange = useCallback((topics: string[]) =>
    setFormData(prev => ({ ...prev, sropTopics: topics })), []);

  const presets = [
    { subject: t('calendar_form.preset_python'), grade: t('calendar_form.preset_python_grade'), hours: '150', weeks: '15', group: 'КН-25-1', credits: '5' },
    { subject: t('calendar_form.preset_db'),     grade: t('calendar_form.preset_db_grade'),     hours: '150', weeks: '15', group: 'ИС-24-1', credits: '5' },
    { subject: t('calendar_form.preset_web'),    grade: t('calendar_form.preset_web_grade'),     hours: '160', weeks: '16', group: 'ВТ-24-1', credits: '5' },
  ];

  const weekDays = [
    { value: '1', label: t('calendar_form.mon') },
    { value: '2', label: t('calendar_form.tue') },
    { value: '3', label: t('calendar_form.wed') },
    { value: '4', label: t('calendar_form.thu') },
    { value: '5', label: t('calendar_form.fri') },
    { value: '6', label: t('calendar_form.sat') },
    { value: '7', label: t('calendar_form.sun') },
  ];

  const scheduleTypes = [
    { key: 'lectures'   as const, label: t('calendar_form.lectures')   || 'Лекции' },
    { key: 'labs'       as const, label: t('calendar_form.labs')       || 'Лабораторные' },
    { key: 'practicals' as const, label: t('calendar_form.practicals') || 'Практические' },
    { key: 'srop'       as const, label: 'СРОП' },
  ];

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        /* ════ PREMIUM DESIGN SYSTEM ════════════════════════════════════════ */
        .cf-root {
          --cf-bg-dark: #03050c;
          --cf-surface: #0c0f1a;
          --cf-surface-light: #141b2b;
          --cf-surface-lighter: #1e2740;
          --cf-border: rgba(99,102,241,0.15);
          --cf-border-hover: rgba(99,102,241,0.35);
          --cf-border-focus: #6366f1;
          --cf-accent: #6366f1;
          --cf-accent-soft: #818cf8;
          --cf-accent-glow: rgba(99,102,241,0.3);
          --cf-accent-gradient: linear-gradient(135deg, #6366f1, #8b5cf6, #a78bfa);
          --cf-text: #ffffff;
          --cf-text-dim: #a0aec0;
          --cf-text-muted: #5a6a85;
          --cf-success: #10b981;
          --cf-danger: #ef4444;
          --cf-warning: #f59e0b;
          --cf-radius: 24px;
          --cf-radius-md: 16px;
          --cf-radius-sm: 12px;
          --cf-radius-xs: 8px;
          --cf-shadow: 0 20px 48px -12px rgba(0,0,0,0.8), 0 0 0 1px rgba(99,102,241,0.1);
          --cf-glow: 0 0 30px var(--cf-accent-glow);
          font-family: inherit;
        }

        /* Основной контейнер */
        .cf-root {
          background: transparent;
          color: var(--cf-text);
          padding: 0;
        }

        /* Табы навигации */
        .cf-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 28px;
          padding: 4px;
          background: rgba(12, 15, 26, 0.6);
          border: 1px solid var(--cf-border);
          border-radius: 60px;
          backdrop-filter: blur(10px);
        }

        .cf-tab {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 12px 18px;
          border-radius: 40px;
          border: none;
          background: transparent;
          color: var(--cf-text-dim);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
          position: relative;
          overflow: hidden;
        }

        .cf-tab::before {
          content: '';
          position: absolute;
          inset: 0;
          background: var(--cf-accent-gradient);
          opacity: 0;
          transition: opacity 0.3s;
          z-index: -1;
        }

        .cf-tab:hover {
          color: var(--cf-text);
          background: rgba(99,102,241,0.1);
        }

        .cf-tab.active {
          background: var(--cf-accent-gradient);
          color: white;
          box-shadow: 0 8px 20px -4px var(--cf-accent-glow);
        }

        .cf-tab.active .cf-tab-icon {
          color: white;
        }

        .cf-tab-icon {
          font-size: 14px;
          color: var(--cf-text-muted);
          transition: color 0.3s;
        }

        /* Сетка форм */
        .cf-grid {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        /* Премиум-секция с эффектом стекла */
        .cf-section {
          position: relative;
          background: rgba(12, 15, 26, 0.7);
          backdrop-filter: blur(12px);
          border: 1px solid var(--cf-border);
          border-radius: var(--cf-radius);
          overflow: hidden;
          transition: all 0.3s;
          box-shadow: var(--cf-shadow);
        }

        .cf-section:hover {
          border-color: var(--cf-border-hover);
          box-shadow: 0 24px 56px -12px rgba(99,102,241,0.3);
        }

        .cf-section-glow {
          position: absolute;
          inset: 0;
          background: radial-gradient(800px circle at var(--x, 50%) var(--y, 50%), 
                      rgba(99,102,241,0.15), transparent 70%);
          opacity: 0;
          transition: opacity 0.5s;
          pointer-events: none;
        }

        .cf-section:hover .cf-section-glow {
          opacity: 0.6;
        }

        .cf-section-header {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 22px 26px;
          background: linear-gradient(90deg, rgba(99,102,241,0.08), transparent);
          border-bottom: 1px solid var(--cf-border);
          position: relative;
          cursor: pointer;
        }

        .cf-section-header--clickable {
          transition: background 0.2s;
        }

        .cf-section-header--clickable:hover {
          background: linear-gradient(90deg, rgba(99,102,241,0.15), rgba(99,102,241,0.02));
        }

        .cf-section-icon {
          width: 48px;
          height: 48px;
          border-radius: 18px;
          background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.1));
          border: 1px solid rgba(99,102,241,0.3);
          color: var(--cf-accent-soft);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          box-shadow: 0 8px 16px -4px rgba(99,102,241,0.2);
        }

        .cf-section-title {
          flex: 1;
        }

        .cf-section-title h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
          background: linear-gradient(135deg, #fff, #e0e7ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .cf-section-subtitle {
          font-size: 13px;
          color: var(--cf-text-muted);
          margin-top: 4px;
          display: block;
        }

        .cf-section-toggle {
          width: 36px;
          height: 36px;
          border-radius: 12px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.05);
          color: var(--cf-text-dim);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .cf-section-toggle:hover {
          background: rgba(99,102,241,0.15);
          color: var(--cf-accent-soft);
        }

        .cf-section-body {
          padding: 26px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* Поля ввода */
        .cf-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .cf-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--cf-text-dim);
        }

        .cf-required {
          color: var(--cf-accent);
          font-size: 16px;
        }

        .cf-hint-icon {
          color: var(--cf-text-muted);
          cursor: help;
          font-size: 12px;
        }

        .cf-input-container {
          position: relative;
          width: 100%;
        }

        .cf-input-container .cf-input-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--cf-text-muted);
          font-size: 14px;
          z-index: 1;
          transition: color 0.2s;
        }

        .cf-input-container:focus-within .cf-input-icon {
          color: var(--cf-accent-soft);
        }

        .cf-input {
          width: 100%;
          padding: 14px 18px;
          background: rgba(20, 27, 43, 0.8);
          border: 1.5px solid var(--cf-border);
          border-radius: var(--cf-radius-md);
          color: var(--cf-text);
          font-size: 14px;
          font-family: inherit;
          outline: none;
          transition: all 0.25s;
          position: relative;
          z-index: 1;
        }

        .cf-input:hover {
          border-color: var(--cf-border-hover);
          background: rgba(30, 39, 64, 0.9);
        }

        .cf-input:focus {
          border-color: var(--cf-border-focus);
          background: rgba(30, 39, 64, 0.95);
          box-shadow: 0 0 0 4px rgba(99,102,241,0.15);
        }

        .cf-input-container--inline .cf-input {
          border-radius: var(--cf-radius-sm) 0 0 var(--cf-radius-sm);
        }

        .cf-input-glow {
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), 
                      rgba(99,102,241,0.3), transparent 80%);
          opacity: 0;
          transition: opacity 0.3s;
          pointer-events: none;
        }

        .cf-input-container:hover .cf-input-glow {
          opacity: 0.5;
        }

        .cf-input-container:focus-within .cf-input-glow {
          opacity: 0.8;
        }

        .cf-input.with-icon {
          padding-left: 44px;
        }

        .cf-select {
          width: 100%;
          padding: 14px 44px 14px 18px;
          background: rgba(20, 27, 43, 0.8);
          border: 1.5px solid var(--cf-border);
          border-radius: var(--cf-radius-md);
          color: var(--cf-text);
          font-size: 14px;
          font-family: inherit;
          outline: none;
          cursor: pointer;
          transition: all 0.25s;
          -webkit-appearance: none;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236366f1' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 16px center;
        }

        .cf-select:hover {
          border-color: var(--cf-border-hover);
          background: rgba(30, 39, 64, 0.9);
        }

        .cf-select:focus {
          border-color: var(--cf-border-focus);
          box-shadow: 0 0 0 4px rgba(99,102,241,0.15);
        }

        /* Сетки */
        .cf-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .cf-row-3 {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 16px;
        }

        /* Информационная карточка */
        .cf-info-card {
          background: linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.04));
          border: 1px solid rgba(99,102,241,0.2);
          border-radius: var(--cf-radius-sm);
          padding: 20px;
        }

        .cf-info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid rgba(99,102,241,0.1);
        }

        .cf-info-row:last-child {
          border-bottom: none;
        }

        .cf-info-label {
          font-size: 13px;
          color: var(--cf-text-muted);
        }

        .cf-info-value {
          font-size: 14px;
          color: var(--cf-accent-soft);
          font-weight: 600;
        }

        /* Тогглы */
        .cf-toggle {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px 20px;
          background: rgba(20, 27, 43, 0.6);
          border: 1.5px solid var(--cf-border);
          border-radius: var(--cf-radius-sm);
          cursor: pointer;
          transition: all 0.25s;
        }

        .cf-toggle:hover {
          border-color: var(--cf-border-hover);
          background: rgba(30, 39, 64, 0.8);
        }

        .cf-toggle.active {
          border-color: var(--cf-accent);
          background: linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.08));
        }

        .cf-toggle-track {
          width: 44px;
          height: 24px;
          border-radius: 30px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.1);
          position: relative;
          transition: all 0.3s;
        }

        .cf-toggle.active .cf-toggle-track {
          background: var(--cf-accent-gradient);
          border-color: transparent;
        }

        .cf-toggle-track::after {
          content: '';
          position: absolute;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: white;
          top: 2px;
          left: 2px;
          transition: transform 0.3s;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }

        .cf-toggle.active .cf-toggle-track::after {
          transform: translateX(20px);
        }

        .cf-toggle-content {
          flex: 1;
        }

        .cf-toggle-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--cf-text);
        }

        .cf-toggle-desc {
          font-size: 12px;
          color: var(--cf-text-muted);
          margin-top: 2px;
        }

        /* Дни недели */
        .cf-days-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-top: 16px;
        }

        .cf-days-col-label {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 12px;
          font-weight: 600;
          color: var(--cf-text-dim);
          margin-bottom: 12px;
        }

        .cf-days-badge {
          padding: 3px 10px;
          border-radius: 30px;
          background: rgba(99,102,241,0.2);
          color: var(--cf-accent-soft);
          font-size: 10px;
          font-weight: 700;
        }

        .cf-days-grid {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .cf-day-btn {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          border: 1.5px solid var(--cf-border);
          background: rgba(20, 27, 43, 0.8);
          color: var(--cf-text-muted);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .cf-day-btn:hover {
          border-color: var(--cf-accent);
          color: var(--cf-accent-soft);
          background: rgba(99,102,241,0.1);
        }

        .cf-day-btn.active {
          background: var(--cf-accent-gradient);
          border-color: transparent;
          color: white;
          box-shadow: 0 4px 16px var(--cf-accent-glow);
        }

        /* Расписание */
        .cf-schedule-table {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .cf-schedule-row {
          display: grid;
          grid-template-columns: 140px 1fr 1fr;
          gap: 16px;
          align-items: center;
          padding: 18px 22px;
          background: rgba(20, 27, 43, 0.6);
          border: 1.5px solid var(--cf-border);
          border-radius: var(--cf-radius-sm);
          transition: all 0.25s;
        }

        .cf-schedule-row:hover {
          border-color: var(--cf-border-hover);
          background: rgba(30, 39, 64, 0.8);
        }

        .cf-schedule-name {
          font-size: 14px;
          font-weight: 600;
          color: var(--cf-text-dim);
        }

        .cf-schedule-field {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: var(--cf-text-muted);
        }

        .cf-schedule-field .cf-input {
          width: 70px;
          padding: 10px;
          text-align: center;
        }

        .cf-schedule-hint {
          font-size: 11px;
          color: var(--cf-accent-soft);
          margin-top: 4px;
          opacity: 0.8;
        }

        /* Темы */
        .cf-topics {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .cf-topics-header {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .cf-topics-label {
          font-size: 14px;
          font-weight: 600;
          color: var(--cf-text-dim);
        }

        .cf-topics-badge {
          padding: 3px 10px;
          border-radius: 30px;
          background: rgba(99,102,241,0.2);
          color: var(--cf-accent-soft);
          font-size: 11px;
          font-weight: 700;
        }

        .cf-topics-hint {
          font-size: 12px;
          color: var(--cf-text-muted);
          margin: 0;
        }

        .cf-topics-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .cf-topic-row {
          display: flex;
          align-items: center;
          gap: 10px;
          position: relative;
        }

        .cf-topic-num {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.1));
          border: 1px solid rgba(99,102,241,0.2);
          color: var(--cf-accent-soft);
          font-size: 12px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .cf-topic-input {
          flex: 1;
          padding: 12px 16px;
        }

        .cf-topic-del {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: transparent;
          border: 1.5px solid var(--cf-border);
          color: var(--cf-text-muted);
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .cf-topic-del:hover {
          border-color: var(--cf-danger);
          color: var(--cf-danger);
          background: rgba(239,68,68,0.1);
        }

        .cf-topic-glow {
          position: absolute;
          inset: 0;
          border-radius: var(--cf-radius-sm);
          background: radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), 
                      rgba(99,102,241,0.2), transparent 80%);
          opacity: 0;
          pointer-events: none;
        }

        .cf-topic-row:hover .cf-topic-glow {
          opacity: 0.5;
        }

        .cf-topic-add {
          display: flex;
          gap: 10px;
          margin-top: 8px;
        }

        .cf-topic-add .cf-input-container {
          flex: 1;
        }

        .cf-topics-empty {
          font-size: 13px;
          color: var(--cf-text-muted);
          font-style: italic;
          padding: 16px;
          text-align: center;
          border: 1px dashed var(--cf-border);
          border-radius: var(--cf-radius-sm);
        }

        /* Кнопки */
        .cf-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 14px 24px;
          border-radius: var(--cf-radius-md);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s;
          border: none;
          font-family: inherit;
          position: relative;
          overflow: hidden;
        }

        .cf-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
          transform: translateX(-100%);
          transition: transform 0.5s;
        }

        .cf-btn:hover::before {
          transform: translateX(100%);
        }

        .cf-btn--primary {
          background: var(--cf-accent-gradient);
          color: white;
          box-shadow: 0 8px 20px -4px var(--cf-accent-glow);
        }

        .cf-btn--primary:hover {
          box-shadow: 0 12px 28px -4px var(--cf-accent);
          transform: translateY(-2px);
        }

        .cf-btn--secondary {
          background: rgba(30, 39, 64, 0.9);
          border: 1.5px solid var(--cf-border);
          color: var(--cf-text-dim);
        }

        .cf-btn--secondary:hover {
          border-color: var(--cf-accent);
          color: var(--cf-accent-soft);
          background: rgba(40, 52, 82, 0.9);
        }

        .cf-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          pointer-events: none;
        }

        /* Пресеты */
        .cf-presets {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .cf-preset {
          display: flex;
          align-items: center;
          gap: 18px;
          padding: 20px 24px;
          background: rgba(20, 27, 43, 0.7);
          border: 1.5px solid var(--cf-border);
          border-radius: var(--cf-radius-sm);
          cursor: pointer;
          transition: all 0.25s;
          position: relative;
          overflow: hidden;
        }

        .cf-preset::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 4px;
          background: var(--cf-accent-gradient);
          opacity: 0;
          transition: opacity 0.25s;
        }

        .cf-preset:hover {
          border-color: var(--cf-accent);
          background: rgba(30, 39, 64, 0.9);
          transform: translateX(4px);
        }

        .cf-preset:hover::before {
          opacity: 1;
        }

        .cf-preset-icon {
          width: 48px;
          height: 48px;
          border-radius: 16px;
          background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.1));
          border: 1px solid rgba(99,102,241,0.3);
          color: var(--cf-accent-soft);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
        }

        .cf-preset-info {
          flex: 1;
        }

        .cf-preset-name {
          font-size: 15px;
          font-weight: 600;
          color: var(--cf-text);
          margin-bottom: 4px;
        }

        .cf-preset-meta {
          font-size: 12px;
          color: var(--cf-text-muted);
          display: flex;
          gap: 8px;
        }

        .cf-preset-arrow {
          color: var(--cf-text-muted);
          transition: transform 0.25s;
        }

        .cf-preset:hover .cf-preset-arrow {
          color: var(--cf-accent-soft);
          transform: translateX(4px);
        }

        /* Загрузка */
        .cf-upload-zone {
          position: relative;
          border: 2px dashed var(--cf-border);
          border-radius: var(--cf-radius-md);
          padding: 32px;
          text-align: center;
          cursor: pointer;
          transition: all 0.25s;
          background: linear-gradient(135deg, rgba(99,102,241,0.03), transparent);
        }

        .cf-upload-zone:hover {
          border-color: var(--cf-accent);
          background: rgba(99,102,241,0.05);
        }

        .cf-upload-zone input {
          position: absolute;
          inset: 0;
          opacity: 0;
          cursor: pointer;
        }

        .cf-upload-icon {
          font-size: 32px;
          color: var(--cf-accent-soft);
          margin-bottom: 12px;
        }

        .cf-upload-text {
          font-size: 14px;
          color: var(--cf-text-muted);
        }

        .cf-upload-text strong {
          color: var(--cf-accent-soft);
        }

        /* Кнопка отправки */
        .cf-submit-block {
          margin-top: 16px;
        }

        .cf-submit-btn {
          width: 100%;
          padding: 20px 32px;
          background: var(--cf-accent-gradient);
          color: white;
          border: none;
          border-radius: var(--cf-radius);
          font-size: 18px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          transition: all 0.3s;
          box-shadow: 0 12px 36px -8px var(--cf-accent-glow);
          position: relative;
          overflow: hidden;
        }

        .cf-submit-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transform: translateX(-100%);
          transition: transform 0.6s;
        }

        .cf-submit-btn:hover::before {
          transform: translateX(100%);
        }

        .cf-submit-btn:hover {
          box-shadow: 0 20px 48px -8px var(--cf-accent);
          transform: translateY(-2px);
        }

        .cf-submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .cf-spinner {
          width: 22px;
          height: 22px;
          border: 3px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .cf-submit-meta {
          display: flex;
          justify-content: center;
          gap: 28px;
          margin-top: 18px;
        }

        .cf-submit-hint {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: var(--cf-text-muted);
        }

        .cf-submit-hint svg {
          color: var(--cf-accent-soft);
        }

        /* Адаптив */
        @media (max-width: 768px) {
          .cf-tabs {
            flex-direction: column;
            border-radius: 30px;
          }

          .cf-row, .cf-row-3 {
            grid-template-columns: 1fr;
          }

          .cf-days-section {
            grid-template-columns: 1fr;
          }

          .cf-schedule-row {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .cf-submit-meta {
            flex-direction: column;
            align-items: center;
            gap: 12px;
          }
        }
      `}</style>

      <div className="cf-root">
        <form onSubmit={handleSubmit}>
          {/* Навигационные табы */}
          <div className="cf-tabs">
            <button
              type="button"
              className={`cf-tab ${activeTab === 'main' ? 'active' : ''}`}
              onClick={() => setActiveTab('main')}
            >
              <FontAwesomeIcon icon={faBook} className="cf-tab-icon" />
              <span>{t('calendar_form.main_info') || 'Основное'}</span>
            </button>
            <button
              type="button"
              className={`cf-tab ${activeTab === 'schedule' ? 'active' : ''}`}
              onClick={() => setActiveTab('schedule')}
            >
              <FontAwesomeIcon icon={faCalendarWeek} className="cf-tab-icon" />
              <span>{t('calendar_form.schedule') || 'Расписание'}</span>
            </button>
            <button
              type="button"
              className={`cf-tab ${activeTab === 'topics' ? 'active' : ''}`}
              onClick={() => setActiveTab('topics')}
            >
              <FontAwesomeIcon icon={faLayerGroup} className="cf-tab-icon" />
              <span>{t('calendar_form.topics') || 'Темы'}</span>
            </button>
          </div>

          <div className="cf-grid">
            {/* Вкладка: Основное */}
            {activeTab === 'main' && (
              <>
                {/* Импорт силлабуса */}
                <Section icon={faUpload} title={t('calendar_form.import_syllabus')} subtitle={t('calendar_form.import_subtitle')}>
                  <div className="cf-upload-zone">
                    <input type="file" accept=".doc,.docx,.pdf,.txt" onChange={handleFileUpload} disabled={isUploading} />
                    <FontAwesomeIcon icon={faUpload} className="cf-upload-icon" />
                    <div className="cf-upload-text">
                      {isUploading ? (
                        t('calendar_form.uploading')
                      ) : (
                        <>
                          <strong>{t('calendar_form.upload_file')}</strong> {t('calendar_form.or_drag')}
                        </>
                      )}
                    </div>
                  </div>

                  {importedSyllabus && (
                    <div className="cf-info-card">
                      <div className="cf-info-row">
                        <span className="cf-info-label">{t('calendar_form.discipline')}</span>
                        <span className="cf-info-value">{importedSyllabus.discipline}</span>
                      </div>
                      <div className="cf-info-row">
                        <span className="cf-info-label">{t('calendar_form.lectures')}</span>
                        <span className="cf-info-value">{importedSyllabus.lectureTopics?.length || 0} тем</span>
                      </div>
                      <div className="cf-info-row">
                        <span className="cf-info-label">{t('calendar_form.labs')}</span>
                        <span className="cf-info-value">{importedSyllabus.labTopics?.length || 0} тем</span>
                      </div>
                      <div className="cf-info-row">
                        <span className="cf-info-label">{t('calendar_form.hours')}</span>
                        <span className="cf-info-value">{importedSyllabus.hours} ч.</span>
                      </div>
                    </div>
                  )}
                </Section>

                {/* Основная информация */}
                <Section icon={faBook} title={t('calendar_form.discipline')} subtitle={t('calendar_form.basic_info')}>
                  <Field label={t('calendar_form.name')} required icon={faBook}>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder={t('calendar_form.name_placeholder')}
                      className="cf-input with-icon"
                      required
                    />
                  </Field>

                  <div className="cf-row">
                    <Field label={t('calendar_form.code')} icon={faHashtag}>
                      <input
                        type="text"
                        name="code"
                        value={formData.code || ''}
                        onChange={handleChange}
                        placeholder="VBD 3213"
                        className="cf-input with-icon"
                      />
                    </Field>

                    <Field label={t('calendar_form.credits')} icon={faGraduationCap}>
                      <input
                        type="number"
                        name="credits"
                        value={formData.credits || ''}
                        onChange={handleChange}
                        min="1"
                        max="15"
                        placeholder="5"
                        className="cf-input with-icon"
                      />
                    </Field>
                  </div>

                  <div className="cf-row">
                    <Field label={t('calendar_form.course_semester')} required icon={faCalendar}>
                      <input
                        type="text"
                        name="grade"
                        value={formData.grade}
                        onChange={handleChange}
                        placeholder={t('calendar_form.course_placeholder')}
                        className="cf-input with-icon"
                        required
                      />
                    </Field>

                    <Field label={t('calendar_form.group')} required icon={faUsers}>
                      <input
                        type="text"
                        name="group"
                        value={formData.group || ''}
                        onChange={handleChange}
                        placeholder={t('calendar_form.group_placeholder')}
                        className="cf-input with-icon"
                        required
                      />
                    </Field>
                  </div>

                  <div className="cf-row">
                    <Field label={t('calendar_form.teacher')} required icon={faUser}>
                      <input
                        type="text"
                        name="teacher"
                        value={formData.teacher}
                        onChange={handleChange}
                        placeholder={t('calendar_form.teacher_placeholder')}
                        className="cf-input with-icon"
                        required
                      />
                    </Field>

                    <Field label={t('calendar_form.academic_year')} icon={faCalendar}>
                      <input
                        type="text"
                        name="academicYear"
                        value={formData.academicYear || ''}
                        onChange={handleChange}
                        placeholder="2025-2026"
                        className="cf-input with-icon"
                      />
                    </Field>
                  </div>

                  <div className="cf-row-3">
                    <Field label={t('calendar_form.total_hours')} icon={faClock}>
                      <input
                        type="number"
                        name="hours"
                        value={formData.hours}
                        onChange={handleChange}
                        min="30"
                        max="300"
                        className="cf-input with-icon"
                      />
                    </Field>

                    <Field label={t('calendar_form.weeks')} icon={faCalendarWeek}>
                      <input
                        type="number"
                        name="weeks"
                        value={formData.weeks}
                        onChange={handleChange}
                        min="1"
                        max="52"
                        className="cf-input with-icon"
                      />
                    </Field>

                    <Field label={t('calendar_form.control_form')}>
                      <select name="controlType" value={formData.controlType} onChange={handleChange} className="cf-select">
                        <option value="exam">{t('calendar_form.exam')}</option>
                        <option value="credit">{t('calendar_form.credit')}</option>
                        <option value="course_project">{t('calendar_form.course_project')}</option>
                      </select>
                    </Field>
                  </div>

                  {/* Тоггл подгрупп */}
                  <div
                    className={`cf-toggle ${formData.hasSubgroups ? 'active' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, hasSubgroups: !prev.hasSubgroups }))}
                  >
                    <div className="cf-toggle-track" />
                    <div className="cf-toggle-content">
                      <div className="cf-toggle-title">{t('calendar_form.has_subgroups') || 'Есть подгруппы'}</div>
                      <div className="cf-toggle-desc">{t('calendar_form.subgroups_hint') || '2 колонки дат для лабораторных'}</div>
                    </div>
                  </div>

                  {formData.hasSubgroups && (
                    <div>
                      <div className="cf-label" style={{ marginBottom: 12 }}>
                        {t('calendar_form.subgroups_applies_to') || 'Применять для:'}
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {(['labs', 'practicals', 'lectures'] as const).map(type => {
                          const labels: Record<string, string> = {
                            labs: t('calendar_form.labs') || 'Лабораторные',
                            practicals: t('calendar_form.practicals') || 'Практические',
                            lectures: t('calendar_form.lectures') || 'Лекции',
                          };
                          const active = (formData.subgroupAppliesTo || ['labs']).includes(type);
                          return (
                            <button
                              key={type}
                              type="button"
                              className={`cf-btn cf-btn--secondary ${active ? 'active' : ''}`}
                              style={active ? { background: 'rgba(99,102,241,0.2)', borderColor: '#6366f1' } : {}}
                              onClick={() => {
                                const cur = formData.subgroupAppliesTo || ['labs'];
                                setFormData(prev => ({
                                  ...prev,
                                  subgroupAppliesTo: active ? cur.filter(t => t !== type) : [...cur, type]
                                }));
                              }}
                            >
                              {labels[type]}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </Section>
              </>
            )}

            {/* Вкладка: Расписание */}
            {activeTab === 'schedule' && (
              <>
                <Section icon={faCalendarWeek} title={t('calendar_form.schedule_periods')} subtitle={t('calendar_form.dates_and_parity')}>
                  <div className="cf-row">
                    <Field label={t('calendar_form.start_date')} icon={faCalendar}>
                      <input
                        type="date"
                        name="startDate"
                        value={formData.startDate || ''}
                        onChange={handleChange}
                        className="cf-input with-icon"
                      />
                    </Field>

                    <Field label={t('calendar_form.end_date')} hint={t('calendar_form.end_date_hint')} icon={faCalendar}>
                      <input
                        type="date"
                        name="endDate"
                        value={formData.endDate || ''}
                        onChange={handleChange}
                        className="cf-input with-icon"
                        disabled
                      />
                    </Field>
                  </div>

                  <div className="cf-info-card">
                    <div className="cf-info-row">
                      <span className="cf-info-label">{t('calendar_form.start')}:</span>
                      <span className="cf-info-value">{formData.startDate || '—'}</span>
                    </div>
                    <div className="cf-info-row">
                      <span className="cf-info-label">{t('calendar_form.end')}:</span>
                      <span className="cf-info-value">{formData.endDate || '—'}</span>
                    </div>
                    <div className="cf-info-row">
                      <span className="cf-info-label">{t('calendar_form.weeks_short')}:</span>
                      <span className="cf-info-value">{formData.weeks}</span>
                    </div>
                  </div>

                  {/* Чётность */}
                  <div
                    className={`cf-toggle ${formData.useParity ? 'active' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, useParity: !prev.useParity }))}
                  >
                    <div className="cf-toggle-track" />
                    <div className="cf-toggle-content">
                      <div className="cf-toggle-title">{t('calendar_form.use_parity')}</div>
                      <div className="cf-toggle-desc">{t('calendar_form.parity_hint') || 'Настройка чётных/нечётных недель'}</div>
                    </div>
                  </div>

                  {formData.useParity && (
                    <div className="cf-days-section">
                      <div>
                        <div className="cf-days-col-label">
                          <span>{t('calendar_form.numerator')}</span>
                          <span className="cf-days-badge">{t('calendar_form.odd')}</span>
                        </div>
                        <div className="cf-days-grid">
                          {weekDays.map(day => (
                            <button
                              key={day.value}
                              type="button"
                              className={`cf-day-btn ${(formData.numeratorDays || []).includes(day.value) ? 'active' : ''}`}
                              onClick={() => handleDayToggle('numerator', day.value)}
                            >
                              {day.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="cf-days-col-label">
                          <span>{t('calendar_form.denominator')}</span>
                          <span className="cf-days-badge">{t('calendar_form.even')}</span>
                        </div>
                        <div className="cf-days-grid">
                          {weekDays.map(day => (
                            <button
                              key={day.value}
                              type="button"
                              className={`cf-day-btn ${(formData.denominatorDays || []).includes(day.value) ? 'active' : ''}`}
                              onClick={() => handleDayToggle('denominator', day.value)}
                            >
                              {day.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </Section>

                <Section icon={faGear} title={t('calendar_form.schedule_per_type') || 'Расписание по типам'} subtitle={t('calendar_form.schedule_subtitle')}>
                  <div className="cf-schedule-table">
                    {scheduleTypes.map(({ key, label }) => {
                      const cfg = formData.scheduleConfigs?.[key] || { intervalDays: 7, startOffset: 0 };
                      return (
                        <div key={key} className="cf-schedule-row">
                          <div className="cf-schedule-name">{label}</div>
                          <div className="cf-schedule-field">
                            <span>{t('calendar_form.every')}</span>
                            <input
                              type="number"
                              value={cfg.intervalDays}
                              min={1}
                              max={28}
                              onChange={e => updateScheduleCfg(key, 'intervalDays', parseInt(e.target.value) || 7)}
                              className="cf-input"
                            />
                            <span>{t('calendar_form.days')}</span>
                          </div>
                          <div>
                            <div className="cf-schedule-field">
                              <span>{t('calendar_form.start_offset')}</span>
                              <input
                                type="number"
                                value={cfg.startOffset}
                                min={0}
                                max={13}
                                onChange={e => updateScheduleCfg(key, 'startOffset', parseInt(e.target.value) || 0)}
                                className="cf-input"
                              />
                              <span>{t('calendar_form.days')}</span>
                            </div>
                            <div className="cf-schedule-hint">
                              {cfg.intervalDays === 7 ? t('calendar_form.weekly') :
                               cfg.intervalDays === 14 ? t('calendar_form.biweekly') :
                               `${t('calendar_form.every')} ${cfg.intervalDays} ${t('calendar_form.days')}`}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Section>
              </>
            )}

            {/* Вкладка: Темы */}
            {activeTab === 'topics' && (
              <Section icon={faLayerGroup} title={t('calendar_form.topics')} subtitle={t('calendar_form.topics_subtitle')}>
                <TopicsEditor
                  label={t('calendar_form.lecture_topics')}
                  topics={formData.lectureTopics || []}
                  onChange={onLectureTopicsChange}
                  placeholder={t('calendar_form.lecture_placeholder')}
                  hint={t('calendar_form.lecture_hint')}
                />

                <TopicsEditor
                  label={t('calendar_form.lab_topics')}
                  topics={formData.labTopics || []}
                  onChange={onLabTopicsChange}
                  placeholder={t('calendar_form.lab_placeholder')}
                  hint={t('calendar_form.lab_hint')}
                />

                <TopicsEditor
                  label={t('calendar_form.practical_topics')}
                  topics={formData.practicalTopics || []}
                  onChange={onPracticalTopicsChange}
                  placeholder={t('calendar_form.practical_placeholder')}
                  hint={t('calendar_form.practical_hint')}
                />

                <TopicsEditor
                  label="СРОП / СОӨЖ"
                  topics={formData.sropTopics || []}
                  onChange={onSropTopicsChange}
                  placeholder="Тема СРОП №1..."
                  hint="Темы самостоятельной работы под руководством преподавателя. Если не заполнить — раздел СРОП не попадёт в документ."
                />

                <div className="cf-row">
                  <Field label={t('calendar_form.language')}>
                    <select name="language" value={formData.language} onChange={handleChange} className="cf-select">
                      <option value="russian">{t('calendar_form.russian')}</option>
                      <option value="kazakh">{t('calendar_form.kazakh')}</option>
                      <option value="english">{t('calendar_form.english')}</option>
                    </select>
                  </Field>

                  <Field label={t('calendar_form.semester')}>
                    <select name="semester" value={formData.semester} onChange={handleChange} className="cf-select">
                      <option value="1">1 {t('calendar_form.semester')}</option>
                      <option value="2">2 {t('calendar_form.semester')}</option>
                      <option value="3">3 {t('calendar_form.semester')}</option>
                      <option value="4">4 {t('calendar_form.semester')}</option>
                      <option value="5">5 {t('calendar_form.semester')}</option>
                      <option value="6">6 {t('calendar_form.semester')}</option>
                    </select>
                  </Field>
                </div>

                <div className="cf-presets">
                  <div className="cf-label">{t('calendar_form.quick_templates')}</div>
                  {presets.map((preset, i) => (
                    <button key={i} type="button" className="cf-preset" onClick={() => setFormData(prev => ({ ...prev, ...preset }))}>
                      <div className="cf-preset-icon">
                        <FontAwesomeIcon icon={faMagic} />
                      </div>
                      <div className="cf-preset-info">
                        <div className="cf-preset-name">{preset.subject}</div>
                        <div className="cf-preset-meta">
                          <span>{preset.grade}</span>
                          <span>{preset.hours} ч.</span>
                          <span>{preset.group}</span>
                        </div>
                      </div>
                      <div className="cf-preset-arrow">
                        <FontAwesomeIcon icon={faArrowRight} />
                      </div>
                    </button>
                  ))}
                </div>
              </Section>
            )}

            {/* Кнопка генерации */}
            <div className="cf-submit-block">
              <button type="submit" className="cf-submit-btn" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <div className="cf-spinner" />
                    <span>{t('calendar_form.ai_generating')}</span>
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faWandMagicSparkles} />
                    <span>{t('calendar_form.generate_calendar')}</span>
                    <FontAwesomeIcon icon={faDownload} />
                  </>
                )}
              </button>

              <div className="cf-submit-meta">
                <div className="cf-submit-hint">
                  <FontAwesomeIcon icon={faClock} />
                  <span>{t('calendar_form.time_estimate')}</span>
                </div>
                <div className="cf-submit-hint">
                  <FontAwesomeIcon icon={faBolt} />
                  <span>{t('calendar_form.ai_generation_short')}</span>
                </div>
                <div className="cf-submit-hint">
                  <FontAwesomeIcon icon={faCalendarWeek} />
                  <span>{t('calendar_form.with_parity')}</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};

export default CalendarForm;