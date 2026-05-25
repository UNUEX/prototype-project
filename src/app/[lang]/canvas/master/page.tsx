// app/canvas/master/page.tsx
'use client';

/**
 * Страница Мастер-режима — отдельная страница /canvas/master
 * Layout: двухколоночный — чат-диалог слева + живое SVG-превью графа справа
 * После завершения: редирект в /canvas с передачей нодов через sessionStorage
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faWandMagicSparkles, faArrowRight, faCheck,
  faCalendarAlt, faBook, faFlask,
  faClipboardList, faPenToSquare, faBriefcase,
  faFileLines, faShieldHalved, faTrophy,
  faSpinner, faArrowLeft, faRocket,
} from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { useAuth } from '@/hooks/useAuth';

// ─── Types ────────────────────────────────────────────────────────────────────

type NodeKind =
  | 'import' | 'calendar' | 'lectures' | 'labs'
  | 'practicals' | 'sro' | 'srop' | 'kp'
  | 'sro_full' | 'boundary_control' | 'final_control';

interface BlockDef {
  kind: NodeKind;
  label: string;
  description: string;
  icon: IconDefinition;
  color: string;
  recommended?: boolean;
}

const BLOCKS: BlockDef[] = [
  { kind: 'calendar',         label: 'Календарный план', description: 'Расписание по неделям', icon: faCalendarAlt,    color: '#6366f1', recommended: true  },
  { kind: 'lectures',         label: 'Лекции',           description: 'Конспекты и планы',     icon: faBook,           color: '#8b5cf6', recommended: true  },
  { kind: 'labs',             label: 'Лабораторные',     description: 'Задания и инструкции',   icon: faFlask,          color: '#06b6d4'                      },
  { kind: 'practicals',       label: 'Практики',         description: 'Практические задания',   icon: faPenToSquare,    color: '#10b981'                      },
  { kind: 'sro',              label: 'СРО',              description: 'Самостоятельная работа', icon: faClipboardList,  color: '#f59e0b', recommended: true  },
  { kind: 'srop',             label: 'СРОП',             description: 'СРО с преподавателем',   icon: faBook,           color: '#f97316'                      },
  { kind: 'kp',               label: 'Курсовая',         description: 'Курсовой проект/работа', icon: faBriefcase,      color: '#ec4899'                      },
  { kind: 'sro_full',         label: 'СРО (полн.)',      description: 'Полный комплект СРО',    icon: faFileLines,      color: '#a78bfa'                      },
  { kind: 'boundary_control', label: 'Рубежный контроль',description: 'Контрольные задания',   icon: faShieldHalved,   color: '#64748b'                      },
  { kind: 'final_control',    label: 'Итоговый контроль',description: 'Экзамен / зачёт',       icon: faTrophy,         color: '#eab308'                      },
];

// ─── Chat Step Types ───────────────────────────────────────────────────────────

type ChatStep = 'welcome' | 'name' | 'blocks' | 'confirm';

interface ChatMessage {
  id: string;
  from: 'bot' | 'user';
  content: React.ReactNode;
  animate?: boolean;
}

// ─── SVG Preview ──────────────────────────────────────────────────────────────

const NW = 160;
const NH = 44;

interface PreviewNode {
  id: string;
  kind: NodeKind;
  x: number;
  y: number;
  label: string;
  color: string;
  isImport?: boolean;
}

interface PreviewConn { from: string; to: string; }

function buildPreviewGraph(selectedKinds: NodeKind[]): { nodes: PreviewNode[]; conns: PreviewConn[] } {
  const nodes: PreviewNode[] = [];
  const conns: PreviewConn[] = [];

  const importNode: PreviewNode = {
    id: 'import', kind: 'import', x: 20, y: 160,
    label: 'Силлабус', color: '#C49A6C', isImport: true,
  };
  nodes.push(importNode);

  const ordered = BLOCKS.filter(b => selectedKinds.includes(b.kind));
  const COL1_X = 230;
  const COL2_X = 420;
  const START_Y = 20;
  const STEP_Y = 64;

  ordered.forEach((b, i) => {
    const col = i % 2 === 0 ? COL1_X : COL2_X;
    const row = Math.floor(i / 2);
    const id = b.kind;
    nodes.push({ id, kind: b.kind, x: col, y: START_Y + row * STEP_Y, label: b.label, color: b.color });
    conns.push({ from: 'import', to: id });
  });

  return { nodes, conns };
}

const GraphPreview: React.FC<{ selectedKinds: NodeKind[]; projectName: string }> = ({ selectedKinds, projectName }) => {
  const { nodes, conns } = buildPreviewGraph(selectedKinds);
  const maxX = nodes.reduce((m, n) => Math.max(m, n.x + NW), 0);
  const maxY = nodes.reduce((m, n) => Math.max(m, n.y + NH), 0);
  const vw = maxX + 24;
  const vh = maxY + 24;

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: '24px 20px' }}>
      {/* Header */}
      <div style={{ marginBottom: 16, flexShrink: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: 4 }}>
          Превью проекта
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {projectName || 'Новый проект'}
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
          {selectedKinds.length} блок{selectedKinds.length === 1 ? '' : selectedKinds.length < 5 ? 'а' : 'ов'} выбрано
        </div>
      </div>

      {/* SVG graph */}
      <div style={{ flex: 1, overflow: 'auto', borderRadius: 12, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)' }}>
        {nodes.length <= 1 ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>
            Выберите блоки для превью
          </div>
        ) : (
          <svg viewBox={`0 0 ${vw} ${vh}`} width="100%" style={{ display: 'block', minHeight: 200 }}>
            <defs>
              {nodes.map(n => (
                <filter key={`glow-${n.id}`} id={`glow-${n.id}`}>
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              ))}
            </defs>

            {/* Connections */}
            {conns.map(c => {
              const from = nodes.find(n => n.id === c.from);
              const to = nodes.find(n => n.id === c.to);
              if (!from || !to) return null;
              const x1 = from.x + NW;
              const y1 = from.y + NH / 2;
              const x2 = to.x;
              const y2 = to.y + NH / 2;
              const mx = (x1 + x2) / 2;
              return (
                <path
                  key={`${c.from}-${c.to}`}
                  d={`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`}
                  fill="none"
                  stroke="rgba(99,102,241,0.35)"
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                />
              );
            })}

            {/* Nodes */}
            {nodes.map(n => (
              <g key={n.id} transform={`translate(${n.x},${n.y})`} style={{ transition: 'all 0.3s ease' }}>
                <rect
                  x={0} y={0} width={NW} height={NH} rx={8}
                  fill={n.isImport ? 'rgba(196,154,108,0.12)' : `${n.color}12`}
                  stroke={n.isImport ? '#C49A6C' : n.color}
                  strokeWidth={1.5}
                  opacity={0.9}
                />
                {/* Color dot */}
                <circle cx={14} cy={NH / 2} r={4} fill={n.isImport ? '#C49A6C' : n.color} opacity={0.8} />
                <text
                  x={26} y={NH / 2 + 1}
                  fill="#fff"
                  fontSize={11}
                  fontWeight={600}
                  dominantBaseline="middle"
                  fontFamily="system-ui, sans-serif"
                >
                  {n.label.length > 16 ? n.label.slice(0, 15) + '…' : n.label}
                </text>
              </g>
            ))}
          </svg>
        )}
      </div>

      {/* Stats */}
      {selectedKinds.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap', flexShrink: 0 }}>
          {BLOCKS.filter(b => selectedKinds.includes(b.kind)).map(b => (
            <div key={b.kind} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '3px 8px', borderRadius: 100,
              background: `${b.color}15`, border: `1px solid ${b.color}35`,
              fontSize: 10, fontWeight: 600, color: b.color,
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: b.color, flexShrink: 0 }} />
              {b.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Block Selector Card ───────────────────────────────────────────────────────

const BlockCard: React.FC<{
  block: BlockDef;
  selected: boolean;
  onToggle: () => void;
}> = ({ block, selected, onToggle }) => (
  <button
    onClick={onToggle}
    style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 14px',
      background: selected ? `${block.color}15` : 'rgba(255,255,255,0.03)',
      border: `1.5px solid ${selected ? block.color : 'rgba(255,255,255,0.08)'}`,
      borderRadius: 12,
      cursor: 'pointer',
      transition: 'all 0.2s',
      textAlign: 'left',
      width: '100%',
      position: 'relative',
    }}
  >
    <div style={{
      width: 32, height: 32, borderRadius: 8, flexShrink: 0,
      background: selected ? `${block.color}25` : 'rgba(255,255,255,0.05)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: selected ? block.color : 'rgba(255,255,255,0.4)',
      transition: 'all 0.2s',
    }}>
      <FontAwesomeIcon icon={block.icon} style={{ fontSize: 13 }} />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontWeight: 600, fontSize: 12.5, color: selected ? '#fff' : 'rgba(255,255,255,0.7)' }}>
          {block.label}
        </span>
        {block.recommended && (
          <span style={{
            fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4,
            background: 'rgba(99,102,241,0.2)', color: '#818cf8', letterSpacing: 0.5,
          }}>
            РЕК.
          </span>
        )}
      </div>
      <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>
        {block.description}
      </div>
    </div>
    {selected && (
      <div style={{
        width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
        background: block.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <FontAwesomeIcon icon={faCheck} style={{ fontSize: 9, color: '#fff' }} />
      </div>
    )}
  </button>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MasterPage() {
  const router = useRouter();
  const params = useParams();
  const language = (params?.lang as string) || 'ru';
  const { user, loading: authLoading } = useAuth();

  const [step, setStep] = useState<ChatStep>('welcome');
  const [projectName, setProjectName] = useState('');
  const [selectedKinds, setSelectedKinds] = useState<NodeKind[]>(['calendar', 'lectures', 'sro']);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) {
      window.dispatchEvent(new CustomEvent('hivers:open-auth', { detail: { mode: 'login' } }));
      router.replace(`/${language}`);
    }
  }, [user, authLoading, router, language]);

  const addMessage = useCallback((msg: Omit<ChatMessage, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    setMessages(prev => [...prev, { ...msg, id }]);
  }, []);

  // Welcome message on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      addMessage({
        from: 'bot',
        animate: true,
        content: (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <FontAwesomeIcon icon={faWandMagicSparkles} style={{ color: '#fff', fontSize: 18 }} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>Мастер настройки</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>HiVersity Canvas</div>
              </div>
            </div>
            <p style={{ margin: 0, lineHeight: 1.6, color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>
              Привет! Я помогу настроить ваш проект за несколько шагов.
              Мы выберем нужные блоки, и я автоматически создам граф в конструкторе.
            </p>
          </div>
        ),
      });

      setTimeout(() => {
        addMessage({
          from: 'bot',
          animate: true,
          content: (
            <p style={{ margin: 0, lineHeight: 1.6, color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>
              Как назовём проект? Можете написать название дисциплины или оставить стандартное.
            </p>
          ),
        });
        setStep('name');
        setTimeout(() => nameInputRef.current?.focus(), 100);
      }, 600);
    }, 300);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleNameSubmit = () => {
    const name = nameInput.trim() || 'Новый проект';
    setProjectName(name);
    setNameInput('');

    addMessage({ from: 'user', content: <span style={{ fontSize: 14 }}>{name}</span> });

    setTimeout(() => {
      addMessage({
        from: 'bot',
        animate: true,
        content: (
          <p style={{ margin: 0, lineHeight: 1.6, color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>
            Отлично! Теперь выберите блоки, которые нужны в проекте «<strong style={{ color: '#818cf8' }}>{name}</strong>». 
            Рекомендованные уже отмечены — их можно менять.
          </p>
        ),
      });
      setStep('blocks');
    }, 400);
  };

  const handleBlocksConfirm = () => {
    if (selectedKinds.length === 0) return;

    const blockLabels = BLOCKS
      .filter(b => selectedKinds.includes(b.kind))
      .map(b => b.label)
      .join(', ');

    addMessage({
      from: 'user',
      content: (
        <div style={{ fontSize: 14 }}>
          Выбрано: <span style={{ color: '#818cf8' }}>{blockLabels}</span>
        </div>
      ),
    });

    setTimeout(() => {
      addMessage({
        from: 'bot',
        animate: true,
        content: (
          <div>
            <p style={{ margin: '0 0 12px', lineHeight: 1.6, color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>
              Всё готово! Я создам проект <strong style={{ color: '#818cf8' }}>{projectName}</strong> с {selectedKinds.length} блоком{selectedKinds.length < 5 ? 'ами' : 'ами'} и открою конструктор.
            </p>
            <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
              После перехода загрузите силлабус в блок «Силлабус» и запустите генерацию.
            </p>
          </div>
        ),
      });
      setStep('confirm');
    }, 400);
  };

  const handleGenerate = useCallback(async () => {
    if (isGenerating) return;
    setIsGenerating(true);

    const uid = () => Math.random().toString(36).slice(2, 9);

    // Build nodes
    const newNodes: Array<{ id: string; kind: string; label: string; prompt: string; status: string; x: number; y: number }> = [];
    const newConns: Array<{ from: string; to: string }> = [];

    const importId = uid();
    newNodes.push({ id: importId, kind: 'import', label: 'Силлабус', prompt: '', status: 'idle', x: 60, y: 200 });

    const orderedKinds = BLOCKS
      .filter(b => selectedKinds.includes(b.kind))
      .map(b => b.kind);

    const COL1_X = 380;
    const COL2_X = 660;
    const START_Y = 80;
    const STEP_Y = 115;

    orderedKinds.forEach((kind, i) => {
      const KINDS_LABELS: Record<string, string> = {
        calendar: 'Календарный план', lectures: 'Лекции', labs: 'Лабораторные',
        practicals: 'Практики', sro: 'СРО', srop: 'СРОП', kp: 'Курсовая',
        sro_full: 'СРО (полн.)', boundary_control: 'Рубежный контроль', final_control: 'Итоговый контроль',
      };
      const col = i % 2 === 0 ? COL1_X : COL2_X;
      const row = Math.floor(i / 2);
      const nodeId = uid();
      newNodes.push({ id: nodeId, kind, label: KINDS_LABELS[kind] ?? kind, prompt: '', status: 'idle', x: col, y: START_Y + row * STEP_Y });
      newConns.push({ from: importId, to: nodeId });
    });

    // Pass data via sessionStorage → canvas page reads it
    sessionStorage.setItem('master_project_name', projectName || 'Новый проект');
    sessionStorage.setItem('master_nodes', JSON.stringify(newNodes));
    sessionStorage.setItem('master_conns', JSON.stringify(newConns));

    // Animate transition
    setIsTransitioning(true);
    await new Promise(r => setTimeout(r, 800));
    router.push(`/${language}/canvas?from=master`);
  }, [isGenerating, selectedKinds, projectName, router, language]);

  const toggleKind = (kind: NodeKind) => {
    setSelectedKinds(prev =>
      prev.includes(kind) ? prev.filter(k => k !== kind) : [...prev, kind]
    );
  };

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <FontAwesomeIcon icon={faSpinner} spin style={{ color: '#6366f1', fontSize: 24 }} />
      </div>
    );
  }

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; height: 100%; }

        @keyframes msgIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes pageOut {
          from { opacity: 1; transform: scale(1); }
          to   { opacity: 0; transform: scale(1.04); }
        }
        @keyframes dotPulse {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }

        .msg-animate { animation: msgIn 0.35s cubic-bezier(.16,1,.3,1) both; }
        .page-out    { animation: pageOut 0.6s ease forwards; }

        .block-card-btn:hover { transform: translateY(-1px); }

        .input-name:focus { outline: none; border-color: #6366f1 !important; background: rgba(255,255,255,0.06) !important; }

        .chat-send-btn:hover:not(:disabled) { background: rgba(99,102,241,0.3) !important; transform: scale(1.05); }
        .chat-send-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        .gen-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 16px 40px -8px rgba(99,102,241,0.5) !important; }
        .gen-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
      `}</style>

      {/* Transition overlay */}
      {isTransitioning && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'linear-gradient(135deg, #0f0f1a, #1a1a2e)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 16, animation: 'fadeIn 0.4s ease',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <FontAwesomeIcon icon={faRocket} style={{ color: '#fff', fontSize: 24 }} />
          </div>
          <div style={{ color: '#fff', fontSize: 16, fontWeight: 600 }}>Открываю конструктор…</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[0,1,2].map(i => (
              <div key={i} style={{
                width: 7, height: 7, borderRadius: '50%', background: '#6366f1',
                animation: `dotPulse 1.2s ease ${i * 0.2}s infinite`,
              }} />
            ))}
          </div>
        </div>
      )}

      <div className={isTransitioning ? 'page-out' : ''} style={{
        minHeight: '100vh', background: '#0f0f1a', color: '#fff',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        display: 'flex', flexDirection: 'column',
      }}>

        {/* Top bar */}
        <div style={{
          height: 56, borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', paddingInline: 20, gap: 16,
          background: 'rgba(15,15,26,0.8)', backdropFilter: 'blur(12px)',
          position: 'sticky', top: 0, zIndex: 100, flexShrink: 0,
        }}>
          <button
            onClick={() => router.back()}
            style={{
              width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)',
              background: 'transparent', color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
            }}
          >
            <FontAwesomeIcon icon={faArrowLeft} style={{ fontSize: 12 }} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 24, height: 24, borderRadius: 6,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <FontAwesomeIcon icon={faWandMagicSparkles} style={{ color: '#fff', fontSize: 11 }} />
            </div>
            <span style={{ fontWeight: 700, fontSize: 14 }}>Мастер настройки</span>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            {(['welcome','name','blocks','confirm'] as ChatStep[]).map((s, i) => (
              <div key={s} style={{
                height: 4, borderRadius: 2,
                width: ['welcome','name','blocks','confirm'].indexOf(step) >= i ? 24 : 8,
                background: ['welcome','name','blocks','confirm'].indexOf(step) >= i
                  ? '#6366f1' : 'rgba(255,255,255,0.15)',
                transition: 'all 0.3s ease',
              }} />
            ))}
          </div>
        </div>

        {/* Main layout: 2 columns */}
        <div style={{
          flex: 1, display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          overflow: 'hidden',
          maxHeight: 'calc(100vh - 56px)',
        }}>

          {/* ── LEFT: Chat ── */}
          <div style={{
            display: 'flex', flexDirection: 'column',
            borderRight: '1px solid rgba(255,255,255,0.06)',
            overflow: 'hidden',
          }}>
            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px 24px 8px' }}>
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={msg.animate ? 'msg-animate' : ''}
                  style={{
                    display: 'flex',
                    justifyContent: msg.from === 'user' ? 'flex-end' : 'flex-start',
                    marginBottom: 16,
                  }}
                >
                  {msg.from === 'bot' && (
                    <div style={{
                      width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginRight: 10, marginTop: 2,
                    }}>
                      <FontAwesomeIcon icon={faWandMagicSparkles} style={{ color: '#fff', fontSize: 11 }} />
                    </div>
                  )}
                  <div style={{
                    maxWidth: '75%',
                    padding: '12px 16px',
                    borderRadius: msg.from === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                    background: msg.from === 'user'
                      ? 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.2))'
                      : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${msg.from === 'user' ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.06)'}`,
                  }}>
                    {msg.content}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Input area */}
            <div style={{ padding: '12px 24px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>

              {/* Step: name */}
              {step === 'name' && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    ref={nameInputRef}
                    className="input-name"
                    type="text"
                    placeholder="Название проекта или дисциплины…"
                    value={nameInput}
                    onChange={e => setNameInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleNameSubmit()}
                    style={{
                      flex: 1, padding: '12px 16px',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 12, color: '#fff', fontSize: 14,
                      transition: 'all 0.2s',
                    }}
                  />
                  <button
                    className="chat-send-btn"
                    onClick={handleNameSubmit}
                    style={{
                      width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                      background: 'rgba(99,102,241,0.2)',
                      border: '1px solid rgba(99,102,241,0.3)',
                      color: '#818cf8', cursor: 'pointer', transition: 'all 0.2s',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <FontAwesomeIcon icon={faArrowRight} />
                  </button>
                </div>
              )}

              {/* Step: blocks */}
              {step === 'blocks' && (
                <div>
                  <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 12,
                    maxHeight: 320, overflowY: 'auto',
                  }}>
                    {BLOCKS.map(b => (
                      <BlockCard
                        key={b.kind}
                        block={b}
                        selected={selectedKinds.includes(b.kind)}
                        onToggle={() => toggleKind(b.kind)}
                      />
                    ))}
                  </div>
                  <button
                    onClick={handleBlocksConfirm}
                    disabled={selectedKinds.length === 0}
                    style={{
                      width: '100%', padding: '12px', borderRadius: 12,
                      background: selectedKinds.length > 0
                        ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                        : 'rgba(255,255,255,0.05)',
                      border: 'none', color: '#fff', fontSize: 14, fontWeight: 700,
                      cursor: selectedKinds.length > 0 ? 'pointer' : 'not-allowed',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      transition: 'all 0.2s',
                    }}
                  >
                    <FontAwesomeIcon icon={faCheck} />
                    Подтвердить выбор ({selectedKinds.length})
                  </button>
                </div>
              )}

              {/* Step: confirm — launch button */}
              {step === 'confirm' && (
                <button
                  className="gen-btn"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  style={{
                    width: '100%', padding: '14px',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    border: 'none', borderRadius: 14, color: '#fff',
                    fontSize: 15, fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    transition: 'all 0.25s',
                    boxShadow: '0 8px 24px -4px rgba(99,102,241,0.3)',
                  }}
                >
                  {isGenerating ? (
                    <><FontAwesomeIcon icon={faSpinner} spin /> Создаю проект…</>
                  ) : (
                    <><FontAwesomeIcon icon={faRocket} /> Создать и открыть конструктор</>
                  )}
                </button>
              )}

              {/* Waiting for bot (welcome step) */}
              {step === 'welcome' && (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[0,1,2].map(i => (
                      <div key={i} style={{
                        width: 5, height: 5, borderRadius: '50%', background: '#6366f1',
                        animation: `dotPulse 1.2s ease ${i * 0.2}s infinite`,
                      }} />
                    ))}
                  </div>
                  Мастер печатает…
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT: Live Preview ── */}
          <div style={{
            background: 'rgba(255,255,255,0.01)',
            overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
          }}>
            <GraphPreview selectedKinds={selectedKinds} projectName={projectName} />
          </div>
        </div>
      </div>
    </>
  );
}