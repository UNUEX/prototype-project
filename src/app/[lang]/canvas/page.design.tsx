'use client';

/**
 * app/canvas/page.design.tsx
 * ДИЗАЙН — UI компоненты, стили, визуальное оформление
 * ОБНОВЛЕНО: Добавлен компонент ContextualHelpPanel, исправлены стили для прокрутки.
 * ДОБАВЛЕНО: Поддержка мультиязычности
 */

import React, { useRef, useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faLayerGroup, faRocket, faSpinner,
  faLightbulb, faPlus, faMinus, faUpload,
  faFileWord, faWandMagicSparkles, faCheckCircle,
  faCircle, faStar, faArrowLeft, faArrowRight,
  faBrain, faExclamationTriangle,
  faClock, faCalendarAlt, faBook,
  faGear, faBolt, faBullseye, faGraduationCap,
  faChalkboardUser, faMicroscope, faPenToSquare,
  faClipboardList, faShuffle,
  faChevronRight,
  faInfoCircle,
  faListCheck, faComment, faLightbulb as faLightbulbIcon,
  faXmark, faSearch, faTableCells,
} from '@fortawesome/free-solid-svg-icons';
import {
  FlowNode,
  KINDS,
  Connection,
  MODES,
  ANALYSIS_STEPS,
  NW,
  NH,
  bezier,
  portPos,
  CanvasMode,
  AnalysisResult,
  DiffItem,
  canGenerateFromSyllabus,
  getNodeSources,
  ChatMessage,
  CanvasProject,
  RupFormDataType,
  CalendarFormDataType,
  NodeKind,
} from './page.functional';
import ProjectSwitcher from './components/ProjectSwitcher';
import { useTranslation } from '@/hooks/useTranslation';

// ─── Card Component ───────────────────────────────────────────────────────────

interface CardProps {
  node: FlowNode;
  selected: boolean;
  onDown: (e: React.MouseEvent, id: string) => void;
  onPortDown: (e: React.MouseEvent, id: string, side: 'l' | 'r') => void;
  onPortUp: (e: React.MouseEvent, id: string, side: 'l' | 'r') => void;
  onClick: (id: string) => void;
  onDelete: (id: string) => void;
  onRunNode: (nodeId: string) => void;
}

export const Card = React.memo(({ node, selected, onDown, onPortDown, onPortUp, onClick, onDelete, onRunNode }: CardProps) => {
  const { t } = useTranslation();
  const k = KINDS[node.kind];
  const sc = node.status === 'done' ? '#22c55e' :
             node.status === 'running' ? '#eab308' :
             node.status === 'error' ? '#ef4444' : '#3a3a46';
  const hasBg = node.kind === 'import' && node.uploadedFile;
  const hasSyllabus = node.kind === 'import' && node.syllabusData;

  const syllabusTagsY = 75;
  const syllabusTags = hasSyllabus ? [
    node.syllabusData!.hasLectures && t('card.lecture_short'),
    node.syllabusData!.hasLabs && t('card.lab_short'),
    node.syllabusData!.hasPracticals && t('card.practical_short'),
    node.syllabusData!.hasSRO && t('card.sro_short'),
    node.syllabusData!.hasSROP && t('card.srop_short'),
    node.syllabusData!.hasKP && t('card.kp_short'),
    '📚 ' + t('card.sro'),
  ].filter(Boolean) as string[] : [];

  return (
    <g transform={`translate(${node.x},${node.y})`}>
      {selected && (
        <rect
          x={-4} y={-4} width={NW+8} height={NH + (hasSyllabus && syllabusTags.length > 0 ? 26 : 0)+8} rx={14}
          fill="none" stroke={k.border} strokeWidth={2} opacity={0.5}
          style={{ filter: `drop-shadow(0 0 20px ${k.border}80)` } as React.CSSProperties}
        />
      )}
      <rect
        x={0} y={0} width={NW} height={NH + (hasSyllabus && syllabusTags.length > 0 ? 26 : 0)} rx={12}
        fill={hasBg ? `${k.border}15` : 'rgba(28, 28, 34, 0.8)'}
        stroke={selected ? k.border : 'rgba(80, 80, 90, 0.4)'}
        strokeWidth={selected ? 2 : 1}
        style={{ cursor: 'grab', backdropFilter: 'blur(8px)' } as React.CSSProperties}
        onMouseDown={e => onDown(e, node.id)}
        onClick={() => onClick(node.id)}
      />

      <circle
        cx={0} cy={NH/2} r={7} fill="#1c1c22" stroke={k.border} strokeWidth={2}
        style={{ cursor: 'crosshair' } as React.CSSProperties}
        onMouseDown={e => { e.stopPropagation(); onPortDown(e, node.id, 'l'); }}
        onMouseUp={e => { e.stopPropagation(); onPortUp(e, node.id, 'l'); }}
      />
      <circle
        cx={NW} cy={NH/2} r={7} fill="#1c1c22" stroke={k.border} strokeWidth={2}
        style={{ cursor: 'crosshair' } as React.CSSProperties}
        onMouseDown={e => { e.stopPropagation(); onPortDown(e, node.id, 'r'); }}
        onMouseUp={e => { e.stopPropagation(); onPortUp(e, node.id, 'r'); }}
      />

      <rect x={12} y={16} width={52} height={52} rx={9} fill={`${k.border}15`} stroke={`${k.border}30`} strokeWidth={1} />
      <text x={38} y={47} textAnchor="middle" fontSize={24} dominantBaseline="middle" style={{ userSelect: 'none' } as React.CSSProperties}>
        {hasBg ? '📄' : k.emoji}
      </text>

      <circle cx={NW-14} cy={14} r={5} fill={sc} />

      {selected && (
        <g
          transform={`translate(${NW-34},6)`}
          style={{ cursor: 'pointer' } as React.CSSProperties}
          onClick={e => { e.stopPropagation(); onDelete(node.id); }}
          onMouseDown={e => e.stopPropagation()}
        >
          <rect x={0} y={0} width={18} height={18} rx={5} fill="rgba(239,68,68,0.15)" stroke="rgba(239,68,68,0.4)" strokeWidth={1} />
          <text x={9} y={13} textAnchor="middle" fontSize={10} fill="#ef4444" style={{ userSelect: 'none' } as React.CSSProperties}>✕</text>
        </g>
      )}

      <text x={76} y={38} fill="#f0f0f0" fontSize={13} fontWeight={500} fontFamily="Inter,sans-serif">
        {node.label.length > 20 ? node.label.slice(0,20)+'…' : node.label}
      </text>
      <text x={76} y={55} fill="#90909a" fontSize={10.5} fontFamily="Inter,sans-serif">
        {hasBg ? (node.uploadedFile!.length > 22 ? node.uploadedFile!.slice(0,22)+'…' : node.uploadedFile!) : k.desc}
      </text>

      {hasSyllabus ? (
        <text x={76} y={71} fill="#22c55e" fontSize={10} fontFamily="Inter,sans-serif">
          ✓ {node.syllabusData!.discipline.slice(0, 24)}
        </text>
      ) : node.prompt && !hasBg ? (
        <text x={76} y={71} fill={k.border} fontSize={10} fontFamily="Inter,sans-serif">
          {node.prompt.length > 26 ? node.prompt.slice(0,26)+'…' : node.prompt}
        </text>
      ) : hasBg ? (
        <text x={76} y={71} fill="#22c55e" fontSize={10} fontFamily="Inter,sans-serif">
          ✓ {t('card.uploaded')}
        </text>
      ) : null}

      {hasSyllabus && syllabusTags.length > 0 && (
        <g transform={`translate(12,${syllabusTagsY})`}>
          {syllabusTags.map((tag, i) => (
            <g key={tag} transform={`translate(${i * 38},0)`}>
              <rect x={0} y={0} width={34} height={16} rx={4} fill="rgba(34,197,94,0.1)" stroke="rgba(34,197,94,0.3)" strokeWidth={1} />
              <text x={17} y={11} textAnchor="middle" fontSize={8.5} fill="#22c55e" fontFamily="Inter,sans-serif">{tag}</text>
            </g>
          ))}
        </g>
      )}

      {node.kind !== 'import' && (
        <foreignObject
          x={NW - 38} y={NH - 28}
          width={28} height={22}
          style={{ overflow: 'visible' } as React.CSSProperties}
          onMouseDown={e => e.stopPropagation()}
        >
          <button
            onClick={e => { e.stopPropagation(); if (node.status !== 'running') onRunNode(node.id); }}
            style={{
              width: 28, height: 22,
              background: node.status === 'done' ? 'rgba(34,197,94,0.2)' :
                          node.status === 'running' ? 'rgba(234,179,8,0.2)' :
                          node.status === 'error' ? 'rgba(239,68,68,0.2)' :
                          'rgba(196,154,108,0.25)',
              border: `1px solid ${
                node.status === 'done' ? 'rgba(34,197,94,0.4)' :
                node.status === 'running' ? 'rgba(234,179,8,0.4)' :
                node.status === 'error' ? 'rgba(239,68,68,0.4)' :
                'rgba(196,154,108,0.4)'
              }`,
              borderRadius: 6,
              cursor: node.status === 'running' ? 'wait' : 'pointer',
              fontSize: 10,
              color: node.status === 'done' ? '#22c55e' :
                     node.status === 'running' ? '#eab308' :
                     node.status === 'error' ? '#ef4444' : '#C49A6C',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 0,
            }}
          >
            {node.status === 'running' ? '⏳' : node.status === 'done' ? '✓' : node.status === 'error' ? '↻' : '▶'}
          </button>
        </foreignObject>
      )}
    </g>
  );
});

Card.displayName = 'Card';

// ─── Syllabus Analysis Panel ──────────────────────────────────────────────────

interface SyllabusPanelProps {
  node: FlowNode;
  connectedNodeIds: string[];
  allNodes: FlowNode[];
  onClose: () => void;
  onRunNode: (nodeId: string) => void;
}

export const SyllabusPanel: React.FC<SyllabusPanelProps> = ({
  node,
  connectedNodeIds,
  allNodes,
  onClose,
  onRunNode,
}) => {
  const { t } = useTranslation();
  const syllabus = node.syllabusData;
  if (!syllabus) return null;

  const connectedNodes = allNodes.filter(n => connectedNodeIds.includes(n.id));

  return (
    <div style={styles.syllabusPanel}>
      <div style={styles.syllabusPanelHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FontAwesomeIcon icon={faBrain} style={{ color: '#22c55e' }} />
          <span style={{ color: '#f0f0f0', fontWeight: 600 }}>{t('syllabus_panel.title')}</span>
        </div>
        <button onClick={onClose} style={styles.syllabusPanelClose}>✕</button>
      </div>

      <div style={styles.syllabusPanelBody}>
        <div style={styles.syllabusInfo}>
          <div style={styles.syllabusInfoRow}>
            <span style={{ color: '#90909a' }}>{t('syllabus_panel.discipline')}</span>
            <span style={{ color: '#f0f0f0', fontWeight: 500 }}>{syllabus.discipline}</span>
          </div>
          {syllabus.hours && (
            <div style={styles.syllabusInfoRow}>
              <span style={{ color: '#90909a' }}>{t('syllabus_panel.hours')}</span>
              <span style={{ color: '#f0f0f0' }}>{syllabus.hours}</span>
            </div>
          )}
        </div>

        <div style={{ marginTop: 16 }}>
          <p style={{ color: '#90909a', fontSize: 11, marginBottom: 10 }}>{t('syllabus_panel.found_in_syllabus')}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {[
              { key: 'hasLectures', label: t('syllabus_panel.lectures') },
              { key: 'hasLabs', label: t('syllabus_panel.labs') },
              { key: 'hasPracticals', label: t('syllabus_panel.practicals') },
              { key: 'hasSRO', label: t('syllabus_panel.sro') },
              { key: 'hasSROP', label: t('syllabus_panel.srop') },
              { key: 'hasKP', label: t('syllabus_panel.kp') },
            ].map(({ key, label }) => {
              const has = (syllabus as unknown as Record<string, unknown>)[key] as boolean;
              return (
                <span key={key} style={{
                  padding: '3px 10px',
                  borderRadius: 20,
                  fontSize: 11,
                  background: has ? 'rgba(34,197,94,0.1)' : 'rgba(80,80,90,0.2)',
                  color: has ? '#22c55e' : '#60606a',
                  border: `1px solid ${has ? 'rgba(34,197,94,0.3)' : 'rgba(80,80,90,0.2)'}`,
                }}>
                  {has ? '✓ ' : '✗ '}{label}
                </span>
              );
            })}
          </div>
        </div>

        {connectedNodes.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <p style={{ color: '#90909a', fontSize: 11, marginBottom: 10 }}>{t('syllabus_panel.connected_blocks')}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {connectedNodes.map(cn => {
                const canGen = canGenerateFromSyllabus(cn.kind, syllabus);
                return (
                  <div key={cn.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: canGen ? 'rgba(28,28,34,0.6)' : 'rgba(239,68,68,0.05)',
                    border: `1px solid ${canGen ? 'rgba(80,80,90,0.3)' : 'rgba(239,68,68,0.2)'}`,
                  }}>
                    <span style={{ color: canGen ? '#f0f0f0' : '#60606a', fontSize: 12 }}>
                      {KINDS[cn.kind]?.emoji} {cn.label}
                    </span>
                    {canGen ? (
                      <button
                        onClick={() => onRunNode(cn.id)}
                        disabled={cn.status === 'running'}
                        style={{
                          background: '#C49A6C',
                          border: 'none',
                          borderRadius: 6,
                          padding: '4px 10px',
                          color: '#000',
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {cn.status === 'running' ? '...' : cn.status === 'done' ? '✓' : '▶'}
                      </button>
                    ) : (
                      <span style={{ fontSize: 10, color: '#ef4444' }}>
                        <FontAwesomeIcon icon={faExclamationTriangle} /> {t('syllabus_panel.not_in_syllabus')}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


// ─── Node Info Panel ──────────────────────────────────────────────────────────
// Появляется при клике на любую ноду кроме import-силлабуса

// ─── Excel Node Settings ──────────────────────────────────────────────────────

const EXCEL_TEMPLATES = [
  {
    id: 'grades',
    emoji: '📝',
    label: 'Журнал оценок',
    desc: 'Список студентов, темы как колонки, формулы среднего балла',
    fill: '#1D6F4220',
    border: '#1D6F4260',
  },
  {
    id: 'workload',
    emoji: '📅',
    label: 'Нагрузка препода',
    desc: 'Таблица занятий по темам с часами и сводным листом',
    fill: '#37552320',
    border: '#37552360',
  },
  {
    id: 'custom',
    emoji: '✨',
    label: 'Произвольный',
    desc: 'Опишите любой файл — AI построит структуру под ваш запрос',
    fill: '#4472C420',
    border: '#4472C460',
  },
];

interface ExcelNodeSettingsProps {
  node: FlowNode;
  onChangeMode?: (nodeId: string, mode: 'topics' | 'full') => void;
}

const ExcelNodeSettings: React.FC<ExcelNodeSettingsProps> = ({ node }) => {
  const currentTemplate = node.metadata?.excelTemplate || 'custom';
  const accentGreen = '#1D6F42';

  // Локальный state для textarea — синхронизируется с node.prompt при blur/enter
  const [promptText, setPromptText] = useState(node.prompt || '');
  const [isFocused, setIsFocused] = useState(false);

  // Если node.prompt изменился снаружи — обновляем локальный state
  useEffect(() => {
    setPromptText(node.prompt || '');
  }, [node.id, node.prompt]);

  const savePrompt = (value: string) => {
    window.dispatchEvent(new CustomEvent('canvas:update-node-prompt', {
      detail: { id: node.id, prompt: value },
    }));
  };

  return (
    <div style={{ marginBottom: 14 }}>

      {/* ── Шаблон ─────────────────────────────────────── */}
      <div style={{
        fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
        color: '#3a3a4a', textTransform: 'uppercase', marginBottom: 8,
      }}>
        📊 Шаблон Excel
      </div>

      {EXCEL_TEMPLATES.map(tpl => {
        const isActive = currentTemplate === tpl.id;
        return (
          <div
            key={tpl.id}
            style={{
              padding: '9px 12px', borderRadius: 10, marginBottom: 6, cursor: 'pointer',
              background: isActive ? tpl.fill : 'rgba(255,255,255,0.018)',
              border: `1.5px solid ${isActive ? tpl.border : 'rgba(80,80,95,0.2)'}`,
              display: 'flex', alignItems: 'flex-start', gap: 10,
              transition: 'all 0.16s',
            }}
            onClick={() => {
              window.dispatchEvent(new CustomEvent('canvas:update-node-meta', {
                detail: { id: node.id, meta: { excelTemplate: tpl.id } },
              }));
            }}
          >
            <div style={{
              width: 17, height: 17, borderRadius: '50%', flexShrink: 0, marginTop: 2,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: isActive ? `${accentGreen}22` : 'rgba(80,80,90,0.12)',
              border: isActive ? `2px solid ${accentGreen}` : '2px solid rgba(80,80,90,0.3)',
              transition: 'all 0.15s',
            }}>
              {isActive && <div style={{ width: 6, height: 6, borderRadius: '50%', background: accentGreen }} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 12, fontWeight: 700,
                color: isActive ? '#2e7d52' : '#808090',
                marginBottom: 2,
              }}>
                {tpl.emoji} {tpl.label}
              </div>
              <div style={{ fontSize: 10, color: '#5a5a68', lineHeight: 1.5 }}>
                {tpl.desc}
              </div>
            </div>
          </div>
        );
      })}

      {/* ── Промпт ─────────────────────────────────────── */}
      <div style={{ marginTop: 12, marginBottom: 2 }}>
        <div style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
          color: '#3a3a4a', textTransform: 'uppercase', marginBottom: 7,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          ✏️ Описание файла
          <span style={{
            fontSize: 9, padding: '1px 6px', borderRadius: 20, fontWeight: 600,
            background: `${accentGreen}15`, color: '#2e7d52',
            border: `1px solid ${accentGreen}30`,
          }}>необязательно</span>
        </div>

        <div style={{ position: 'relative' }}>
          <textarea
            value={promptText}
            onChange={e => setPromptText(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              setIsFocused(false);
              savePrompt(promptText);
            }}
            onKeyDown={e => {
              // Ctrl+Enter — сохраняем
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                savePrompt(promptText);
                (e.target as HTMLTextAreaElement).blur();
              }
              e.stopPropagation(); // не удалять ноду по Delete
            }}
            placeholder={
              currentTemplate === 'grades'
                ? 'Например: 30 студентов, 15 недель, добавь столбец «Посещаемость», итоговый балл — среднее из всех оценок...'
                : currentTemplate === 'workload'
                ? 'Например: разбей по семестрам, добавь колонку «Аудитория», итого часов за весь год...'
                : 'Опишите что нужно: сколько листов, какие колонки, что считать формулами, нужен ли график...'
            }
            style={{
              width: '100%',
              boxSizing: 'border-box',
              minHeight: 90,
              maxHeight: 200,
              resize: 'vertical',
              background: isFocused ? 'rgba(29,111,66,0.06)' : 'rgba(20,20,28,0.7)',
              border: `1.5px solid ${isFocused ? accentGreen + '80' : 'rgba(80,80,95,0.25)'}`,
              borderRadius: 10,
              color: '#d0d0d8',
              fontSize: 11,
              lineHeight: 1.6,
              padding: '9px 11px',
              outline: 'none',
              fontFamily: 'inherit',
              transition: 'border-color 0.15s, background 0.15s',
              scrollbarWidth: 'thin' as const,
              scrollbarColor: 'rgba(80,80,100,0.3) transparent',
            }}
          />
          {/* Символ счётчика */}
          {promptText.length > 0 && (
            <div style={{
              position: 'absolute', bottom: 7, right: 9,
              fontSize: 9, color: promptText.length > 400 ? '#f87171' : '#40404e',
              pointerEvents: 'none',
            }}>
              {promptText.length}/500
            </div>
          )}
        </div>

        {/* Hint под полем */}
        <div style={{
          marginTop: 5, fontSize: 10, color: '#3a3a4a', lineHeight: 1.5,
          display: 'flex', alignItems: 'center', gap: 5,
        }}>
          <span style={{ opacity: 0.6 }}>Ctrl+Enter — сохранить · Теряет фокус — тоже сохраняет</span>
        </div>
      </div>

      {/* ── Output info ────────────────────────────────── */}
      <div style={{
        marginTop: 10, padding: '6px 11px', borderRadius: 7,
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(80,80,90,0.15)',
        display: 'flex', alignItems: 'center', gap: 7,
      }}>
        <FontAwesomeIcon icon={faTableCells} style={{ fontSize: 10, color: '#1D6F42' }} />
        <span style={{ fontSize: 10, color: '#60606e' }}>
          Результат: <strong style={{ color: '#4a8a60' }}>.xlsx</strong> — Excel, Google Sheets, LibreOffice
        </span>
      </div>

    </div>
  );
};

// ─── NodeInfoPanel ────────────────────────────────────────────────────────────

interface NodeInfoPanelProps {
  node: FlowNode;
  syllabus: import('./page.functional').SyllabusData | null;
  allNodes: FlowNode[];
  allConns: Connection[];
  onClose: () => void;
  onRunNode: (id: string) => void;
  onUploadNodeFile?: (nodeId: string) => void;
  /** Смена режима генерации: 'topics' | 'full' */
  onChangeMode?: (nodeId: string, mode: 'topics' | 'full') => void;
}

export const NodeInfoPanel: React.FC<NodeInfoPanelProps> = ({
  node, syllabus, allNodes, allConns, onClose, onRunNode, onUploadNodeFile, onChangeMode,
}) => {
  const { t } = useTranslation();
  const kind = KINDS[node.kind];
  if (!kind) return null;

  const genMode: 'topics' | 'full' = node.generationMode ?? 'full';

  // Sources & children
  const sources = getNodeSources(node.id, allNodes, allConns);
  const chainSources = sources.filter(s => s.node.kind !== 'import');
  const hasChain = chainSources.length > 0;
  const childIds = allConns.filter(c => c.from === node.id).map(c => c.to);
  const nonImportChildren = childIds
    .map(cid => allNodes.find(n => n.id === cid))
    .filter((n): n is FlowNode => !!n && n.kind !== 'import');

  // Warnings
  const canGen = syllabus ? canGenerateFromSyllabus(node.kind, syllabus) : true;
  const notInSyllabusWarning = syllabus && !canGen && !hasChain;
  const isDisabled = node.status === 'running' || !!notInSyllabusWarning;

  // Status appearance
  const statusStyle = {
    idle:    { c: '#70707a', bg: 'rgba(80,80,90,0.12)',   bd: 'rgba(80,80,90,0.25)',   label: t('node_panel.status_idle') },
    running: { c: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  bd: 'rgba(251,191,36,0.3)',  label: t('node_panel.status_running') },
    done:    { c: '#4ade80', bg: 'rgba(74,222,128,0.1)',  bd: 'rgba(74,222,128,0.28)', label: t('node_panel.status_done') },
    error:   { c: '#f87171', bg: 'rgba(248,113,113,0.1)', bd: 'rgba(248,113,113,0.3)', label: t('node_panel.status_error') },
  }[node.status] ?? { c: '#70707a', bg: 'rgba(80,80,90,0.12)', bd: 'rgba(80,80,90,0.25)', label: '—' };

  // Total topics count from sources (for display in mode card)
  const srcTopicCount = (() => {
    for (const src of sources) {
      const fd = src.node.nodeFileData;
      if (fd) {
        const n = fd.allTopics?.length || fd.lectureTopics?.length
          || fd.labTopics?.length || fd.practicalTopics?.length
          || fd.sroTasks?.length || fd.sropTopics?.length || fd.kpTopics?.length || 0;
        if (n > 0) return n;
      }
      if ((src.generatedTopics?.length ?? 0) > 0) return src.generatedTopics!.length;
      if (src.syllabus) {
        const m: Record<string, number> = {
          lectures: src.syllabus.lectureTopics?.length ?? 0,
          labs:     src.syllabus.labTopics?.length ?? 0,
          practicals: src.syllabus.practicalTopics?.length ?? 0,
          sro:      src.syllabus.sroTasks?.length ?? 0,
          srop:     src.syllabus.sropTopics?.length ?? (src.syllabus.sropTable?.length ?? 0),
          kp:       src.syllabus.kpTopics?.length ?? 0,
        };
        const cnt = m[node.kind] ?? 0;
        if (cnt > 0) return cnt;
      }
    }
    return 0;
  })();

  // Accent colors for mode cards
  const topicsAccent = '#5eead4';   // teal — fast/light
  const fullAccent   = kind.color;  // block's own color — full power

  const btnBase: React.CSSProperties = {
    display: 'flex', alignItems: 'flex-start', gap: 11,
    padding: '11px 13px', borderRadius: 11, cursor: 'pointer',
    textAlign: 'left', width: '100%', transition: 'all 0.18s',
  };

  return (
    <div style={{
      ...styles.nodeInfoPanel,
      border: `1px solid ${kind.border}50`,
      boxShadow: `0 24px 60px rgba(0,0,0,0.65), 0 0 0 1px ${kind.border}18`,
    }}>

      {/* ══ HEADER ══ */}
      <div style={{
        padding: '13px 15px 11px',
        background: `linear-gradient(120deg, ${kind.border}14 0%, transparent 70%)`,
        borderBottom: `1px solid ${kind.border}22`,
        flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 11, flexShrink: 0,
            background: `${kind.border}1e`, border: `1px solid ${kind.border}45`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 19, boxShadow: `0 2px 10px ${kind.border}25`,
          }}>
            {kind.emoji}
          </div>
          <div>
            <div style={{ color: '#eeeef2', fontWeight: 700, fontSize: 14, letterSpacing: '-0.01em' }}>
              {node.label || kind.label}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              {/* Status badge */}
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '2px 9px', borderRadius: 20, fontSize: 10, fontWeight: 600,
                color: statusStyle.c, background: statusStyle.bg, border: `1px solid ${statusStyle.bd}`,
              }}>
                {node.status === 'running' && (
                  <FontAwesomeIcon icon={faSpinner} style={{ animation: 'spin 1s linear infinite', fontSize: 9 }} />
                )}
                {node.status === 'done' && <FontAwesomeIcon icon={faCheckCircle} style={{ fontSize: 9 }} />}
                {statusStyle.label}
              </span>
              {/* Duration */}
              {!!node.duration && (
                <span style={{ fontSize: 10, color: '#50505a' }}>
                  {(node.duration / 1000).toFixed(1)}с
                </span>
              )}
            </div>
          </div>
        </div>
        <button onClick={onClose} style={{
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
          color: '#55555f', cursor: 'pointer', fontSize: 13,
          padding: '5px 8px', borderRadius: 7, lineHeight: 1, transition: 'color 0.15s',
        }}>✕</button>
      </div>

      {/* ══ SCROLL BODY ══ */}
      <div style={{
        padding: '14px 15px', overflowY: 'auto', flex: 1,
        scrollbarWidth: 'thin', scrollbarColor: 'rgba(80,80,100,0.3) transparent',
      }}>

        {/* ─── БЛОК: РЕЖИМ ГЕНЕРАЦИИ ─── */}
        {/* kp, sro_full — только темы; boundary_control, final_control — только с содержанием (AI); excel — свои настройки */}
        {!(['kp', 'sro_full', 'boundary_control', 'final_control', 'calendar', 'excel'] as string[]).includes(node.kind) && (
        <div style={{ marginBottom: 14 }}>
          <div style={styles.nipSectionLabel}>⚙ Режим генерации</div>

          {/* ── Карточка 1: Только темы ── */}
          <button
            onClick={() => onChangeMode?.(node.id, 'topics')}
            style={{
              ...btnBase, marginBottom: 6,
              background: genMode === 'topics'
                ? `rgba(94,234,212,0.07)`
                : 'rgba(255,255,255,0.018)',
              border: genMode === 'topics'
                ? `1.5px solid rgba(94,234,212,0.4)`
                : '1.5px solid rgba(80,80,95,0.22)',
            }}
          >
            {/* Radio dot */}
            <div style={{
              width: 18, height: 18, borderRadius: '50%', flexShrink: 0, marginTop: 2,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: genMode === 'topics' ? 'rgba(94,234,212,0.18)' : 'rgba(80,80,90,0.12)',
              border: genMode === 'topics' ? `2px solid ${topicsAccent}` : '2px solid rgba(80,80,90,0.3)',
              transition: 'all 0.18s',
            }}>
              {genMode === 'topics' && (
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: topicsAccent }} />
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontWeight: 700, fontSize: 12,
                color: genMode === 'topics' ? topicsAccent : '#909098',
                marginBottom: 3, display: 'flex', alignItems: 'center', gap: 6,
              }}>
                ⚡ Только темы
  
              </div>
              <div style={{ fontSize: 11, color: '#5a5a68', lineHeight: 1.55 }}>
                Структура документа с темами и оформлением.
              </div>
              {srcTopicCount > 0 && (
                <div style={{
                  marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '2px 8px', borderRadius: 20, fontSize: 10,
                  background: 'rgba(94,234,212,0.07)', color: '#5eead4',
                  border: '1px solid rgba(94,234,212,0.18)',
                }}>
                  📋 {srcTopicCount} {srcTopicCount === 1 ? 'тема' : srcTopicCount < 5 ? 'темы' : 'тем'} найдено
                </div>
              )}
            </div>
          </button>

          {/* ── Карточка 2: С содержанием ── */}
          <button
            onClick={() => onChangeMode?.(node.id, 'full')}
            style={{
              ...btnBase,
              background: genMode === 'full'
                ? `${kind.border}0e`
                : 'rgba(255,255,255,0.018)',
              border: genMode === 'full'
                ? `1.5px solid ${kind.border}50`
                : '1.5px solid rgba(80,80,95,0.22)',
            }}
          >
            {/* Radio dot */}
            <div style={{
              width: 18, height: 18, borderRadius: '50%', flexShrink: 0, marginTop: 2,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: genMode === 'full' ? `${kind.border}22` : 'rgba(80,80,90,0.12)',
              border: genMode === 'full' ? `2px solid ${kind.border}` : '2px solid rgba(80,80,90,0.3)',
              transition: 'all 0.18s',
            }}>
              {genMode === 'full' && (
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: kind.border }} />
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontWeight: 700, fontSize: 12,
                color: genMode === 'full' ? fullAccent : '#909098',
                marginBottom: 3, display: 'flex', alignItems: 'center', gap: 6,
              }}>
                🤖 С содержанием
                <span style={{
                  fontSize: 9, padding: '1px 6px', borderRadius: 20, fontWeight: 600,
                  background: `${kind.border}12`, color: kind.color,
                  border: `1px solid ${kind.border}28`,
                }}>AI</span>
              </div>
              <div style={{ fontSize: 11, color: '#5a5a68', lineHeight: 1.55 }}>
                Полный документ — темы + описание каждой. Больше токенов, лучше результат.
              </div>
            </div>
          </button>
        </div>
        )} {/* end режим генерации */}

        {/* ─── БЕЙДЖ ФИКСИРОВАННОГО РЕЖИМА (для kp, sro_full, boundary_control, final_control) ─── */}
        {(['kp', 'sro_full', 'calendar'] as string[]).includes(node.kind) && (
          <div style={{
            marginBottom: 14, padding: '9px 12px', borderRadius: 8,
            background: 'rgba(94,234,212,0.06)', border: '1.5px solid rgba(94,234,212,0.22)',
            display: 'flex', alignItems: 'flex-start', gap: 8,
          }}>
            <span style={{ fontSize: 14 }}>⚡</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#5eead4', marginBottom: 3 }}>
                Только темы
              </div>
              <div style={{ fontSize: 11, color: '#5a5a68', lineHeight: 1.5 }}>

              </div>
            </div>
          </div>
        )}
        {(['boundary_control', 'final_control'] as string[]).includes(node.kind) && (
          <div style={{
            marginBottom: 14, padding: '9px 12px', borderRadius: 8,
            background: `${kind.border}0e`, border: `1.5px solid ${kind.border}40`,
            display: 'flex', alignItems: 'flex-start', gap: 8,
          }}>
            <span style={{ fontSize: 14 }}>🤖</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: kind.color, marginBottom: 3 }}>
                С содержанием (AI)
              </div>
              <div style={{ fontSize: 11, color: '#5a5a68', lineHeight: 1.5 }}>
                Вопросы генерируются AI на основе тем лекций, лабораторных и практических из силлабуса или подключённых блоков.
              </div>
            </div>
          </div>
        )}

        {/* ─── EXCEL: блок выбора шаблона ─── */}
        {node.kind === 'excel' && (
          <ExcelNodeSettings node={node} onChangeMode={onChangeMode} />
        )}

        {/* ─── DIVIDER ─── */}
        <div style={{ height: 1, background: 'rgba(80,80,95,0.14)', margin: '2px 0 14px' }} />

        {/* ─── БЛОК: ФАЙЛ ИСТОЧНИКА ─── */}
        <div style={{ marginBottom: 14 }}>
          <div style={styles.nipSectionLabel}>📄 Файл источника</div>
          {node.nodeFileData ? (
            <div style={{
              padding: '9px 12px', borderRadius: 10,
              background: 'rgba(74,222,128,0.05)',
              border: '1px solid rgba(74,222,128,0.22)',
              display: 'flex', alignItems: 'flex-start', gap: 8,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#4ade80', fontSize: 11, fontWeight: 600, marginBottom: 2 }}>
                  ✅ {node.nodeFileData.fileName}
                </div>
                {node.nodeFileData.discipline && (
                  <div style={{ color: '#60606e', fontSize: 10, marginBottom: 1 }}>
                    {node.nodeFileData.discipline}
                  </div>
                )}
                {(() => {
                  const n = node.nodeFileData.allTopics?.length
                    || node.nodeFileData.lectureTopics?.length
                    || node.nodeFileData.labTopics?.length
                    || node.nodeFileData.practicalTopics?.length || 0;
                  return n > 0
                    ? <div style={{ color: '#C49A6C', fontSize: 10 }}>📋 {n} тем</div>
                    : null;
                })()}
              </div>
              {onUploadNodeFile && (
                <button onClick={() => onUploadNodeFile(node.id)} style={{
                  flexShrink: 0, background: 'rgba(80,80,90,0.18)',
                  border: '1px solid rgba(80,80,90,0.28)',
                  borderRadius: 6, color: '#60606e', fontSize: 10,
                  padding: '3px 7px', cursor: 'pointer',
                }}>↺ заменить</button>
              )}
            </div>
          ) : onUploadNodeFile ? (
            <button onClick={() => onUploadNodeFile(node.id)} style={{
              width: '100%', padding: '9px 12px',
              background: 'rgba(196,154,108,0.05)',
              border: '1.5px dashed rgba(196,154,108,0.28)',
              borderRadius: 10, color: '#7a6040', fontSize: 11, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 6, transition: 'all 0.15s',
            }}>
              <FontAwesomeIcon icon={faUpload} style={{ fontSize: 11 }} />
              Загрузить .docx файл
            </button>
          ) : (
            <div style={{
              padding: '8px 12px', borderRadius: 10,
              background: 'rgba(28,28,38,0.5)',
              border: '1px solid rgba(80,80,90,0.15)',
            }}>
              <div style={{ color: '#484850', fontSize: 11 }}>Файл не загружен</div>
            </div>
          )}
        </div>

        {/* ─── БЛОК: ИСТОЧНИКИ ДАННЫХ ─── */}
        {(hasChain || syllabus) && (
          <div style={{ marginBottom: 14 }}>
            <div style={styles.nipSectionLabel}>
              {hasChain ? '🔗 Подключённые блоки' : '📑 Силлабус'}
            </div>

            {chainSources.map(src => {
              const sk = KINDS[src.node.kind];
              const fd = src.node.nodeFileData;
              const hasFile = !!fd;
              const topN = hasFile
                ? (fd?.allTopics?.length || fd?.lectureTopics?.length || fd?.labTopics?.length || 0)
                : (src.generatedTopics?.length || 0);
              const ready = hasFile || src.node.status === 'done';
              return (
                <div key={src.node.id} style={{
                  padding: '8px 11px', borderRadius: 9, marginBottom: 5,
                  background: ready ? `${sk?.border}0a` : 'rgba(28,28,40,0.5)',
                  border: `1px solid ${ready ? (sk?.border + '38') : 'rgba(80,80,90,0.18)'}`,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <span style={{ fontSize: 15 }}>{sk?.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: sk?.color, fontSize: 11, fontWeight: 600 }}>
                      {src.node.label || sk?.label}
                    </div>
                    {hasFile && fd && (
                      <div style={{ color: '#505060', fontSize: 10 }}>📎 {fd.fileName}</div>
                    )}
                    {topN > 0 && (
                      <div style={{ color: '#505060', fontSize: 10 }}>📋 {topN} тем</div>
                    )}
                  </div>
                  <span style={{
                    fontSize: 9, padding: '2px 7px', borderRadius: 20,
                    background: ready ? 'rgba(74,222,128,0.09)' : 'rgba(251,191,36,0.09)',
                    color: ready ? '#4ade80' : '#fbbf24',
                    border: `1px solid ${ready ? 'rgba(74,222,128,0.22)' : 'rgba(251,191,36,0.22)'}`,
                    whiteSpace: 'nowrap' as const,
                  }}>
                    {hasFile ? '📄 файл' : ready ? '✓ готов' : '⏳'}
                  </span>
                </div>
              );
            })}

            {syllabus && (
              <div style={{
                padding: '8px 11px', borderRadius: 9,
                background: canGen ? 'rgba(74,222,128,0.05)' : 'rgba(248,113,113,0.05)',
                border: `1px solid ${canGen ? 'rgba(74,222,128,0.22)' : 'rgba(248,113,113,0.22)'}`,
              }}>
                <div style={{
                  color: canGen ? '#4ade80' : '#f87171', fontSize: 11, fontWeight: 600, marginBottom: 2,
                }}>
                  {canGen ? '✓' : '✗'} {syllabus.discipline}
                </div>
                {syllabus.hours ? (
                  <div style={{ color: '#505060', fontSize: 10 }}>{syllabus.hours} ч.</div>
                ) : null}
                {notInSyllabusWarning && (
                  <div style={{ color: '#f87171', fontSize: 10, marginTop: 3 }}>
                    <FontAwesomeIcon icon={faExclamationTriangle} style={{ fontSize: 9, marginRight: 4 }} />
                    {t('node_panel.not_in_syllabus_warning')}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ─── ПЕРЕДАЁТ В ─── */}
        {nonImportChildren.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={styles.nipSectionLabel}>→ Передаёт данные</div>
            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 5 }}>
              {nonImportChildren.map(child => {
                const ck = KINDS[child.kind];
                return (
                  <div key={child.id} style={{
                    padding: '3px 10px', borderRadius: 20,
                    background: `${ck?.border}10`,
                    border: `1px solid ${ck?.border}35`,
                    fontSize: 11, color: ck?.color,
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    {ck?.emoji} {child.label || ck?.label}
                    {child.status === 'done' && <span style={{ color: '#4ade80', fontSize: 9 }}>✓</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── ПРОМПТ ─── */}
        {node.prompt && (
          <div style={{ marginBottom: 14 }}>
            <div style={styles.nipSectionLabel}>💬 Промпт</div>
            <div style={{
              padding: '9px 11px', borderRadius: 9,
              background: 'rgba(24,24,36,0.7)', border: '1px solid rgba(80,80,90,0.15)',
              color: '#b0b0be', fontSize: 11, lineHeight: 1.6, wordBreak: 'break-word' as const,
            }}>
              {node.prompt}
            </div>
          </div>
        )}

        {/* ─── ОШИБКА ─── */}
        {node.error && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ ...styles.nipSectionLabel, color: '#f87171' }}>⚠ Ошибка</div>
            <div style={{
              padding: '9px 11px', borderRadius: 9,
              background: 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,0.25)',
              color: '#f87171', fontSize: 11, lineHeight: 1.5,
            }}>
              {node.error}
            </div>
          </div>
        )}

        {/* ─── ФАЙЛ РЕЗУЛЬТАТА ─── */}
        {node.filename && (
          <div style={{
            padding: '7px 11px', borderRadius: 9, marginBottom: 6,
            background: 'rgba(74,222,128,0.05)', border: '1px solid rgba(74,222,128,0.18)',
            display: 'flex', alignItems: 'center', gap: 7,
          }}>
            <FontAwesomeIcon icon={faFileWord} style={{ color: '#4ade80', fontSize: 14 }} />
            <span style={{
              color: '#4ade80', fontSize: 11,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
            }}>
              {node.filename}
            </span>
          </div>
        )}

      </div>

      {/* ══ FOOTER: КНОПКА ГЕНЕРАЦИИ ══ */}
      <div style={{
        padding: '11px 15px',
        borderTop: '1px solid rgba(80,80,95,0.14)',
        flexShrink: 0,
        background: 'rgba(8,8,14,0.55)',
      }}>
        <button
          onClick={() => !isDisabled && onRunNode(node.id)}
          disabled={!!isDisabled}
          style={{
            width: '100%', padding: '11px 0', borderRadius: 10,
            fontSize: 13, fontWeight: 700,
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 0.18s', opacity: isDisabled ? 0.4 : 1,
            ...(node.status === 'done'
              ? { background: 'rgba(74,222,128,0.09)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.22)' }
              : isDisabled
                ? { background: 'rgba(80,80,90,0.12)', color: '#454550', border: '1px solid rgba(80,80,90,0.18)' }
                : genMode === 'topics'
                  ? {
                      background: 'linear-gradient(135deg, rgba(94,234,212,0.14) 0%, rgba(94,234,212,0.07) 100%)',
                      color: '#5eead4', border: '1px solid rgba(94,234,212,0.32)',
                    }
                  : {
                      background: 'linear-gradient(135deg, #C49A6C 0%, #9a7448 100%)',
                      color: '#140c00', border: 'none',
                      boxShadow: '0 4px 16px rgba(196,154,108,0.35)',
                    }
            ),
          }}
        >
          {node.status === 'running' ? (
            <><FontAwesomeIcon icon={faSpinner} style={{ animation: 'spin 1s linear infinite' }} /> Генерирую...</>
          ) : node.status === 'done' ? (
            <><FontAwesomeIcon icon={faCheckCircle} /> Перегенерировать</>
          ) : genMode === 'topics' ? (
            <>⚡ Создать (только темы)</>
          ) : (
            <><span style={{ fontSize: 11 }}>▶</span> Создать с содержанием</>
          )}
        </button>
      </div>

    </div>
  );
};


// ─── Contextual Help Panel ─────────────────────────────────────────────────────

interface ContextualHelpPanelProps {
  isVisible: boolean;
  onClose: () => void;
  context: 'prompt' | 'detailed';
  docType: 'syllabus' | 'calendar';
}

export const ContextualHelpPanel: React.FC<ContextualHelpPanelProps> = ({
  isVisible,
  onClose,
  context,
  docType,
}) => {
  const { t } = useTranslation();
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
    } else {
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  if (!isAnimating && !isVisible) return null;

  const getPromptHelp = () => {
    if (docType === 'syllabus') {
      return {
        title: t('help.prompt_syllabus_title'),
        tips: [
          t('help.prompt_syllabus_tip_1'),
          t('help.prompt_syllabus_tip_2'),
          t('help.prompt_syllabus_tip_3'),
          t('help.prompt_syllabus_tip_4'),
          t('help.prompt_syllabus_tip_5'),
          t('help.prompt_syllabus_tip_6'),
        ],
        examples: [
          t('help.prompt_syllabus_example_1'),
          t('help.prompt_syllabus_example_2'),
        ],
      };
    } else {
      return {
        title: t('help.prompt_calendar_title'),
        tips: [
          t('help.prompt_calendar_tip_1'),
          t('help.prompt_calendar_tip_2'),
          t('help.prompt_calendar_tip_3'),
          t('help.prompt_calendar_tip_4'),
          t('help.prompt_calendar_tip_5'),
          t('help.prompt_calendar_tip_6'),
        ],
        examples: [
          t('help.prompt_calendar_example_1'),
          t('help.prompt_calendar_example_2'),
        ],
      };
    }
  };

  const getDetailedHelp = () => {
    if (docType === 'syllabus') {
      return {
        title: t('help.detailed_syllabus_title'),
        tips: [
          t('help.detailed_syllabus_tip_1'),
          t('help.detailed_syllabus_tip_2'),
          t('help.detailed_syllabus_tip_3'),
          t('help.detailed_syllabus_tip_4'),
          t('help.detailed_syllabus_tip_5'),
          t('help.detailed_syllabus_tip_6'),
          t('help.detailed_syllabus_tip_7'),
        ],
      };
    } else {
      return {
        title: t('help.detailed_calendar_title'),
        tips: [
          t('help.detailed_calendar_tip_1'),
          t('help.detailed_calendar_tip_2'),
          t('help.detailed_calendar_tip_3'),
          t('help.detailed_calendar_tip_4'),
          t('help.detailed_calendar_tip_5'),
          t('help.detailed_calendar_tip_6'),
          t('help.detailed_calendar_tip_7'),
        ],
      };
    }
  };

  type HelpContent = {
    title: string;
    tips: string[];
    examples?: string[];
  };

  const helpContent: HelpContent = context === 'prompt' ? getPromptHelp() : getDetailedHelp();

  return (
    <div
      style={{
        ...styles.helpPanel,
        transform: isVisible ? 'translateX(0)' : 'translateX(20px)',
        opacity: isVisible ? 1 : 0,
        pointerEvents: isVisible ? 'auto' : 'none',
      }}
    >
      <div style={styles.helpPanelHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FontAwesomeIcon icon={faLightbulbIcon} style={{ color: '#fbbf24' }} />
          <span style={{ color: '#f0f0f0', fontWeight: 600 }}>{t('help.tips')}</span>
        </div>
        <button onClick={onClose} style={styles.helpPanelClose}>
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>

      <div style={styles.helpPanelBody}>
        <h4 style={styles.helpPanelTitle}>{helpContent.title}</h4>

        <div style={styles.helpTipsList}>
          {helpContent.tips.map((tip, index) => (
            <div key={index} style={styles.helpTipItem}>
              <span style={styles.helpTipBullet}>•</span>
              <span style={styles.helpTipText}>{tip}</span>
            </div>
          ))}
        </div>

        {helpContent.examples && helpContent.examples.length > 0 && (
          <>
            <h5 style={styles.helpExamplesTitle}>{t('help.examples')}</h5>
            <div style={styles.helpExamplesList}>
              {helpContent.examples.map((ex: string, idx: number) => (
                <div key={idx} style={styles.helpExampleItem}>
                  <FontAwesomeIcon icon={faComment} style={{ fontSize: 10, color: '#6B8E7A', marginRight: 6 }} />
                  <span style={styles.helpExampleText}>&quot;{ex}&quot;</span>
                </div>
              ))}
            </div>
          </>
        )}

        <div style={styles.helpPanelFooter}>
          <FontAwesomeIcon icon={faInfoCircle} style={{ color: '#90909a', fontSize: 10 }} />
          <span style={styles.helpFooterText}>{t('help.footer_text')}</span>
        </div>
      </div>
    </div>
  );
};

// ─── Sidebar Component ────────────────────────────────────────────────────────

interface SidebarProps {
  KINDS: typeof import('./page.functional').KINDS;
  addNode: (kind: string) => void;
  zoom: number;
  setZoom: (fn: (z: number) => number) => void;
  setPan: (value: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) => void;
  selectedNode?: FlowNode | null;
  onUploadForNode?: (nodeId: string) => void;
}

const SIDEBAR_TABS = [
  {
    id: 'sro',
    label: 'sidebar.tabs.sro',
    desc: 'sidebar.tabs.sro_desc',
    faIcon: faPenToSquare,
    kinds: ['sro', 'srop', 'sro_full'],
  },
  {
    id: 'kp',
    label: 'sidebar.tabs.kp',
    desc: 'sidebar.tabs.kp_desc',
    faIcon: faClipboardList,
    kinds: ['kp'],
  },
  {
    id: 'lectures',
    label: 'sidebar.tabs.lectures',
    desc: 'sidebar.tabs.lectures_desc',
    faIcon: faChalkboardUser,
    kinds: ['lectures'],
  },
  {
    id: 'labs',
    label: 'sidebar.tabs.labs',
    desc: 'sidebar.tabs.labs_desc',
    faIcon: faMicroscope,
    kinds: ['labs', 'practicals'],
  },
  {
    id: 'schedule',
    label: 'sidebar.tabs.schedule',
    desc: 'sidebar.tabs.schedule_desc',
    faIcon: faCalendarAlt,
    kinds: ['calendar'],
  },
  {
    id: 'import',
    label: 'sidebar.tabs.import',
    desc: 'sidebar.tabs.import_desc',
    faIcon: faUpload,
    kinds: ['import'],
  },
  {
    id: 'assessment',
    label: 'sidebar.tabs.assessment',
    desc: 'sidebar.tabs.assessment_desc',
    faIcon: faListCheck,
    kinds: ['boundary_control', 'final_control'],
  },
  {
    id: 'excel',
    label: 'Excel',
    desc: 'Таблицы и журналы',
    faIcon: faTableCells,
    kinds: ['excel'],
  },
] as const;

const TAB_COLORS: Record<string, string> = {
  sro:        '#C49A6C',
  kp:         '#9A7B8C',
  lectures:   '#6B8E7A',
  labs:       '#5b8db8',
  schedule:   '#7b7bc4',
  import:     '#22c55e',
  assessment: '#e07070',
  excel:      '#1D6F42',
};

// Block Catalog Modal
interface BlockCatalogProps {
  KINDS: typeof import('./page.functional').KINDS;
  onClose: () => void;
  onAdd: (kind: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

const ALL_BLOCK_KINDS = ['import', 'calendar', 'lectures', 'labs', 'practicals', 'sro', 'srop', 'kp', 'sro_full', 'boundary_control', 'final_control', 'excel'];

const BlockCatalog: React.FC<BlockCatalogProps> = ({ KINDS, onClose, onAdd, searchQuery, setSearchQuery }) => {
  const { t } = useTranslation();
  const filtered = ALL_BLOCK_KINDS.filter(k => {
    const m = KINDS[k as keyof typeof KINDS];
    if (!m) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return m.label?.toLowerCase().includes(q) || m.desc?.toLowerCase().includes(q);
  });

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div style={{
        width: '90%', maxWidth: 680, maxHeight: '85vh',
        background: 'rgba(18,18,22,0.98)',
        border: '1px solid rgba(80,80,90,0.35)',
        borderRadius: 20,
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid rgba(80,80,90,0.2)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={{ color: '#f0f0f0', fontSize: 18, fontWeight: 600, margin: 0 }}>
              🗂 {t('sidebar.catalog.title')}
            </h2>
            <button onClick={onClose} style={{
              background: 'rgba(80,80,90,0.2)', border: 'none',
              color: '#90909a', borderRadius: 8, width: 32, height: 32,
              cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>✕</button>
          </div>
          <input
            autoFocus
            type="text"
            placeholder={t('sidebar.catalog.search_placeholder')}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'rgba(28,28,34,0.8)',
              border: '1px solid rgba(107,142,122,0.4)',
              borderRadius: 10, padding: '10px 14px',
              color: '#f0f0f0', fontSize: 14, outline: 'none',
            }}
          />
        </div>
        {/* Grid */}
        <div style={{ overflowY: 'auto', padding: 20, flex: 1 }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#60606a', padding: 40, fontSize: 14 }}>
              {t('sidebar.catalog.no_results')}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
              {filtered.map(k => {
                const m = KINDS[k as keyof typeof KINDS];
                if (!m) return null;
                return (
                  <button key={k} onClick={() => { onAdd(k); onClose(); }} style={{
                    background: `${m.border}10`,
                    border: `1px solid ${m.border}30`,
                    borderRadius: 14, padding: '16px 14px',
                    cursor: 'pointer', textAlign: 'left',
                    display: 'flex', flexDirection: 'column', gap: 8,
                    transition: 'all 0.18s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = m.border; (e.currentTarget as HTMLElement).style.background = `${m.border}20`; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = `${m.border}30`; (e.currentTarget as HTMLElement).style.background = `${m.border}10`; }}
                  >
                    <div style={{ fontSize: 26 }}>{m.emoji}</div>
                    <div style={{ color: '#f0f0f0', fontSize: 13, fontWeight: 600 }}>{m.label}</div>
                    <div style={{ color: '#90909a', fontSize: 11, lineHeight: 1.4 }}>{m.desc}</div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({ KINDS, addNode, zoom, setZoom, setPan, selectedNode, onUploadForNode }) => {
  const { t } = useTranslation();
  const [openTab, setOpenTab] = useState<string | null>(null);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const activeTabData = SIDEBAR_TABS.find(t => t.id === openTab);
  const tabKinds = activeTabData?.kinds || [];
  const isImportSelected = selectedNode?.kind === 'import';

  return (
    <>
      {catalogOpen && (
        <BlockCatalog
          KINDS={KINDS}
          onClose={() => { setCatalogOpen(false); setSearchQuery(''); }}
          onAdd={addNode}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      )}

      <aside style={styles.sb}>

        <div style={{ padding: '14px 14px 10px', flexShrink: 0 }}>
          <button
            onClick={() => setCatalogOpen(true)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              background: 'rgba(28,28,34,0.85)',
              border: '1px solid rgba(107,142,122,0.3)',
              borderRadius: 12, padding: '10px 14px',
              color: '#70707a', fontSize: 13, cursor: 'pointer',
              transition: 'all 0.2s', textAlign: 'left',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(107,142,122,0.6)';
              (e.currentTarget as HTMLElement).style.color = '#a0a0aa';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(107,142,122,0.3)';
              (e.currentTarget as HTMLElement).style.color = '#70707a';
            }}
          >
            <FontAwesomeIcon icon={faSearch} style={{ fontSize: 13, color: '#6B8E7A', flexShrink: 0 }} />
            <span style={{ flex: 1 }}>{t('sidebar.search_blocks')}</span>
            <span style={{
              fontSize: 9, color: '#50505a',
              background: 'rgba(80,80,90,0.25)',
              border: '1px solid rgba(80,80,90,0.3)',
              padding: '2px 6px', borderRadius: 5,
              letterSpacing: '0.02em',
            }}>⌘K</span>
          </button>
        </div>

        {isImportSelected && onUploadForNode && (
          <div style={{ padding: '0 14px 10px', flexShrink: 0 }}>
            <div style={{
              background: 'rgba(34,197,94,0.06)',
              border: '1px solid rgba(34,197,94,0.25)',
              borderRadius: 12, padding: '12px',
            }}>
              <div style={{ color: '#22c55e', fontSize: 11, fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <FontAwesomeIcon icon={faUpload} style={{ fontSize: 10 }} />
                {selectedNode.label}
              </div>
              {selectedNode.uploadedFile && (
                <div style={{ color: '#90909a', fontSize: 10, marginBottom: 8, paddingLeft: 2 }}>
                  ✓ {selectedNode.uploadedFile}
                </div>
              )}
              <button
                onClick={() => onUploadForNode(selectedNode.id)}
                style={{
                  width: '100%', background: '#22c55e', border: 'none',
                  borderRadius: 8, padding: '8px 12px',
                  color: '#000', fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                <FontAwesomeIcon icon={faUpload} style={{ fontSize: 11 }} />
                {selectedNode.uploadedFile ? t('sidebar.replace_file') : t('sidebar.upload_syllabus')}
              </button>
            </div>
          </div>
        )}

        <div style={styles.sbDivider} />

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>

          {!openTab ? (
            <>
              <p style={{ ...styles.sbLabel, marginBottom: 10, fontSize: 11 }}>{t('sidebar.add_block')}</p>
              {SIDEBAR_TABS.map(tab => {
                return (
                  <button
                    key={tab.id}
                    onClick={() => setOpenTab(tab.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      width: '100%', textAlign: 'left',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      borderRadius: 12,
                      padding: '12px 14px',
                      marginBottom: 7,
                      cursor: 'pointer',
                      transition: 'all 0.18s',
                    }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.background = 'rgba(255,255,255,0.07)';
                      el.style.borderColor = 'rgba(255,255,255,0.14)';
                      el.style.transform = 'translateX(2px)';
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.background = 'rgba(255,255,255,0.03)';
                      el.style.borderColor = 'rgba(255,255,255,0.07)';
                      el.style.transform = 'translateX(0)';
                    }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <FontAwesomeIcon icon={tab.faIcon} style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14 }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: 'rgba(255,255,255,0.82)', fontSize: 13, fontWeight: 500, marginBottom: 2, letterSpacing: '0.01em' }}>
                        {t(tab.label)}
                      </div>
                      <div style={{ color: 'rgba(255,255,255,0.28)', fontSize: 11 }}>
                        {t(tab.desc)}
                      </div>
                    </div>
                    <FontAwesomeIcon icon={faChevronRight} style={{ color: 'rgba(255,255,255,0.18)', fontSize: 10, flexShrink: 0 }} />
                  </button>
                );
              })}
            </>
          ) : (
            <>
              <button
                onClick={() => setOpenTab(null)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  background: 'transparent', border: 'none',
                  color: '#90909a', fontSize: 12, cursor: 'pointer',
                  padding: '2px 0', marginBottom: 12,
                  transition: 'color 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#c0c0cc'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#90909a'}
              >
                <FontAwesomeIcon icon={faArrowLeft} style={{ fontSize: 11 }} />
                <span style={{ color: TAB_COLORS[openTab] || '#C49A6C', fontWeight: 600 }}>
                  {activeTabData ? t(activeTabData.label) : ''}
                </span>
              </button>

              {tabKinds.map(k => {
                const m = KINDS[k as keyof typeof KINDS];
                if (!m) return null;
                return (
                  <button key={k} onClick={() => addNode(k)} style={{
                    ...styles.sbItem,
                    background: `${m.border}10`,
                    border: `1px solid ${m.border}28`,
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = `${m.border}22`;
                    (e.currentTarget as HTMLElement).style.borderColor = `${m.border}60`;
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = `${m.border}10`;
                    (e.currentTarget as HTMLElement).style.borderColor = `${m.border}28`;
                  }}
                  >
                    <div style={{ ...styles.sbIcon, borderColor: m.border, background: `${m.border}20` }}>
                      <FontAwesomeIcon icon={m.faIcon} style={{ color: m.border, fontSize: 12 }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#f0f0f0', fontSize: 12, fontWeight: 500 }}>{m.label}</div>
                      <div style={{ color: '#90909a', fontSize: 10 }}>{m.desc}</div>
                    </div>
                    <FontAwesomeIcon icon={faPlus} style={{ color: `${m.border}80`, fontSize: 10 }} />
                  </button>
                );
              })}
            </>
          )}
        </div>

        <div style={styles.sbDivider} />

        <div style={styles.sbSec}>
          <p style={styles.sbLabel}>
            <FontAwesomeIcon icon={faLightbulb} style={{ marginRight: 6, color: '#C49A6C' }} />
            {t('sidebar.hints')}
          </p>
          <div style={styles.hintCard}>
            <div style={styles.hintRow}><span style={styles.hintKey}>{t('sidebar.hint_import')}</span><span style={styles.hintVal}>{t('sidebar.hint_import_desc')}</span></div>
            <div style={styles.hintRow}><span style={styles.hintKey}>{t('sidebar.hint_arrow')}</span><span style={styles.hintVal}>{t('sidebar.hint_arrow_desc')}</span></div>
            <div style={styles.hintRow}><span style={styles.hintKey}>{t('sidebar.hint_drag')}</span><span style={styles.hintVal}>{t('sidebar.hint_drag_desc')}</span></div>
            <div style={styles.hintRow}><span style={styles.hintKey}>{t('sidebar.hint_wheel')}</span><span style={styles.hintVal}>{t('sidebar.hint_wheel_desc')}</span></div>
            <div style={styles.hintRow}><span style={styles.hintKey}>{t('sidebar.hint_del')}</span><span style={styles.hintVal}>{t('sidebar.hint_del_desc')}</span></div>
          </div>
        </div>

        <div style={styles.sbDivider} />

        <div style={styles.sbSec}>
          <div style={{ display: 'flex', gap: 4 }}>
            <button style={styles.zBtn} onClick={() => setZoom(z => Math.min(2, z * 1.15))}>
              <FontAwesomeIcon icon={faPlus} />
            </button>
            <span style={{ flex: 1, textAlign: 'center', color: '#90909a', fontSize: 12 }}>
              {Math.round(zoom*100)}%
            </span>
            <button style={styles.zBtn} onClick={() => setZoom(z => Math.max(0.2, z / 1.15))}>
              <FontAwesomeIcon icon={faMinus} />
            </button>
            <button style={styles.zBtn} onClick={() => { setPan({ x: 80, y: 50 }); setZoom(() => 0.88); }}>
              ↺
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

// ─── Master Mode UI ───────────────────────────────────────────────────────────

interface MasterModeUIProps {
  masterStep: number;
  selectedBlocks: NodeKind[];
  isGenerating: boolean;
  onNext: () => void;
  onPrev: () => void;
  onToggleBlock: (kind: NodeKind) => void;
  onGenerate: () => void;
}

// Все доступные блоки для выбора, сгруппированные по категориям
const MASTER_BLOCK_GROUPS: {
  label: string;
  blocks: { kind: NodeKind; label: string; emoji: string; desc: string; color: string }[];
}[] = [
  {
    label: 'Планирование',
    blocks: [
      { kind: 'calendar',   label: 'Календарный план', emoji: '📅', desc: 'КТП / расписание занятий',    color: '#6B8E7A' },
      { kind: 'lectures',   label: 'Лекции',           emoji: '📋', desc: 'Планы лекционных занятий',    color: '#9A7B8C' },
    ],
  },
  {
    label: 'Практика',
    blocks: [
      { kind: 'labs',       label: 'Лаб. работы',      emoji: '🧪', desc: 'Методические указания',       color: '#C49A6C' },
      { kind: 'practicals', label: 'Практические',     emoji: '💻', desc: 'Планы семинаров',             color: '#7C9A92' },
    ],
  },
  {
    label: 'Самостоятельная работа',
    blocks: [
      { kind: 'sro',        label: 'СРО задания',      emoji: '✏️', desc: 'Задания самост. работы',      color: '#8A7C9A' },
      { kind: 'srop',       label: 'СРОП задания',     emoji: '📝', desc: 'Работа с преподавателем',     color: '#9A8A7C' },
      { kind: 'sro_full',   label: 'СРО (полный)',     emoji: '📚', desc: 'Полный документ СРО',         color: '#4A7A8C' },
      { kind: 'kp',         label: 'Курсовой проект',  emoji: '🏗️', desc: 'КП / курсовая работа',       color: '#7C8A9A' },
    ],
  },
  {
    label: 'Контроль',
    blocks: [
      { kind: 'boundary_control', label: 'Рубежный контроль',  emoji: '📋', desc: 'Тестовые вопросы РК',   color: '#A06A9A' },
      { kind: 'final_control',    label: 'Итоговый контроль',  emoji: '🎓', desc: 'Материалы экзамена',     color: '#6A8ACA' },
    ],
  },
];

// Flat list for reuse
const MASTER_BLOCKS = MASTER_BLOCK_GROUPS.flatMap(g => g.blocks);

// ── Ripple helper ──────────────────────────────────────────────────────────────
const MasterBlockCard: React.FC<{
  block: { kind: NodeKind; label: string; emoji: string; desc: string; color: string };
  active: boolean;
  animIndex: number;
  onToggle: (kind: NodeKind) => void;
}> = ({ block, active, animIndex, onToggle }) => {
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const nextId = useRef(0);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = nextId.current++;
    setRipples(r => [...r, { id, x, y }]);
    setTimeout(() => setRipples(r => r.filter(rp => rp.id !== id)), 500);
    onToggle(block.kind);
  };

  return (
    <button
      onClick={handleClick}
      style={{
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 6,
        padding: '13px 13px 12px',
        borderRadius: 14,
        cursor: 'pointer',
        textAlign: 'left',
        background: active ? `${block.color}1a` : 'rgba(22,22,28,0.7)',
        border: `1.5px solid ${active ? block.color : 'rgba(70,70,80,0.35)'}`,
        transition: 'all 0.18s cubic-bezier(0.34,1.56,0.64,1)',
        transform: active ? 'translateY(-2px) scale(1.015)' : 'translateY(0) scale(1)',
        boxShadow: active ? `0 4px 20px ${block.color}30` : 'none',
        animation: `masterCardIn 0.3s ease both`,
        animationDelay: `${animIndex * 40}ms`,
      }}
    >
      {/* Цветная полоска сверху */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        borderRadius: '14px 14px 0 0',
        background: block.color,
        opacity: active ? 1 : 0,
        transition: 'opacity 0.18s',
      }} />

      {/* Чекмарк */}
      <div style={{
        position: 'absolute', top: 10, right: 10,
        width: 18, height: 18, borderRadius: '50%',
        background: active ? block.color : 'rgba(50,50,60,0.6)',
        border: `1.5px solid ${active ? block.color : 'rgba(80,80,90,0.4)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.18s',
        flexShrink: 0,
      }}>
        {active && (
          <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
            <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>

      {/* Emoji */}
      <span style={{
        fontSize: 22,
        display: 'block',
        transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)',
        transform: active ? 'scale(1.15)' : 'scale(1)',
        marginBottom: 2,
      }}>
        {block.emoji}
      </span>

      <div style={{ color: '#eeeef2', fontSize: 12.5, fontWeight: 600, lineHeight: 1.3, paddingRight: 18 }}>
        {block.label}
      </div>
      <div style={{ color: '#606070', fontSize: 11, lineHeight: 1.4 }}>
        {block.desc}
      </div>

      {/* Ripple эффекты */}
      {ripples.map(rp => (
        <span
          key={rp.id}
          style={{
            position: 'absolute',
            left: rp.x, top: rp.y,
            width: 0, height: 0,
            borderRadius: '50%',
            background: `${block.color}55`,
            transform: 'translate(-50%,-50%)',
            animation: 'masterRipple 0.5s ease-out forwards',
            pointerEvents: 'none',
          }}
        />
      ))}
    </button>
  );
};

// ── Шаг 2: анимированный список ────────────────────────────────────────────────
const Step2Item: React.FC<{
  emoji: string;
  label: string;
  color: string;
  index: number;
  badge?: React.ReactNode;
}> = ({ emoji, label, color, index, badge }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '10px 14px', borderRadius: 12,
    background: `${color}10`,
    border: `1px solid ${color}35`,
    animation: 'masterListIn 0.35s ease both',
    animationDelay: `${index * 55}ms`,
  }}>
    {/* Иконка с номером */}
    <div style={{
      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
      background: `${color}22`, border: `1px solid ${color}40`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 18,
    }}>
      {emoji}
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ color: '#eeeef2', fontSize: 13, fontWeight: 500 }}>{label}</div>
    </div>
    {badge}
    {/* Animated connector line (not last) */}
    <div style={{
      position: 'absolute', left: 34, bottom: -8,
      width: 1, height: 8,
      background: `${color}25`,
    }} />
  </div>
);

// ── Инлайн keyframes через <style> тег ─────────────────────────────────────────
const MasterKeyframes: React.FC = () => (
  <style>{`
    @keyframes masterCardIn {
      from { opacity: 0; transform: translateY(8px) scale(0.96); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes masterRipple {
      from { width: 0; height: 0; opacity: 1; }
      to   { width: 140px; height: 140px; opacity: 0; }
    }
    @keyframes masterListIn {
      from { opacity: 0; transform: translateX(-10px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    @keyframes masterChipIn {
      from { opacity: 0; transform: scale(0.75); }
      to   { opacity: 1; transform: scale(1); }
    }
    @keyframes masterPulse {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0.55; }
    }
  `}</style>
);

export const MasterModeUI: React.FC<MasterModeUIProps> = ({
  masterStep,
  selectedBlocks,
  isGenerating,
  onNext,
  onPrev,
  onToggleBlock,
  onGenerate,
}) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { t: _t } = useTranslation();

  const activeCount = selectedBlocks.filter(k => k !== 'import').length;
  const allKinds = MASTER_BLOCKS.map(b => b.kind);
  const allSelected = allKinds.every(k => selectedBlocks.includes(k));

  const handleSelectAll = () => {
    if (allSelected) {
      allKinds.forEach(k => { if (selectedBlocks.includes(k)) onToggleBlock(k); });
    } else {
      allKinds.forEach(k => { if (!selectedBlocks.includes(k)) onToggleBlock(k); });
    }
  };

  // ── ШАГ 0: Выбор блоков ──────────────────────────────────────────────────
  const renderStep0 = () => (
    <div style={styles.masterStep}>
      <MasterKeyframes />

      {/* Заголовок + пресет */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6, gap: 10 }}>
        <div>
          <div style={styles.stepIndicator}>Шаг 1 из 2</div>
          <h3 style={{ ...styles.stepTitle, marginBottom: 4, marginTop: 6 }}>
            Что нужно сгенерировать?
          </h3>
          <p style={{ color: '#60606a', fontSize: 12, lineHeight: 1.5, marginBottom: 0 }}>
            Блок «Импорт» добавляется автоматически.
          </p>
        </div>
        <button
          onClick={handleSelectAll}
          style={{
            flexShrink: 0,
            marginTop: 20,
            padding: '6px 13px',
            borderRadius: 20,
            border: `1px solid ${allSelected ? 'rgba(239,68,68,0.4)' : 'rgba(196,154,108,0.4)'}`,
            background: allSelected ? 'rgba(239,68,68,0.08)' : 'rgba(196,154,108,0.08)',
            color: allSelected ? '#f87171' : '#C49A6C',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s',
            whiteSpace: 'nowrap',
          }}
        >
          {allSelected ? '✕ Снять всё' : '✓ Выбрать всё'}
        </button>
      </div>

      {/* Блок Импорт — всегда */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 14px', borderRadius: 12, marginBottom: 16,
        background: 'rgba(180,95,77,0.1)', border: '1.5px solid rgba(180,95,77,0.4)',
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: 9, flexShrink: 0,
          background: 'rgba(180,95,77,0.15)', border: '1px solid rgba(180,95,77,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17,
        }}>📥</div>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#eeeef2', fontWeight: 600, fontSize: 13 }}>Импорт силлабуса</div>
          <div style={{ color: '#60606a', fontSize: 11, marginTop: 1 }}>Загрузить .doc/.docx — всегда включён</div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '3px 9px', borderRadius: 20, fontSize: 11,
          background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.35)',
          color: '#22c55e', fontWeight: 600,
        }}>✓ включён</div>
      </div>

      {/* Группы с карточками */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {MASTER_BLOCK_GROUPS.map(group => {
          const groupActiveCount = group.blocks.filter(b => selectedBlocks.includes(b.kind)).length;
          return (
            <div key={group.label}>
              {/* Заголовок группы */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8,
              }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.07em',
                  textTransform: 'uppercase' as const, color: '#50505a',
                }}>
                  {group.label}
                </span>
                {groupActiveCount > 0 && (
                  <span style={{
                    fontSize: 10, padding: '1px 7px', borderRadius: 20,
                    background: 'rgba(196,154,108,0.12)', border: '1px solid rgba(196,154,108,0.25)',
                    color: '#C49A6C', fontWeight: 600,
                    animation: 'masterChipIn 0.2s ease',
                  }}>
                    {groupActiveCount}
                  </span>
                )}
                <div style={{ flex: 1, height: 1, background: 'rgba(60,60,70,0.5)' }} />
              </div>
              {/* Сетка карточек */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))',
                gap: 8,
              }}>
                {group.blocks.map((block, i) => (
                  <MasterBlockCard
                    key={block.kind}
                    block={block}
                    active={selectedBlocks.includes(block.kind)}
                    animIndex={i}
                    onToggle={onToggleBlock}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Счётчик + валидация */}
      <div style={{
        marginTop: 16, display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 12px', borderRadius: 10,
        background: activeCount === 0 ? 'rgba(239,68,68,0.06)' : 'rgba(107,142,122,0.07)',
        border: `1px solid ${activeCount === 0 ? 'rgba(239,68,68,0.2)' : 'rgba(107,142,122,0.2)'}`,
        transition: 'all 0.2s',
      }}>
        {activeCount === 0 ? (
          <>
            <span style={{ fontSize: 13, animation: 'masterPulse 1.5s ease infinite' }}>⚠️</span>
            <span style={{ color: '#f87171', fontSize: 12 }}>Выберите хотя бы один блок для продолжения</span>
          </>
        ) : (
          <>
            <span style={{ fontSize: 13 }}>✅</span>
            <span style={{ color: '#6B8E7A', fontSize: 12 }}>
              Выбрано <strong style={{ color: '#a0c0a8' }}>{activeCount}</strong> {activeCount === 1 ? 'блок' : activeCount < 5 ? 'блока' : 'блоков'} — готово к следующему шагу
            </span>
          </>
        )}
      </div>
    </div>
  );

  // ── ШАГ 1: Подтверждение ──────────────────────────────────────────────────
  const renderStep1 = () => {
    // Создаем более точный тип для блоков в MASTER_BLOCKS (исключая 'import')
    type MasterBlockKind = Exclude<NodeKind, 'import'>;
    
    const chosen: { kind: NodeKind; emoji: string; label: string; color: string }[] = [
      { kind: 'import', emoji: '📥', label: 'Импорт силлабуса', color: '#B45F4D' },
      ...selectedBlocks
        .filter((k): k is MasterBlockKind => k !== 'import') // Type guard для исключения import
        .map(k => {
          const b = MASTER_BLOCKS.find(x => x.kind === k);
          // Теперь TypeScript знает, что b не может быть null для этих k
          return {
            kind: k,
            emoji: b!.emoji,
            label: b!.label,
            color: b!.color
          };
        }),
    ];

    return (
      <div style={styles.masterStep}>
        <MasterKeyframes />
        <div style={styles.stepIndicator}>Шаг 2 из 2</div>
        <h3 style={{ ...styles.stepTitle, marginBottom: 4, marginTop: 6 }}>Проект готов к созданию</h3>
        <p style={{ color: '#60606a', fontSize: 12, lineHeight: 1.5, marginBottom: 16 }}>
          После создания загрузите силлабус — и нажмите «Старт».
        </p>

        {/* Анимированный список блоков */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 16, position: 'relative' }}>
          {chosen.map((item, i) => (
            <Step2Item
              key={item.kind}
              emoji={item.emoji}
              label={item.label}
              color={item.color}
              index={i}
              badge={i === 0 ? (
                <span style={{
                  fontSize: 10, color: '#B45F4D',
                  background: 'rgba(180,95,77,0.12)', borderRadius: 6, padding: '2px 8px',
                  border: '1px solid rgba(180,95,77,0.25)', fontWeight: 600, whiteSpace: 'nowrap',
                }}>
                  загрузить файл
                </span>
              ) : undefined}
            />
          ))}
        </div>

        {/* Инструкция */}
        <div style={{
          padding: '13px 15px', borderRadius: 12,
          background: 'rgba(107,142,122,0.07)', border: '1px solid rgba(107,142,122,0.2)',
        }}>
          <div style={{ color: '#6B8E7A', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' as const, marginBottom: 8 }}>
            Что будет дальше
          </div>
          {[
            { n: '1', text: 'Мастер создаст проект и расположит блоки на холсте' },
            { n: '2', text: 'Загрузите силлабус (.docx) в блок «Импорт»' },
            { n: '3', text: 'Нажмите «▶ Старт» — блоки сгенерируются автоматически' },
          ].map(step => (
            <div key={step.n} style={{ display: 'flex', gap: 10, marginBottom: 6, alignItems: 'flex-start' }}>
              <div style={{
                width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                background: 'rgba(107,142,122,0.15)', border: '1px solid rgba(107,142,122,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, color: '#6B8E7A', fontWeight: 700, marginTop: 1,
              }}>{step.n}</div>
              <span style={{ color: '#909098', fontSize: 12, lineHeight: 1.5 }}>{step.text}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={styles.modeInterface}>
      <div style={styles.masterContainer}>
        <div style={styles.modeHeader}>
          <h2 style={styles.modeTitle}>Мастер создания проекта</h2>
          <p style={styles.modeDesc}>Выберите блоки — мастер сам соберёт холст</p>
        </div>

        <div style={styles.masterCard}>
          {masterStep === 0 ? renderStep0() : renderStep1()}

          <div style={styles.masterNav}>
            {masterStep > 0 ? (
              <button style={styles.masterNavBtn} onClick={onPrev}>
                <FontAwesomeIcon icon={faArrowLeft} /> Назад
              </button>
            ) : <div />}

            {masterStep < 1 ? (
              <button
                style={{
                  ...styles.masterNavBtnPrimary,
                  opacity: activeCount === 0 ? 0.45 : 1,
                  transition: 'opacity 0.2s',
                }}
                onClick={onNext}
                disabled={activeCount === 0}
              >
                Далее <FontAwesomeIcon icon={faArrowRight} />
              </button>
            ) : (
              <button
                style={styles.masterNavBtnPrimary}
                onClick={onGenerate}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <><FontAwesomeIcon icon={faSpinner} spin /> Создаём...</>
                ) : (
                  <><FontAwesomeIcon icon={faWandMagicSparkles} /> Создать проект</>
                )}
              </button>
            )}
          </div>
        </div>

        <div style={styles.stepProgress}>
          {[0, 1].map(step => (
            <div
              key={step}
              style={{
                ...styles.stepDot,
                width: step === masterStep ? 20 : 8,
                transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Express Mode UI с выбором режимов ─────────────────────────────────────

interface ExpressModeUIProps {
  uploadedFile: File | null;
  isAnalyzing: boolean;
  analysis: AnalysisResult | null;
  analysisStep: number;
  onFileUpload: (file: File) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  docType: 'syllabus' | 'calendar';
  setDocType: (type: 'syllabus' | 'calendar') => void;
  generationMode: 'quick' | 'detailed';
  setGenerationMode: (mode: 'quick' | 'detailed') => void;
  rupFormData: RupFormDataType;
  calendarFormData: CalendarFormDataType;
  updateRupFormData: (field: string, value: unknown) => void;
  updateCalendarFormData: (field: string, value: unknown) => void;
  chatMessages: ChatMessage[];
  isChatWaiting: boolean;
  chatInput: string;
  onChatInputChange: (value: string) => void;
  onSendChatMessage: (message: string) => void;
  isGenerating: boolean;
  onFocusInput: (context: 'prompt' | 'detailed') => void;
  onBlurInput: () => void;
}

export const ExpressModeUI: React.FC<ExpressModeUIProps> = ({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  uploadedFile: _uploadedFile,
  isAnalyzing,
  analysis,
  analysisStep,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onFileUpload: _onFileUpload,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  fileInputRef: _fileInputRef,
  docType,
  setDocType,
  generationMode,
  setGenerationMode,
  rupFormData,
  calendarFormData,
  updateRupFormData,
  updateCalendarFormData,
  chatMessages,
  isChatWaiting,
  chatInput,
  onChatInputChange,
  onSendChatMessage,
  isGenerating,
  onFocusInput,
  onBlurInput,
}) => {
  const { t } = useTranslation();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  // isPromptFocused state handled via onFocusInput/onBlurInput callbacks
  const formContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim() && !isChatWaiting && !isGenerating) {
      onSendChatMessage(chatInput);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  const expressColor = (MODES as Record<string, { color: string; icon: unknown }>).express?.color ?? '#6B8E7A';

  if (isAnalyzing) {
    return (
      <div style={styles.modeInterface}>
        <div style={styles.expressContainer}>
          <div style={styles.modeHeader}>
            <div style={styles.modeIcon}>
              <FontAwesomeIcon icon={((MODES as Record<string, { icon: import('@fortawesome/fontawesome-svg-core').IconDefinition }>).express?.icon) ?? faRocket} style={{ color: expressColor, fontSize: 32 }} />
            </div>
            <h2 style={styles.modeTitle}>{t('express.title')}</h2>
            <p style={styles.modeDesc}>{t('express.desc')}</p>
          </div>
          <div style={styles.expressAnalysis}>
            <FontAwesomeIcon icon={faFileWord} style={{ fontSize: 40, color: expressColor, marginBottom: 20 }} />
            <div style={styles.analysisProgress}>
              <div style={{ ...styles.analysisStep, color: expressColor }}>{ANALYSIS_STEPS[analysisStep]}</div>
              <div style={styles.progressBar}>
                <div style={{ ...styles.progressFill, background: expressColor, width: `${((analysisStep + 1) / ANALYSIS_STEPS.length) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.modeInterface}>
      <div style={styles.expressMainContainer}>
        <div style={styles.expressHeader}>
          <div style={styles.modeIcon}>
            <FontAwesomeIcon icon={((MODES as Record<string, { icon: import('@fortawesome/fontawesome-svg-core').IconDefinition }>).express?.icon) ?? faRocket} style={{ color: expressColor, fontSize: 28 }} />
          </div>
          <h2 style={{ ...styles.modeTitle, fontSize: 22, margin: 0 }}>{t('express.title')}</h2>
<p style={{ ...styles.modeDesc, fontSize: 13, margin: 0 }}>
  {analysis 
    ? (t('express.analysis_result') as string).replace('{discipline}', analysis.discipline).replace('{hours}', String(analysis.hours))
    : t('express.select_options')}
</p>
        </div>

        <div ref={formContainerRef} style={styles.expressScrollContent}>
          <div style={styles.docTypeSelector}>
            <button
              style={{
                ...styles.docTypeButton,
                background: docType === 'syllabus' ? `${expressColor}20` : 'transparent',
                borderColor: docType === 'syllabus' ? expressColor : 'rgba(80,80,90,0.3)',
                color: docType === 'syllabus' ? expressColor : '#90909a',
              }}
              onClick={() => setDocType('syllabus')}
            >
              <FontAwesomeIcon icon={faBook} />
              <span>{t('express.syllabus')}</span>
            </button>
            <button
              style={{
                ...styles.docTypeButton,
                background: docType === 'calendar' ? `${expressColor}20` : 'transparent',
                borderColor: docType === 'calendar' ? expressColor : 'rgba(80,80,90,0.3)',
                color: docType === 'calendar' ? expressColor : '#90909a',
              }}
              onClick={() => setDocType('calendar')}
            >
              <FontAwesomeIcon icon={faCalendarAlt} />
              <span>{t('express.calendar')}</span>
            </button>
          </div>

          <div style={styles.modeSelector}>
            <button
              style={{
                ...styles.modeOption,
                background: generationMode === 'quick' ? `${expressColor}20` : 'rgba(28,28,34,0.6)',
                borderColor: generationMode === 'quick' ? expressColor : 'rgba(80,80,90,0.3)',
              }}
              onClick={() => setGenerationMode('quick')}
              onFocus={() => onFocusInput('prompt')}
              onBlur={onBlurInput}
            >
              <div style={{ ...styles.modeOptionIcon, borderColor: expressColor }}>
                <FontAwesomeIcon icon={faBolt} style={{ color: expressColor }} />
              </div>
              <div style={styles.modeOptionContent}>
                <h3 style={styles.modeOptionContentH3}>{t('express.quick_mode')}</h3>
                <p style={styles.modeOptionContentP}>{t('express.quick_desc')}</p>
              </div>
            </button>
            
            <button
              style={{
                ...styles.modeOption,
                background: generationMode === 'detailed' ? `${expressColor}20` : 'rgba(28,28,34,0.6)',
                borderColor: generationMode === 'detailed' ? expressColor : 'rgba(80,80,90,0.3)',
              }}
              onClick={() => setGenerationMode('detailed')}
              onFocus={() => onFocusInput('detailed')}
              onBlur={onBlurInput}
            >
              <div style={{ ...styles.modeOptionIcon, borderColor: expressColor }}>
                <FontAwesomeIcon icon={faGear} style={{ color: expressColor }} />
              </div>
              <div style={styles.modeOptionContent}>
                <h3 style={styles.modeOptionContentH3}>{t('express.detailed_mode')}</h3>
                <p style={styles.modeOptionContentP}>{t('express.detailed_desc')}</p>
              </div>
            </button>
          </div>

          <div style={styles.expressFullColumn}>
            {generationMode === 'quick' ? (
              <div style={styles.quickModeContainer}>
                <h3 style={styles.sectionTitle}>
                  <FontAwesomeIcon icon={faBolt} style={{ color: expressColor, marginRight: 8 }} />
                  {t('express.describe_document')}
                </h3>
                
                <textarea
                  value={chatInput}
                  onChange={(e) => onChatInputChange(e.target.value)}
                  onFocus={() => onFocusInput('prompt')}
                  onBlur={onBlurInput}
                  placeholder={
                    docType === 'syllabus'
                      ? t('express.syllabus_placeholder')
                      : t('express.calendar_placeholder')
                  }
                  rows={5}
                  style={styles.promptTextarea}
                />
                
                <button
                  style={{ ...styles.generateButton, background: expressColor, marginTop: 16 }}
                  onClick={() => onSendChatMessage(chatInput)}
                  disabled={!chatInput.trim() || isChatWaiting || isGenerating}
                >
                  {isGenerating
                    ? <><FontAwesomeIcon icon={faSpinner} spin /> {t('express.generating')}</>
                    : <><FontAwesomeIcon icon={faWandMagicSparkles} /> {t('express.create_document')}</>
                  }
                </button>
                
                {(isChatWaiting || isGenerating) && (
                  <div style={styles.inlineStatusMessage}>
                    <FontAwesomeIcon icon={faSpinner} spin style={{ color: expressColor }} />
                    <span>{isGenerating ? t('express.generating_document') : t('express.processing_request')}</span>
                  </div>
                )}
                
                {chatMessages.length > 1 && !isGenerating && !isChatWaiting && (
                  <div style={styles.lastAssistantMessage}>
                    {chatMessages.filter(m => m.role === 'assistant').slice(-1).map((msg: ChatMessage) => (
                      <div key={msg.id} style={{ fontSize: 13, color: '#c0c0cc', lineHeight: 1.6 }}>{msg.content}</div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={styles.detailedModeContainer}>
                <h3 style={styles.sectionTitle}>
                  <FontAwesomeIcon icon={faGear} style={{ color: expressColor, marginRight: 8 }} />
                  {t('express.detailed_settings')}
                </h3>

                {docType === 'syllabus' ? (
                  <div>
                    <div style={styles.formGridTwo}>
                      <div style={styles.formCard}>
                        <div style={styles.formCardHeader}>
                          <div style={{ ...styles.formCardIcon, borderColor: expressColor }}>
                            <FontAwesomeIcon icon={faBook} style={{ color: expressColor }} />
                          </div>
                          <span style={styles.formCardTitle}>{t('express.discipline')}</span>
                        </div>
                        
                        <div style={styles.formGroup}>
                          <label style={styles.formLabel}>{t('express.discipline_name')} *</label>
                          <input 
                            type="text" 
                            value={rupFormData.subject} 
                            onChange={(e) => updateRupFormData('subject', e.target.value)} 
                            onFocus={() => onFocusInput('detailed')}
                            onBlur={onBlurInput}
                            placeholder={t('express.discipline_placeholder')} 
                            style={styles.formInput} 
                          />
                        </div>
                        
                        <div style={styles.formRow}>
                          <div style={styles.formGroup}>
                            <label style={styles.formLabel}>{t('express.discipline_code')}</label>
                            <input 
                              type="text" 
                              value={rupFormData.code} 
                              onChange={(e) => updateRupFormData('code', e.target.value)} 
                              onFocus={() => onFocusInput('detailed')}
                              onBlur={onBlurInput}
                              placeholder={t('express.code_placeholder')} 
                              style={styles.formInput} 
                            />
                          </div>
                          <div style={styles.formGroup}>
                            <label style={styles.formLabel}>{t('express.credits')}</label>
                            <input 
                              type="number" 
                              value={rupFormData.credits} 
                              onChange={(e) => updateRupFormData('credits', e.target.value)} 
                              onFocus={() => onFocusInput('detailed')}
                              onBlur={onBlurInput}
                              placeholder="5" 
                              min="1" 
                              max="15" 
                              style={styles.formInput} 
                            />
                          </div>
                        </div>
                        
                        <div style={styles.formGroup}>
                          <label style={styles.formLabel}>{t('express.discipline_cycle')}</label>
                          <select 
                            value={rupFormData.cycle} 
                            onChange={(e) => updateRupFormData('cycle', e.target.value)} 
                            onFocus={() => onFocusInput('detailed')}
                            onBlur={onBlurInput}
                            style={styles.formSelect}
                          >
                            <option value="">{t('express.select_cycle')}</option>
                            <option value="Общеобразовательные дисциплины">{t('express.general')}</option>
                            <option value="Базовые дисциплины">{t('express.basic')}</option>
                            <option value="Профилирующие дисциплины">{t('express.major')}</option>
                          </select>
                        </div>
                      </div>

                      <div style={styles.formCard}>
                        <div style={styles.formCardHeader}>
                          <div style={{ ...styles.formCardIcon, borderColor: expressColor }}>
                            <FontAwesomeIcon icon={faClock} style={{ color: expressColor }} />
                          </div>
                          <span style={styles.formCardTitle}>{t('express.course_parameters')}</span>
                        </div>
                        
                        <div style={styles.formRow}>
                          <div style={styles.formGroup}>
                            <label style={styles.formLabel}>{t('express.course')}</label>
                            <input 
                              type="text" 
                              value={rupFormData.grade} 
                              onChange={(e) => updateRupFormData('grade', e.target.value)} 
                              onFocus={() => onFocusInput('detailed')}
                              onBlur={onBlurInput}
                              placeholder={t('express.course_placeholder')} 
                              style={styles.formInput} 
                            />
                          </div>
                          <div style={styles.formGroup}>
                            <label style={styles.formLabel}>{t('express.semester')}</label>
                            <select 
                              value={rupFormData.semester} 
                              onChange={(e) => updateRupFormData('semester', e.target.value)} 
                              onFocus={() => onFocusInput('detailed')}
                              onBlur={onBlurInput}
                              style={styles.formSelect}
                            >
                              <option value="1">{t('express.semester_1')}</option>
                              <option value="2">{t('express.semester_2')}</option>
                              <option value="3">{t('express.semester_3')}</option>
                              <option value="4">{t('express.semester_4')}</option>
                            </select>
                          </div>
                        </div>
                        
                        <div style={styles.formRow}>
                          <div style={styles.formGroup}>
                            <label style={styles.formLabel}>{t('express.hours')}</label>
                            <input 
                              type="number" 
                              value={rupFormData.hours} 
                              onChange={(e) => updateRupFormData('hours', e.target.value)} 
                              onFocus={() => onFocusInput('detailed')}
                              onBlur={onBlurInput}
                              min="30" 
                              max="300" 
                              style={styles.formInput} 
                            />
                          </div>
                          <div style={styles.formGroup}>
                            <label style={styles.formLabel}>{t('express.teacher')}</label>
                            <input 
                              type="text" 
                              value={rupFormData.teacher} 
                              onChange={(e) => updateRupFormData('teacher', e.target.value)} 
                              onFocus={() => onFocusInput('detailed')}
                              onBlur={onBlurInput}
                              placeholder={t('express.teacher_placeholder')} 
                              style={styles.formInput} 
                            />
                          </div>
                        </div>
                        
                        <div style={styles.formGroup}>
                          <label style={styles.formLabel}>{t('express.program')}</label>
                          <input 
                            type="text" 
                            value={rupFormData.program} 
                            onChange={(e) => updateRupFormData('program', e.target.value)} 
                            onFocus={() => onFocusInput('detailed')}
                            onBlur={onBlurInput}
                            placeholder={t('express.program_placeholder')} 
                            style={styles.formInput} 
                          />
                        </div>
                      </div>

                      <div style={styles.formCard}>
                        <div style={styles.formCardHeader}>
                          <div style={{ ...styles.formCardIcon, borderColor: expressColor }}>
                            <FontAwesomeIcon icon={faBullseye} style={{ color: expressColor }} />
                          </div>
                          <span style={styles.formCardTitle}>{t('express.goals_prereq')}</span>
                        </div>
                        
                        <div style={styles.formGroup}>
                          <label style={styles.formLabel}>{t('express.goal')}</label>
                          <textarea 
                            value={rupFormData.goals} 
                            onChange={(e) => updateRupFormData('goals', e.target.value)} 
                            onFocus={() => onFocusInput('detailed')}
                            onBlur={onBlurInput}
                            rows={3} 
                            placeholder={t('express.goal_placeholder')} 
                            style={styles.formTextarea} 
                          />
                        </div>
                        
                        <div style={styles.formRow}>
                          <div style={styles.formGroup}>
                            <label style={styles.formLabel}>{t('express.prerequisites')}</label>
                            <input 
                              type="text" 
                              value={rupFormData.prerequisites} 
                              onChange={(e) => updateRupFormData('prerequisites', e.target.value)} 
                              onFocus={() => onFocusInput('detailed')}
                              onBlur={onBlurInput}
                              placeholder={t('express.prereq_placeholder')} 
                              style={styles.formInput} 
                            />
                          </div>
                          <div style={styles.formGroup}>
                            <label style={styles.formLabel}>{t('express.postrequisites')}</label>
                            <input 
                              type="text" 
                              value={rupFormData.postrequisites} 
                              onChange={(e) => updateRupFormData('postrequisites', e.target.value)} 
                              onFocus={() => onFocusInput('detailed')}
                              onBlur={onBlurInput}
                              placeholder={t('express.postreq_placeholder')} 
                              style={styles.formInput} 
                            />
                          </div>
                        </div>
                      </div>

                      <div style={styles.formCard}>
                        <div style={styles.formCardHeader}>
                          <div style={{ ...styles.formCardIcon, borderColor: expressColor }}>
                            <FontAwesomeIcon icon={faGraduationCap} style={{ color: expressColor }} />
                          </div>
                          <span style={styles.formCardTitle}>{t('express.outcomes_language')}</span>
                        </div>
                        
                        <div style={styles.formGroup}>
                          <label style={styles.formLabel}>{t('express.learning_outcomes')}</label>
                          <textarea 
                            value={rupFormData.learningOutcomes} 
                            onChange={(e) => updateRupFormData('learningOutcomes', e.target.value)} 
                            onFocus={() => onFocusInput('detailed')}
                            onBlur={onBlurInput}
                            rows={3} 
                            placeholder={t('express.outcomes_placeholder')} 
                            style={styles.formTextarea} 
                          />
                        </div>
                        
                        <div style={styles.formGroup}>
                          <label style={styles.formLabel}>{t('express.language')}</label>
                          <select 
                            value={rupFormData.language} 
                            onChange={(e) => updateRupFormData('language', e.target.value)} 
                            onFocus={() => onFocusInput('detailed')}
                            onBlur={onBlurInput}
                            style={styles.formSelect}
                          >
                            <option value="russian">{t('express.russian')}</option>
                            <option value="kazakh">{t('express.kazakh')}</option>
                            <option value="english">{t('express.english')}</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <button
                      style={{ ...styles.generateButton, background: expressColor, marginTop: 24 }}
                      onClick={() => {
                        const formDataStr = Object.entries(rupFormData).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join('\n');
                        onSendChatMessage(t('express.generate_syllabus_with_data') + '\n' + formDataStr);
                      }}
                      disabled={!rupFormData.subject || isChatWaiting || isGenerating}
                    >
                      {isGenerating ? <><FontAwesomeIcon icon={faSpinner} spin /> {t('express.generating')}</> : <><FontAwesomeIcon icon={faWandMagicSparkles} /> {t('express.create_syllabus')}</>}
                    </button>
                  </div>
                ) : (
                  <div>
                    <div style={styles.formGridTwo}>
                      <div style={styles.formCard}>
                        <div style={styles.formCardHeader}>
                          <div style={{ ...styles.formCardIcon, borderColor: expressColor }}>
                            <FontAwesomeIcon icon={faCalendarAlt} style={{ color: expressColor }} />
                          </div>
                          <span style={styles.formCardTitle}>{t('express.discipline')}</span>
                        </div>
                        
                        <div style={styles.formGroup}>
                          <label style={styles.formLabel}>{t('express.discipline_name')} *</label>
                          <input 
                            type="text" 
                            value={calendarFormData.subject} 
                            onChange={(e) => updateCalendarFormData('subject', e.target.value)} 
                            onFocus={() => onFocusInput('detailed')}
                            onBlur={onBlurInput}
                            placeholder={t('express.discipline_placeholder')} 
                            style={styles.formInput} 
                          />
                        </div>
                        
                        <div style={styles.formRow}>
                          <div style={styles.formGroup}>
                            <label style={styles.formLabel}>{t('express.code')}</label>
                            <input 
                              type="text" 
                              value={calendarFormData.code} 
                              onChange={(e) => updateCalendarFormData('code', e.target.value)} 
                              onFocus={() => onFocusInput('detailed')}
                              onBlur={onBlurInput}
                              placeholder={t('express.code_placeholder')} 
                              style={styles.formInput} 
                            />
                          </div>
                          <div style={styles.formGroup}>
                            <label style={styles.formLabel}>{t('express.credits')}</label>
                            <input 
                              type="number" 
                              value={calendarFormData.credits} 
                              onChange={(e) => updateCalendarFormData('credits', e.target.value)} 
                              onFocus={() => onFocusInput('detailed')}
                              onBlur={onBlurInput}
                              placeholder="5" 
                              min="1" 
                              max="15" 
                              style={styles.formInput} 
                            />
                          </div>
                        </div>
                        
                        <div style={styles.formGroup}>
                          <label style={styles.formLabel}>{t('express.group')} *</label>
                          <input 
                            type="text" 
                            value={calendarFormData.group} 
                            onChange={(e) => updateCalendarFormData('group', e.target.value)} 
                            onFocus={() => onFocusInput('detailed')}
                            onBlur={onBlurInput}
                            placeholder={t('express.group_placeholder')} 
                            style={styles.formInput} 
                          />
                        </div>
                        
                        <div style={styles.formGroup}>
                          <label style={styles.formLabel}>{t('express.teacher')}</label>
                          <input 
                            type="text" 
                            value={calendarFormData.teacher} 
                            onChange={(e) => updateCalendarFormData('teacher', e.target.value)} 
                            onFocus={() => onFocusInput('detailed')}
                            onBlur={onBlurInput}
                            placeholder={t('express.teacher_placeholder')} 
                            style={styles.formInput} 
                          />
                        </div>
                      </div>

                      <div style={styles.formCard}>
                        <div style={styles.formCardHeader}>
                          <div style={{ ...styles.formCardIcon, borderColor: expressColor }}>
                            <FontAwesomeIcon icon={faClock} style={{ color: expressColor }} />
                          </div>
                          <span style={styles.formCardTitle}>{t('express.parameters')}</span>
                        </div>
                        
                        <div style={styles.formRow}>
                          <div style={styles.formGroup}>
                            <label style={styles.formLabel}>{t('express.course')}</label>
                            <input 
                              type="text" 
                              value={calendarFormData.grade} 
                              onChange={(e) => updateCalendarFormData('grade', e.target.value)} 
                              onFocus={() => onFocusInput('detailed')}
                              onBlur={onBlurInput}
                              placeholder={t('express.course_placeholder')} 
                              style={styles.formInput} 
                            />
                          </div>
                          <div style={styles.formGroup}>
                            <label style={styles.formLabel}>{t('express.semester')}</label>
                            <select 
                              value={calendarFormData.semester} 
                              onChange={(e) => updateCalendarFormData('semester', e.target.value)} 
                              onFocus={() => onFocusInput('detailed')}
                              onBlur={onBlurInput}
                              style={styles.formSelect}
                            >
                              <option value="весенний">{t('express.spring')}</option>
                              <option value="осенний">{t('express.fall')}</option>
                            </select>
                          </div>
                        </div>
                        
                        <div style={styles.formRow}>
                          <div style={styles.formGroup}>
                            <label style={styles.formLabel}>{t('express.hours')}</label>
                            <input 
                              type="number" 
                              value={calendarFormData.hours} 
                              onChange={(e) => updateCalendarFormData('hours', e.target.value)} 
                              onFocus={() => onFocusInput('detailed')}
                              onBlur={onBlurInput}
                              min="30" 
                              max="300" 
                              style={styles.formInput} 
                            />
                          </div>
                          <div style={styles.formGroup}>
                            <label style={styles.formLabel}>{t('express.weeks')}</label>
                            <input 
                              type="number" 
                              value={calendarFormData.weeks} 
                              onChange={(e) => updateCalendarFormData('weeks', e.target.value)} 
                              onFocus={() => onFocusInput('detailed')}
                              onBlur={onBlurInput}
                              min="1" 
                              max="20" 
                              style={styles.formInput} 
                            />
                          </div>
                        </div>
                        
                        <div style={styles.formGroup}>
                          <label style={styles.formLabel}>{t('express.control_type')}</label>
                          <select 
                            value={calendarFormData.controlType} 
                            onChange={(e) => updateCalendarFormData('controlType', e.target.value)} 
                            onFocus={() => onFocusInput('detailed')}
                            onBlur={onBlurInput}
                            style={styles.formSelect}
                          >
                            <option value="экзамен">{t('express.exam')}</option>
                            <option value="зачет">{t('express.credit')}</option>
                            <option value="дифференцированный зачет">{t('express.diff_credit')}</option>
                          </select>
                        </div>
                      </div>

                      <div style={styles.formCard}>
                        <div style={styles.formCardHeader}>
                          <div style={{ ...styles.formCardIcon, borderColor: expressColor }}>
                            <FontAwesomeIcon icon={faCalendarAlt} style={{ color: expressColor }} />
                          </div>
                          <span style={styles.formCardTitle}>{t('express.period')}</span>
                        </div>
                        
                        <div style={styles.formGroup}>
                          <label style={styles.formLabel}>{t('express.academic_year')}</label>
                          <input 
                            type="text" 
                            value={calendarFormData.academicYear} 
                            onChange={(e) => updateCalendarFormData('academicYear', e.target.value)} 
                            onFocus={() => onFocusInput('detailed')}
                            onBlur={onBlurInput}
                            placeholder={t('express.year_placeholder')} 
                            style={styles.formInput} 
                          />
                        </div>
                        
                        <div style={styles.formRow}>
                          <div style={styles.formGroup}>
                            <label style={styles.formLabel}>{t('express.start_date')}</label>
                            <input 
                              type="date" 
                              value={calendarFormData.startDate} 
                              onChange={(e) => updateCalendarFormData('startDate', e.target.value)} 
                              onFocus={() => onFocusInput('detailed')}
                              onBlur={onBlurInput}
                              style={styles.dateInput} 
                            />
                          </div>
                          <div style={styles.formGroup}>
                            <label style={styles.formLabel}>{t('express.end_date')}</label>
                            <input 
                              type="date" 
                              value={calendarFormData.endDate} 
                              onChange={(e) => updateCalendarFormData('endDate', e.target.value)} 
                              onFocus={() => onFocusInput('detailed')}
                              onBlur={onBlurInput}
                              style={styles.dateInput} 
                            />
                          </div>
                        </div>
                        
                        <div style={styles.checkboxGroup}>
                          <label style={styles.checkboxLabel}>
                            <input
                              type="checkbox"
                              checked={calendarFormData.useParity}
                              onChange={(e) => updateCalendarFormData('useParity', e.target.checked)}
                              onFocus={() => onFocusInput('detailed')}
                              onBlur={onBlurInput}
                            />
                            <span>{t('express.use_parity')}</span>
                          </label>
                        </div>
                        
                        {calendarFormData.useParity && (
                          <>
                            <div style={styles.formGroup}>
                              <label style={styles.formLabel}>{t('express.parity_type')}</label>
                              <select 
                                value={calendarFormData.parityType} 
                                onChange={(e) => updateCalendarFormData('parityType', e.target.value)} 
                                onFocus={() => onFocusInput('detailed')}
                                onBlur={onBlurInput}
                                style={styles.formSelect}
                              >
                                <option value="all">{t('express.all_weeks')}</option>
                                <option value="numerator">{t('express.numerator')}</option>
                                <option value="denominator">{t('express.denominator')}</option>
                              </select>
                            </div>
                            
                            <div style={styles.parityDaysSection}>
                              <div style={styles.parityColumn}>
                                <label>{t('express.numerator')}</label>
                                <div style={styles.daysButtons}>
                                  {['1','2','3','4','5','6','7'].map((day: string) => (
                                    <button
                                      key={`num-${day}`}
                                      type="button"
                                      style={{
                                        ...styles.dayBtn,
                                        background: calendarFormData.numeratorDays?.includes(day) ? `${expressColor}30` : 'transparent',
                                        borderColor: calendarFormData.numeratorDays?.includes(day) ? expressColor : 'rgba(80,80,90,0.3)',
                                        color: calendarFormData.numeratorDays?.includes(day) ? expressColor : '#90909a',
                                      }}
                                      onClick={() => {
                                        const days = calendarFormData.numeratorDays || [];
                                        updateCalendarFormData('numeratorDays', 
                                          days.includes(day) ? days.filter((d: string) => d !== day) : [...days, day]
                                        );
                                      }}
                                      onFocus={() => onFocusInput('detailed')}
                                      onBlur={onBlurInput}
                                    >
                                      {day}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              
                              <div style={styles.parityColumn}>
                                <label>{t('express.denominator')}</label>
                                <div style={styles.daysButtons}>
                                  {['1','2','3','4','5','6','7'].map((day: string) => (
                                    <button
                                      key={`den-${day}`}
                                      type="button"
                                      style={{
                                        ...styles.dayBtn,
                                        background: calendarFormData.denominatorDays?.includes(day) ? `${expressColor}30` : 'transparent',
                                        borderColor: calendarFormData.denominatorDays?.includes(day) ? expressColor : 'rgba(80,80,90,0.3)',
                                        color: calendarFormData.denominatorDays?.includes(day) ? expressColor : '#90909a',
                                      }}
                                      onClick={() => {
                                        const days = calendarFormData.denominatorDays || [];
                                        updateCalendarFormData('denominatorDays', 
                                          days.includes(day) ? days.filter((d: string) => d !== day) : [...days, day]
                                        );
                                      }}
                                      onFocus={() => onFocusInput('detailed')}
                                      onBlur={onBlurInput}
                                    >
                                      {day}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      <div style={styles.formCard}>
                        <div style={styles.formCardHeader}>
                          <div style={{ ...styles.formCardIcon, borderColor: expressColor }}>
                            <FontAwesomeIcon icon={faBullseye} style={{ color: expressColor }} />
                          </div>
                          <span style={styles.formCardTitle}>{t('express.goals_results')}</span>
                        </div>
                        
                        <div style={styles.formGroup}>
                          <label style={styles.formLabel}>{t('express.goal')}</label>
                          <textarea 
                            value={calendarFormData.goals} 
                            onChange={(e) => updateCalendarFormData('goals', e.target.value)} 
                            onFocus={() => onFocusInput('detailed')}
                            onBlur={onBlurInput}
                            rows={3} 
                            placeholder={t('express.goal_placeholder')} 
                            style={styles.formTextarea} 
                          />
                        </div>
                        
                        <div style={styles.formGroup}>
                          <label style={styles.formLabel}>{t('express.learning_outcomes')}</label>
                          <textarea 
                            value={calendarFormData.learningOutcomes} 
                            onChange={(e) => updateCalendarFormData('learningOutcomes', e.target.value)} 
                            onFocus={() => onFocusInput('detailed')}
                            onBlur={onBlurInput}
                            rows={3} 
                            placeholder={t('express.outcomes_placeholder')} 
                            style={styles.formTextarea} 
                          />
                        </div>
                        
                        <div style={styles.formGroup}>
                          <label style={styles.formLabel}>{t('express.language')}</label>
                          <select 
                            value={calendarFormData.language} 
                            onChange={(e) => updateCalendarFormData('language', e.target.value)} 
                            onFocus={() => onFocusInput('detailed')}
                            onBlur={onBlurInput}
                            style={styles.formSelect}
                          >
                            <option value="russian">{t('express.russian')}</option>
                            <option value="kazakh">{t('express.kazakh')}</option>
                            <option value="english">{t('express.english')}</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <button
                      style={{ ...styles.generateButton, background: expressColor, marginTop: 24 }}
                      onClick={() => {
                        const formDataStr = Object.entries(calendarFormData).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join('\n');
                        onSendChatMessage(t('express.generate_calendar_with_data') + '\n' + formDataStr);
                      }}
                      disabled={!calendarFormData.subject || !calendarFormData.group || isChatWaiting || isGenerating}
                    >
                      {isGenerating ? <><FontAwesomeIcon icon={faSpinner} spin /> {t('express.generating')}</> : <><FontAwesomeIcon icon={faWandMagicSparkles} /> {t('express.create_calendar')}</>}
                    </button>
                  </div>
                )}
                
                {(isChatWaiting || isGenerating) && (
                  <div style={{ ...styles.inlineStatusMessage, marginTop: 16 }}>
                    <FontAwesomeIcon icon={faSpinner} spin style={{ color: expressColor }} />
                    <span>{isGenerating ? t('express.generating_document') : t('express.processing_request')}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Remix Mode UI ────────────────────────────────────────────────────────────

interface RemixModeUIProps {
  showExample: boolean;
  diffs: DiffItem[];
  selectedDiffs: string[];
  isRemixing: boolean;
  onFileUpload: (file: File) => void;
  onCreateExample: () => void;
  onToggleDiff: (id: string) => void;
  onApplyRemix: () => void;
  onSelectAll: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

export const RemixModeUI: React.FC<RemixModeUIProps> = ({
  showExample,
  diffs,
  selectedDiffs,
  isRemixing,
  onFileUpload,
  onCreateExample,
  onToggleDiff,
  onApplyRemix,
  onSelectAll,
  fileInputRef,
}) => {
  const { t } = useTranslation();

  return (
    <div style={styles.modeInterface}>
      <div style={styles.remixContainer}>
        <div style={styles.modeHeader}>
          <div style={styles.modeIcon}>
            <FontAwesomeIcon icon={((MODES as Record<string, { icon: import('@fortawesome/fontawesome-svg-core').IconDefinition }>).remix?.icon) ?? faShuffle} style={{ color: (MODES as Record<string, { color: string }>).remix?.color ?? '#B45F4D', fontSize: 32 }} />
          </div>
          <h2 style={styles.modeTitle}>{(MODES as Record<string, { label: string }>).remix?.label ?? 'Remix'}</h2>
          <p style={styles.modeDesc}>{(MODES as Record<string, { desc: string }>).remix?.desc ?? t('remix.desc')}</p>
        </div>

        {!showExample && diffs.length === 0 ? (
          <div style={styles.remixOptions}>
            <div style={styles.remixOption} onClick={() => fileInputRef.current?.click()}>
              <FontAwesomeIcon icon={faUpload} style={{ fontSize: 32, color: (MODES as Record<string, { color: string }>).remix?.color ?? '#B45F4D', marginBottom: 16 }} />
              <h3 style={{ color: '#f0f0f0', marginBottom: 8 }}>{t('remix.upload_file')}</h3>
              <p style={{ color: '#90909a', fontSize: 13 }}>{t('remix.upload_file_desc')}</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".doc,.docx,.pdf,.txt"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onFileUpload(file);
                }}
              />
            </div>

            <div style={styles.remixDivider}>{t('remix.or')}</div>

            <div style={styles.remixOption} onClick={onCreateExample}>
              <h3 style={{ color: '#f0f0f0', marginBottom: 8 }}>{t('remix.create_example')}</h3>
              <p style={{ color: '#90909a', fontSize: 13 }}>{t('remix.create_example_desc')}</p>
            </div>
          </div>
        ) : isRemixing ? (
          <div style={styles.remixAnalyzing}>
            <FontAwesomeIcon icon={faSpinner} spin style={{ fontSize: 40, color: (MODES as Record<string, { color: string }>).remix?.color ?? '#B45F4D', marginBottom: 20 }} />
            <p style={{ color: '#f0f0f0' }}>{t('remix.analyzing')}</p>
            <p style={{ color: '#90909a', fontSize: 13 }}>{t('remix.analyzing_desc')}</p>
          </div>
        ) : diffs.length > 0 && (
          <div style={styles.remixImprovements}>
            <p style={styles.improvementsTitle}>{t('remix.found_improvements')}</p>
            <div style={styles.improvementsList}>
              {diffs.map(diff => (
                <div
                  key={diff.id}
                  style={{
                    ...styles.improvementCard,
                    borderColor: selectedDiffs.includes(diff.id) ? diff.color : 'rgba(80,80,90,0.3)',
                    background: selectedDiffs.includes(diff.id) ? `${diff.color}15` : 'rgba(28,28,34,0.6)',
                  }}
                  onClick={() => onToggleDiff(diff.id)}
                >
                  <div style={styles.improvementIcon}>
                    <FontAwesomeIcon icon={diff.icon || faStar} style={{ color: diff.color }} />
                  </div>
                  <div style={styles.improvementContent}>
                    <div style={styles.improvementTitle}>
                      {diff.type === 'add' ? '➕ ' : diff.type === 'remove' ? '✖️ ' : '✏️ '}
                      {diff.title}
                    </div>
                    <div style={styles.improvementDesc}>{diff.description}</div>
                  </div>
                  <div style={styles.improvementCheck}>
                    {selectedDiffs.includes(diff.id) ? (
                      <FontAwesomeIcon icon={faCheckCircle} style={{ color: '#22c55e' }} />
                    ) : (
                      <FontAwesomeIcon icon={faCircle} style={{ color: 'rgba(80,80,90,0.5)' }} />
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div style={styles.remixActions}>
              <button style={styles.remixApplyBtn} onClick={onApplyRemix} disabled={selectedDiffs.length === 0}>
                {t('remix.apply_improvements').replace('{count}', String(selectedDiffs.length))}
              </button>
              <button style={styles.remixApplyAllBtn} onClick={onSelectAll}>
                {t('remix.apply_all')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── TopBar Component ─────────────────────────────────────────────────────────

interface TopBarProps {
  mode: CanvasMode;
  MODES: typeof MODES;
  setMode: (mode: CanvasMode) => void;
  doneN: number;
  genN: number;
  runningAll: boolean;
  onReset: () => void;
  onRunAll: () => void;
  onLogoClick: () => void;
  isSaving?: boolean;
  isOffline?: boolean;
  projects: CanvasProject[];
  currentProjectId: string | null;
  onSwitchProject: (projectId: string) => void;
  onCreateProject: (name: string, description?: string, mode?: CanvasMode) => Promise<void>;
  onDeleteProject: (projectId: string) => void;
  onUpdateProject: (projectId: string, updates: Partial<CanvasProject>) => void;
  editorOpen?: boolean;
  onToggleEditor?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  mode, MODES, setMode, doneN, genN, runningAll, onReset, onRunAll, onLogoClick, isSaving, isOffline,
  projects, currentProjectId, onSwitchProject, onCreateProject, onDeleteProject, onUpdateProject,
  editorOpen, onToggleEditor,
}) => {
  const { t } = useTranslation();

  return (
    <header style={styles.topbar}>
      <div style={styles.tbLeft}>
        <div style={styles.logo} onClick={onLogoClick}>
          <div>
            <div style={styles.logoName}>HIVERSITY</div>
            <div style={styles.logoSub}>AI Platform</div>
          </div>
        </div>
        
        <ProjectSwitcher
          projects={projects}
          currentProjectId={currentProjectId}
          onSwitchProject={onSwitchProject}
          onCreateProject={onCreateProject}
          onDeleteProject={onDeleteProject}
          onUpdateProject={onUpdateProject}
        />

        <div style={styles.sep} />
        <div style={styles.pageTitle}>
          <FontAwesomeIcon icon={faLayerGroup} style={{ color: '#C49A6C', fontSize: 14 }} />
          <span>Canvas</span>
        </div>

        {/* ── Редактор документов ── */}
        {onToggleEditor && (
          <button
            onClick={onToggleEditor}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 12px',
              background: editorOpen ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${editorOpen ? 'rgba(99,102,241,0.5)' : 'rgba(80,80,90,0.3)'}`,
              borderRadius: 8,
              color: editorOpen ? '#818cf8' : '#90909a',
              fontSize: 12, fontWeight: 600,
              cursor: 'pointer',
              marginLeft: 8,
              transition: 'all 0.2s',
            }}
          >
            <FontAwesomeIcon icon={faPenToSquare} style={{ fontSize: 11 }} />
            <span>Редактор</span>
          </button>
        )}
        
        {isOffline && (
          <span style={{ color: '#f59e0b', fontSize: 11, marginLeft: 8 }}>
            <FontAwesomeIcon icon={faSpinner} style={{ marginRight: 4 }} />
            {t('topbar.offline_mode')}
          </span>
        )}
        
        {isSaving && (
          <span style={{ color: '#90909a', fontSize: 11, marginLeft: 8 }}>
            <FontAwesomeIcon icon={faSpinner} spin style={{ marginRight: 4 }} />
            {t('topbar.saving')}
          </span>
        )}
      </div>

      <div style={styles.modeNav}>
        {(Object.keys(MODES) as CanvasMode[]).map(m => (
          <button
            key={m}
            style={{
              ...styles.modeBtn,
              background: mode === m ? `${MODES[m].color}20` : 'transparent',
              borderColor: mode === m ? MODES[m].color : 'rgba(80,80,90,0.3)',
              color: mode === m ? MODES[m].color : '#90909a',
            }}
            onClick={() => setMode(m)}
          >
            <FontAwesomeIcon icon={MODES[m].icon} />
            <span>{MODES[m].label}</span>
          </button>
        ))}
      </div>

      <div style={styles.tbRight}>
        <div style={styles.progWrap}>
          <div style={styles.progTrack}>
            <div style={{ ...styles.progFill, width: `${genN ? (doneN/genN)*100 : 0}%` }} />
          </div>
          <span style={styles.progLabel}>{doneN}/{genN}</span>
        </div>

        <button style={styles.btnGhost} onClick={onReset}>{t('topbar.reset')}</button>
        <button style={styles.btnPrimary} onClick={onRunAll} disabled={runningAll}>
          {runningAll ? (
            <><FontAwesomeIcon icon={faSpinner} spin /> {t('topbar.running')}</>
          ) : (
            <><FontAwesomeIcon icon={faRocket} /> {t('topbar.start')}</>
          )}
        </button>
      </div>
    </header>
  );
};

// ─── Footer Component ─────────────────────────────────────────────────────────

interface FooterProps {
  nodesCount: number;
  connsCount: number;
}

export const Footer: React.FC<FooterProps> = ({ nodesCount, connsCount }) => {
  const { t } = useTranslation();

  return (
    <div style={styles.cvFooter}>
      <span>{nodesCount} {t('footer.blocks')}</span>
      <span style={{ color: 'rgba(80,80,90,0.5)' }}>·</span>
      <span>{connsCount} {t('footer.connections')}</span>
      <span style={{ color: 'rgba(80,80,90,0.5)' }}>·</span>
      <span>{t('footer.delete_hint')}</span>
    </div>
  );
};

// ─── CanvasSVG Component ──────────────────────────────────────────────────────

interface CanvasSVGProps {
  svgRef: React.RefObject<SVGSVGElement | null>;
  pan: { x: number; y: number };
  zoom: number;
  nodes: FlowNode[];
  conns: Connection[];
  selected: string | null;
  draft: { x1: number; y1: number; x2: number; y2: number } | null;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  onWheel: (e: React.WheelEvent) => void;
  onNodeDown: (e: React.MouseEvent, id: string) => void;
  onNodeClick: (id: string) => void;
  onPortDown: (e: React.MouseEvent, id: string, side: 'l' | 'r') => void;
  onPortUp: (e: React.MouseEvent, id: string, side: 'l' | 'r') => void;
  onDeleteNode: (id: string) => void;
  onRunNode: (nodeId: string) => void;
}

export const CanvasSVG: React.FC<CanvasSVGProps> = ({
  svgRef, pan, zoom, nodes, conns, selected, draft,
  onMouseDown, onMouseMove, onMouseUp, onWheel,
  onNodeDown, onNodeClick, onPortDown, onPortUp, onDeleteNode, onRunNode,
}) => {
  return (
    <svg
      ref={svgRef}
      style={styles.svg}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onWheel={onWheel}
    >
      <defs>
        <radialGradient id="bgGradient" cx="30%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#1A1625" />
          <stop offset="100%" stopColor="#0C0A12" />
        </radialGradient>
        <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="1" fill="rgba(150,130,120,0.15)" />
        </pattern>
        {/* Маркер для цепочечных соединений блок→блок */}
        <marker id="arrow-chain" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="rgba(99,102,241,0.7)" />
        </marker>
        <marker id="arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
          <polygon points="0 0,8 3,0 6" fill="rgba(200,180,170,0.4)" />
        </marker>
        <marker id="arrow-active" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
          <polygon points="0 0,8 3,0 6" fill="#C49A6C" />
        </marker>
        <filter id="glow-orange">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="glow-pulse">
          <feGaussianBlur stdDeviation="4" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <style>{`
          @keyframes electricFlow {
            0%   { stroke-dashoffset: 40; }
            100% { stroke-dashoffset: 0; }
          }
          @keyframes electricGlow {
            0%   { stroke-dashoffset: 60; }
            100% { stroke-dashoffset: 0; }
          }
          @keyframes pulseOrb {
            0%   { opacity: 1;   r: 4; }
            50%  { opacity: 0.6; r: 6; }
            100% { opacity: 1;   r: 4; }
          }
          .electric-base {
            stroke-dasharray: 10 6;
            animation: electricFlow 0.4s linear infinite;
          }
          .electric-glow {
            stroke-dasharray: 10 6;
            animation: electricGlow 0.4s linear infinite;
          }
          .electric-orb {
            animation: pulseOrb 0.8s ease-in-out infinite;
          }
        `}</style>
      </defs>

      <rect width="100%" height="100%" fill="url(#bgGradient)" />
      <rect width="100%" height="100%" fill="url(#grid)" />

      <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
        {conns.map((c, i) => {
          const fn = nodes.find(n => n.id === c.from);
          const tn = nodes.find(n => n.id === c.to);
          if (!fn || !tn) return null;
          const p1 = portPos(fn, 'r');
          const p2 = portPos(tn, 'l');
          const isSelected = selected === c.from || selected === c.to;
          const isRunning = tn.status === 'running';
          const isDone = tn.status === 'done';
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const pathId = `conn-path-${i}`;
          const d = bezier(p1.x, p1.y, p2.x, p2.y);
          // Цепочечное соединение: блок→блок (не силлабус→блок)
          const isChain = fn.kind !== 'import' && tn.kind !== 'import';
          // Источник готов и передаёт данные
          const chainActive = isChain && fn.status === 'done';

          const mx = (p1.x + p2.x) / 2;
          const my = (p1.y + p2.y) / 2;

          return (
            <g key={i}>
              <path
                id={`conn-path-${i}`}
                d={d}
                fill="none"
                stroke={
                  isRunning   ? 'rgba(196,154,108,0.15)' :
                  isDone      ? 'rgba(34,197,94,0.25)' :
                  chainActive ? 'rgba(99,102,241,0.45)' :
                  isChain     ? 'rgba(99,102,241,0.2)' :
                  isSelected  ? 'rgba(196,154,108,0.5)' :
                                'rgba(150,130,120,0.25)'
                }
                strokeWidth={isRunning ? 3 : isSelected ? 2.5 : isChain ? 2 : 1.8}
                strokeDasharray={isChain && !chainActive ? '5,3' : undefined}
                markerEnd={isRunning ? 'url(#arrow-active)' : isChain ? 'url(#arrow-chain)' : 'url(#arrow)'}
              />
              {/* Метка на цепочечном соединении */}
              {isChain && (
                <text
                  x={mx}
                  y={my - 6}
                  textAnchor="middle"
                  fontSize={8}
                  fill={chainActive ? 'rgba(99,102,241,0.8)' : 'rgba(99,102,241,0.4)'}
                  style={{ userSelect: 'none', pointerEvents: 'none' }}
                >
                  {chainActive ? '▶ данные' : '○ ожидание'}
                </text>
              )}

              {isRunning && (
                <>
                  <path
                    d={d}
                    fill="none"
                    stroke="rgba(196,154,108,0.35)"
                    strokeWidth={6}
                    strokeLinecap="round"
                    className="electric-glow"
                    style={{ filter: 'url(#glow-orange)' }}
                  />
                  <path
                    d={d}
                    fill="none"
                    stroke="#C49A6C"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    className="electric-base"
                  />
                  <circle
                    cx={mx}
                    cy={my}
                    r={4}
                    fill="#ffd080"
                    className="electric-orb"
                    style={{ filter: 'url(#glow-pulse)' }}
                  >
                    <animateMotion
                      dur="0.8s"
                      repeatCount="indefinite"
                      path={d}
                    />
                  </circle>
                  <circle
                    r={3}
                    fill="rgba(255,208,128,0.7)"
                    style={{ filter: 'url(#glow-orange)' }}
                  >
                    <animateMotion
                      dur="0.8s"
                      begin="0.4s"
                      repeatCount="indefinite"
                      path={d}
                    />
                  </circle>
                </>
              )}

              {isDone && (
                <path
                  d={d}
                  fill="none"
                  stroke="rgba(34,197,94,0.4)"
                  strokeWidth={2}
                  markerEnd="url(#arrow)"
                />
              )}
            </g>
          );
        })}

        {draft && (
          <path
            d={bezier(draft.x1, draft.y1, draft.x2, draft.y2)}
            fill="none"
            stroke="rgba(196,154,108,0.6)"
            strokeWidth={2}
            strokeDasharray="6 4"
          />
        )}

        {nodes.map(n => (
          <Card
            key={n.id}
            node={n}
            selected={selected === n.id}
            onDown={onNodeDown}
            onPortDown={onPortDown}
            onPortUp={onPortUp}
            onClick={onNodeClick}
            onDelete={onDeleteNode}
            onRunNode={onRunNode}
          />
        ))}
      </g>
    </svg>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

export const styles: Record<string, React.CSSProperties> = {
  root: {
    width: '100vw', height: '100vh',
    display: 'flex', flexDirection: 'column',
    background: '#000',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    overflow: 'hidden',
    color: '#f0f0f0',
  },
  topbar: {
    height: 60,
    background: 'rgba(18, 18, 22, 0.8)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(80, 80, 90, 0.2)',
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 20px', flexShrink: 0, zIndex: 20,
  },
  tbLeft: { display: 'flex', alignItems: 'center', gap: 16 },
  tbRight: { display: 'flex', alignItems: 'center', gap: 12 },
  logo: {
    display: 'flex', alignItems: 'center', gap: 10,
    cursor: 'pointer', padding: '4px 10px',
    borderRadius: 10,
  },
  logoName: { color: '#f0f0f0', fontWeight: 600, fontSize: 15 },
  logoSub: { color: '#90909a', fontSize: 10 },
  sep: { width: 1, height: 30, background: 'rgba(80,80,90,0.3)' },
  pageTitle: {
    display: 'flex', alignItems: 'center', gap: 8,
    color: '#b0b0ba', fontSize: 13, fontWeight: 500,
  },
  modeNav: {
    display: 'flex', gap: 8,
    background: 'rgba(18,18,22,0.6)',
    padding: 4,
    borderRadius: 12,
    border: '1px solid rgba(80,80,90,0.2)',
  },
  modeBtn: {
    padding: '6px 14px',
    borderRadius: 8,
    border: '1px solid',
    background: 'transparent',
    fontSize: 13,
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 8,
    transition: 'all 0.2s',
  },
  progWrap: { display: 'flex', alignItems: 'center', gap: 8 },
  progTrack: { width: 100, height: 4, background: 'rgba(80,80,90,0.3)', borderRadius: 10, overflow: 'hidden' },
  progFill: { height: '100%', background: '#C49A6C', borderRadius: 10, transition: 'width 0.3s' },
  progLabel: { color: '#90909a', fontSize: 11 },
  btnGhost: {
    background: 'transparent',
    border: '1px solid rgba(80,80,90,0.4)',
    color: '#b0b0ba',
    padding: '6px 12px',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 12,
    display: 'flex', alignItems: 'center', gap: 5,
  },
  btnPrimary: {
    background: '#C49A6C',
    border: 'none',
    color: '#000',
    padding: '6px 14px',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 500,
    display: 'flex', alignItems: 'center', gap: 6,
  },
  ws: { flex: 1, display: 'flex', overflow: 'hidden' },
  sb: {
    width: 280,
    background: 'rgba(18, 18, 22, 0.7)',
    backdropFilter: 'blur(16px)',
    borderRight: '1px solid rgba(80,80,90,0.2)',
    display: 'flex', flexDirection: 'column',
    overflowY: 'auto',
    flexShrink: 0,
  },
  sbSec: { padding: '16px 14px' },
  sbLabel: {
    color: '#90909a',
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: '0.03em',
    marginBottom: 12,
    display: 'flex', alignItems: 'center',
  },
  sbItem: {
    display: 'flex', alignItems: 'center', gap: 10,
    background: 'rgba(28,28,34,0.4)',
    border: '1px solid rgba(80,80,90,0.2)',
    borderRadius: 10,
    padding: '8px 10px',
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left',
    marginBottom: 6,
    transition: 'all 0.2s',
  },
  sbIcon: {
    width: 28, height: 28, borderRadius: 8,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  sbDivider: { height: 1, background: 'rgba(80,80,90,0.2)' },
  hintCard: {
    background: 'rgba(28,28,34,0.6)',
    borderRadius: 10,
    border: '1px solid rgba(80,80,90,0.2)',
    padding: 14,
    fontSize: 11,
  },
  hintRow: { display: 'flex', justifyContent: 'space-between', marginBottom: 4 },
  hintKey: { color: '#C49A6C', fontWeight: 500 },
  hintVal: { color: '#90909a' },
  zBtn: {
    width: 30, height: 30,
    background: 'rgba(28,28,34,0.8)',
    border: '1px solid rgba(80,80,90,0.3)',
    color: '#b0b0ba',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 14,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  cvWrap: { flex: 1, position: 'relative', overflow: 'hidden' },
  svg: { width: '100%', height: '100%', display: 'block' },
  cvFooter: {
    position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
    background: 'rgba(18,18,22,0.8)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(80,80,90,0.2)',
    color: '#90909a',
    fontSize: 12,
    padding: '6px 18px',
    borderRadius: 30,
    display: 'flex', alignItems: 'center', gap: 12,
  },
  modeInterface: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(12,10,18,0.95)',
    backdropFilter: 'blur(12px)',
    overflow: 'auto',
    position: 'relative',
  },
  masterContainer: { maxWidth: 600, width: '90%' },
  masterCard: {
    background: 'rgba(28,28,34,0.8)',
    border: '1px solid rgba(154,123,140,0.3)',
    borderRadius: 24,
    padding: 32,
    marginBottom: 20,
  },
  masterStep: { marginBottom: 24 },
  stepIndicator: { color: '#9A7B8C', fontSize: 12, fontWeight: 500, letterSpacing: '0.03em', marginBottom: 12 },
  stepTitle: { fontSize: 24, fontWeight: 600, color: '#f0f0f0', marginBottom: 20 },
  masterInput: {
    width: '100%',
    background: 'rgba(18,18,22,0.8)',
    border: '1px solid rgba(154,123,140,0.3)',
    borderRadius: 12,
    padding: '16px',
    color: '#f0f0f0',
    fontSize: 16,
    marginBottom: 8,
  },
  masterTextarea: {
    width: '100%',
    background: 'rgba(18,18,22,0.8)',
    border: '1px solid rgba(154,123,140,0.3)',
    borderRadius: 12,
    padding: '16px',
    color: '#f0f0f0',
    fontSize: 14,
    fontFamily: 'inherit',
    resize: 'vertical',
    marginBottom: 8,
  },
  inputHint: { color: '#90909a', fontSize: 12, marginTop: 4 },
  levelGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 },
  levelCard: {
    background: 'rgba(28,28,34,0.6)',
    border: '1px solid',
    borderRadius: 16,
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  hoursSelector: { display: 'flex', gap: 12, marginBottom: 8 },
  hoursInput: {
    width: '40%',
    background: 'rgba(18,18,22,0.8)',
    border: '1px solid rgba(154,123,140,0.3)',
    borderRadius: 12,
    padding: '16px',
    color: '#f0f0f0',
    fontSize: 18,
    fontWeight: 500,
    textAlign: 'center',
  },
  hoursPresets: { flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 },
  hoursPreset: {
    background: 'rgba(28,28,34,0.8)',
    border: '1px solid',
    borderRadius: 12,
    padding: '12px',
    color: '#f0f0f0',
    fontSize: 16,
    fontWeight: 500,
    cursor: 'pointer',
  },
  classTypesGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  classTypeCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: 'rgba(28,28,34,0.6)',
    border: '1px solid',
    borderRadius: 12,
    padding: '16px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  masterNav: { display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 24 },
  masterNavBtn: {
    background: 'rgba(28,28,34,0.8)',
    border: '1px solid rgba(154,123,140,0.3)',
    borderRadius: 10,
    padding: '12px 24px',
    color: '#90909a',
    fontSize: 14,
    cursor: 'pointer',
    flex: 1,
  },
  masterNavBtnPrimary: {
    background: '#9A7B8C',
    border: 'none',
    borderRadius: 10,
    padding: '12px 24px',
    color: '#000',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    flex: 2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  stepProgress: { display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 },
  stepDot: { width: 8, height: 8, borderRadius: 4, transition: 'all 0.3s' },
  
  expressMainContainer: {
    width: '90%',
    maxWidth: 1000,
    height: '90vh',
    margin: '0 auto',
    background: 'rgba(18,18,22,0.6)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(80,80,90,0.2)',
    borderRadius: 24,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  expressHeader: {
    flexShrink: 0,
    padding: '20px 24px',
    borderBottom: '1px solid rgba(80,80,90,0.2)',
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  expressScrollContent: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px 24px',
  },
  expressContainer: {
    maxWidth: 500,
    width: '90%',
    margin: '0 auto',
  },
  expressAnalysis: {
    background: 'rgba(28,28,34,0.8)',
    borderRadius: 24,
    padding: 48,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  analysisProgress: {
    width: '100%',
    marginTop: 20,
  },
  analysisStep: {
    color: '#6B8E7A',
    fontSize: 16,
    fontWeight: 500,
    textAlign: 'center',
    marginBottom: 12,
  },
  progressBar: {
    width: '100%',
    height: 4,
    background: 'rgba(80,80,90,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: '#6B8E7A',
    borderRadius: 2,
    transition: 'width 0.3s',
  },
  expressFullColumn: {
    background: 'rgba(255,255,255,0.02)',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
  },
  formGridTwo: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 12,
    marginBottom: 8,
  },
  formCard: {
    background: 'rgba(28,28,34,0.6)',
    border: '1px solid rgba(80,80,90,0.2)',
    borderRadius: 12,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  formCardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    paddingBottom: 8,
    borderBottom: '1px solid rgba(80,80,90,0.2)',
  },
  formCardIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
  },
  formCardTitle: {
    color: '#f0f0f0',
    fontSize: 13,
    fontWeight: 600,
  },
  quickModeContainer: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  detailedModeContainer: {
    height: '100%',
    overflowY: 'auto',
    paddingRight: 4,
  },
  docTypeSelector: {
    display: 'flex',
    gap: 8,
    marginBottom: 16,
    justifyContent: 'center',
  },
  docTypeButton: {
    flex: 1,
    maxWidth: 180,
    padding: '8px 16px',
    borderRadius: 30,
    border: '1px solid',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    transition: 'all 0.2s',
    background: 'transparent',
  },
  modeSelector: {
    display: 'flex',
    gap: 12,
    marginBottom: 20,
  },
  modeOption: {
    flex: 1,
    display: 'flex',
    gap: 12,
    padding: '12px 16px',
    borderRadius: 12,
    border: '1px solid',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s',
    background: 'rgba(28,28,34,0.6)',
  },
  modeOptionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    flexShrink: 0,
  },
  modeOptionContent: {
    flex: 1,
  },
  modeOptionContentH3: {
    color: '#f0f0f0',
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 4,
  },
  modeOptionContentP: {
    color: '#90909a',
    fontSize: 11,
    lineHeight: 1.5,
  },
  promptTextarea: {
    width: '100%',
    background: 'rgba(18,18,22,0.8)',
    border: '1px solid rgba(80,80,90,0.3)',
    borderRadius: 10,
    padding: '12px',
    color: '#f0f0f0',
    fontSize: 13,
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
    lineHeight: 1.5,
  },
  generateButton: {
    width: '100%',
    border: 'none',
    borderRadius: 10,
    padding: '8px 16px',
    color: '#000',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    transition: 'all 0.2s',
  },
  inlineStatusMessage: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: '8px 12px',
    background: 'rgba(107,142,122,0.1)',
    border: '1px solid rgba(107,142,122,0.2)',
    borderRadius: 10,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  lastAssistantMessage: {
    marginTop: 12,
    padding: '10px 12px',
    background: 'rgba(18,18,22,0.6)',
    border: '1px solid rgba(80,80,90,0.2)',
    borderRadius: 10,
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  sectionTitle: {
    color: '#f0f0f0',
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 12,
    display: 'flex',
    alignItems: 'center',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
  },
  formLabel: {
    color: '#90909a',
    fontSize: 11,
    fontWeight: 500,
  },
  formInput: {
    background: 'rgba(18,18,22,0.8)',
    border: '1px solid rgba(80,80,90,0.3)',
    borderRadius: 6,
    padding: '6px 10px',
    color: '#f0f0f0',
    fontSize: 12,
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  formSelect: {
    background: 'rgba(18,18,22,0.8)',
    border: '1px solid rgba(80,80,90,0.3)',
    borderRadius: 6,
    padding: '6px 10px',
    color: '#f0f0f0',
    fontSize: 12,
    outline: 'none',
    cursor: 'pointer',
  },
  formTextarea: {
    background: 'rgba(18,18,22,0.8)',
    border: '1px solid rgba(80,80,90,0.3)',
    borderRadius: 6,
    padding: '8px 10px',
    color: '#f0f0f0',
    fontSize: 12,
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
  },
  dateInput: {
    background: 'rgba(18,18,22,0.8)',
    border: '1px solid rgba(80,80,90,0.3)',
    borderRadius: 6,
    padding: '6px 10px',
    color: '#f0f0f0',
    fontSize: 12,
    outline: 'none',
  },
  checkboxGroup: {
    margin: '8px 0',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    color: '#90909a',
    fontSize: 12,
    cursor: 'pointer',
  },
  parityDaysSection: {
    display: 'flex',
    gap: 16,
    margin: '12px 0',
  },
  parityColumn: {
    flex: 1,
  },
  daysButtons: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  dayBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    border: '1px solid',
    background: 'transparent',
    color: '#90909a',
    fontSize: 12,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },
  
  helpPanel: {
    position: 'absolute',
    right: 24,
    top: '50%',
    transform: 'translateY(-50%)',
    width: 280,
    background: 'rgba(28,28,34,0.95)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(107,142,122,0.3)',
    borderRadius: 16,
    padding: 16,
    zIndex: 40,
    transition: 'opacity 0.3s ease, transform 0.3s ease',
    boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
  },
  helpPanelHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottom: '1px solid rgba(80,80,90,0.3)',
  },
  helpPanelClose: {
    background: 'transparent',
    border: 'none',
    color: '#90909a',
    cursor: 'pointer',
    fontSize: 16,
    padding: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    transition: 'all 0.2s',
  },
  helpPanelBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  helpPanelTitle: {
    color: '#f0f0f0',
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 4,
  },
  helpTipsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  helpTipItem: {
    display: 'flex',
    gap: 8,
    fontSize: 12,
    color: '#c0c0cc',
    lineHeight: 1.5,
  },
  helpTipBullet: {
    color: '#6B8E7A',
    fontWeight: 'bold',
  },
  helpTipText: {
    flex: 1,
  },
  helpExamplesTitle: {
    color: '#90909a',
    fontSize: 11,
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
    marginTop: 8,
    marginBottom: 8,
  },
  helpExamplesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  helpExampleItem: {
    display: 'flex',
    alignItems: 'flex-start',
    fontSize: 11,
    color: '#a0a0aa',
    background: 'rgba(0,0,0,0.2)',
    padding: '8px 10px',
    borderRadius: 8,
    border: '1px solid rgba(80,80,90,0.2)',
  },
  helpExampleText: {
    flex: 1,
  },
  helpPanelFooter: {
    marginTop: 16,
    paddingTop: 12,
    borderTop: '1px solid rgba(80,80,90,0.2)',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    color: '#90909a',
    fontSize: 10,
  },
  helpFooterText: {
    fontSize: 10,
  },

  remixContainer: { maxWidth: 600, width: '90%' },
  remixOptions: { display: 'flex', gap: 20, alignItems: 'center' },
  remixOption: {
    flex: 1,
    background: 'rgba(28,28,34,0.8)',
    border: '1px solid rgba(180,95,77,0.3)',
    borderRadius: 24,
    padding: 40,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  remixDivider: { color: '#90909a', fontSize: 14 },
  remixAnalyzing: {
    background: 'rgba(28,28,34,0.8)',
    borderRadius: 24,
    padding: 48,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  remixImprovements: { background: 'rgba(28,28,34,0.8)', borderRadius: 24, padding: 32 },
  improvementsTitle: { color: '#f0f0f0', fontSize: 16, fontWeight: 600, marginBottom: 20 },
  improvementsList: { display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 },
  improvementCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    border: '1px solid',
    borderRadius: 16,
    padding: 16,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  improvementIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    background: 'rgba(18,18,22,0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  improvementContent: { flex: 1 },
  improvementTitle: { color: '#f0f0f0', fontSize: 14, fontWeight: 500, marginBottom: 4 },
  improvementDesc: { color: '#90909a', fontSize: 12 },
  improvementCheck: { width: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  remixActions: { display: 'flex', gap: 12 },
  remixApplyBtn: {
    flex: 2,
    background: '#B45F4D',
    border: 'none',
    borderRadius: 12,
    padding: '16px',
    color: '#000',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  remixApplyAllBtn: {
    flex: 1,
    background: 'rgba(28,28,34,0.8)',
    border: '1px solid rgba(180,95,77,0.3)',
    borderRadius: 12,
    padding: '16px',
    color: '#B45F4D',
    fontSize: 14,
    cursor: 'pointer',
  },
  modeHeader: { textAlign: 'center', marginBottom: 32 },
  modeIcon: { marginBottom: 16 },
  modeTitle: { fontSize: 28, fontWeight: 600, color: '#f0f0f0', marginBottom: 8 },
  modeDesc: { color: '#90909a', fontSize: 14 },

  syllabusPanel: {
    position: 'absolute',
    right: 16,
    top: 16,
    width: 320,
    maxHeight: 'calc(100vh - 90px)',
    display: 'flex',
    flexDirection: 'column' as const,
    background: 'rgba(14,14,20,0.97)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(34,197,94,0.35)',
    borderRadius: 16,
    zIndex: 30,
    overflow: 'hidden',
    boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
  },
  syllabusPanelHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderBottom: '1px solid rgba(80,80,90,0.2)',
    background: 'rgba(34,197,94,0.06)',
    flexShrink: 0,
  },
  syllabusPanelClose: {
    background: 'transparent',
    border: 'none',
    color: '#90909a',
    cursor: 'pointer',
    fontSize: 14,
  },
  syllabusPanelBody: {
    padding: 16,
    overflowY: 'auto' as const,
    flex: 1,
    scrollbarWidth: 'thin' as const,
    scrollbarColor: 'rgba(80,80,100,0.4) transparent',
  },
  syllabusInfo: {
    background: 'rgba(28,28,34,0.6)',
    borderRadius: 10,
    padding: 12,
  },
  syllabusInfoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '6px 0',
    borderBottom: '1px solid rgba(80,80,90,0.15)',
    fontSize: 12,
  },
  // ── Node Info Panel ─────────────────────────────────────────────────────────
  nodeInfoPanel: {
    position: 'absolute' as const,
    right: 16,
    top: 16,
    width: 320,
    maxHeight: 'calc(100vh - 90px)',
    display: 'flex',
    flexDirection: 'column' as const,
    background: 'rgba(14,14,20,0.97)',
    backdropFilter: 'blur(20px)',
    borderRadius: 16,
    zIndex: 30,
    overflow: 'hidden',
    boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
  },
  nodeInfoHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderBottom: '1px solid rgba(80,80,90,0.2)',
    flexShrink: 0,
  },
  nodeInfoHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  nodeInfoIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 17,
    flexShrink: 0,
  },
  nodeInfoTitle: {
    color: '#f0f0f0',
    fontWeight: 700,
    fontSize: 14,
    lineHeight: 1.2,
  },
  nodeInfoSubtitle: {
    color: '#70707a',
    fontSize: 11,
    marginTop: 1,
  },
  nodeInfoClose: {
    background: 'transparent',
    border: 'none',
    color: '#70707a',
    cursor: 'pointer',
    fontSize: 14,
    padding: '4px 6px',
    borderRadius: 6,
    lineHeight: 1,
    transition: 'color 0.15s',
    flexShrink: 0,
  },
  nodeInfoBody: {
    padding: 16,
    overflowY: 'auto' as const,
    flex: 1,
    scrollbarWidth: 'thin' as const,
    scrollbarColor: 'rgba(80,80,100,0.4) transparent',
  },
  nodeInfoCard: {
    background: 'rgba(28,28,38,0.65)',
    borderRadius: 10,
    padding: '10px 14px',
    marginBottom: 12,
    border: '1px solid rgba(80,80,100,0.18)',
  },
  nodeInfoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '5px 0',
    fontSize: 12,
    borderBottom: '1px solid rgba(80,80,90,0.1)',
  },
  nodeInfoRowLast: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '5px 0',
    fontSize: 12,
  },
  nodeInfoLabel: {
    color: '#70707a',
    fontSize: 10,
    letterSpacing: '0.07em',
    textTransform: 'uppercase' as const,
    marginBottom: 8,
    marginTop: 14,
    fontWeight: 600,
  },
  nodeInfoStatusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    padding: '3px 10px',
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 500,
  },
  nodeInfoRunBtn: {
    width: '100%',
    padding: '10px 0',
    borderRadius: 10,
    border: 'none',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
    transition: 'opacity 0.15s',
  },
  nipSectionLabel: {
    color: '#52525e',
    fontSize: 10,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    fontWeight: 700,
    marginBottom: 8,
  },

};