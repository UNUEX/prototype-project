'use client';

/**
 * app/canvas/page.functional.tsx
 * ФУНКЦИОНАЛ — состояния, хуки, обработчики, бизнес-логика
 * ОБНОВЛЕНО: Удалены хуки useExpressMode и useRemixMode. Тип CanvasMode изменён.
 * ИСПРАВЛЕНО: Удалены неиспользуемые импорты, исправлены типы any, добавлены зависимости в useEffect
 */

// Импорты для ошибок
import { LimitExceededError, GlobalLimitExceededError, AuthRequiredError } from '@/lib/apiFetch';
import { apiFetch } from '@/lib/apiFetch';

import { useState, useRef, useCallback, useEffect, Dispatch, SetStateAction } from 'react';
import { toast } from 'react-hot-toast';
import {
  faLayerGroup,
  faClipboardList, faCalendarCheck,
  faChalkboard, faMicroscope, faPenToSquare,
  faDiagramProject, faGraduationCap,
  faChalkboardUser, faUserGraduate, faBriefcase,
  faFileLines, faTableCells,
} from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

// ─── Types ────────────────────────────────────────────────────────────────────

export type NodeKind = 'import' | 'calendar' | 'lectures' | 'labs' | 'practicals' | 'sro' | 'srop' | 'kp' | 'sro_full' | 'boundary_control' | 'final_control' | 'excel';
export type NodeStatus = 'idle' | 'running' | 'done' | 'error';
export type CanvasMode = 'constructor';
export type EducationLevel = 'bachelor' | 'master' | 'specialist';
export type ClassType = 'lectures' | 'labs' | 'practicals' | 'sro';
export type DocumentType = 'syllabus' | 'calendar';
export type ProjectStatus = 'draft' | 'in_progress' | 'completed';

// Интерфейс для проекта Canvas
export interface CanvasProject {
  id: string;
  user_id: string;
  name: string;
  description: string;
  mode: CanvasMode;
  discipline?: string;
  status: ProjectStatus;
  nodes: FlowNode[];
  conns: Connection[];
  created_at: string;
  updated_at: string;
  thumbnail?: string;
  tags: string[];
  settings?: {
    zoom: number;
    pan: { x: number; y: number };
  };
}

export interface RupFormDataType {
  subject: string;
  grade: string;
  goals: string;
  learningOutcomes: string;
  hours: string;
  language: string;
  semester: string;
  code: string;
  cycle: string;
  program: string;
  credits: string;
  prerequisites: string;
  postrequisites: string;
  teacher: string;
}

export interface CalendarFormDataType {
  subject: string;
  grade: string;
  hours: string;
  weeks: string;
  teacher: string;
  goals?: string;
  learningOutcomes?: string;
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
}

export interface SyllabusData {
  discipline: string;
  hasLectures: boolean;
  hasLabs: boolean;
  hasPracticals: boolean;
  hasSRO: boolean;
  hasSROP: boolean;
  hasSROFull?: boolean;
  hasKP: boolean;
  hours?: number;
  level?: EducationLevel;
  topics?: string[];
  rawText?: string;
  teacher?: string;
  program?: string;
  sropTable?: Array<{ theme: string; goal: string; task: string }>;
  sroTasks?: string[];
  sroQuestions?: string[];
  lectureTopics?: string[];
  labTopics?: string[];
  practicalTopics?: string[];
  sropTopics?: string[];
  kpTopics?: string[];
  disciplineCode?: string;
  introduction?: string;
  goal?: string;
  tasks?: string;
  learningResults?: string;
  thematicPlanText?: string;
  thematicPlanRows?: Array<{
    _meta?: boolean;
    isHeader?: boolean;
    isTotals?: boolean;
    num?: string;
    topic?: string;
    lectures?: string;
    practicals?: string;
    labs?: string;
    srop?: string;
    sro?: string;
    kp?: string;
    presentFields?: string[];
    columnHeaders?: Record<string, string>;
    [key: string]: unknown;
  }>;
}

export interface NodeFileData {
  fileName: string;
  discipline?: string;
  teacher?: string;
  rawText: string;
  lectureTopics?: string[];
  labTopics?: string[];
  practicalTopics?: string[];
  sroTasks?: string[];
  sropTopics?: string[];
  kpTopics?: string[];
  allTopics?: string[];
}

export interface FlowNode {
  id: string;
  kind: NodeKind;
  label: string;
  prompt: string;
  status: NodeStatus;
  filename?: string;
  uploadedFile?: string;
  duration?: number;
  error?: string;
  x: number;
  y: number;
  syllabusData?: SyllabusData;
  generatedTopics?: string[];
  generatedContext?: string;
  nodeFileData?: NodeFileData;
  generationMode?: 'topics' | 'full';
  metadata?: {
    topics?: string[];
    hours?: number;
    level?: EducationLevel;
    count?: number;
    details?: string;
    generationTarget?: DocumentType;
    excelTemplate?: 'grades' | 'workload' | 'custom';
    [key: string]: unknown;
  };
}

export interface Connection { from: string; to: string }

export interface MasterAnswers {
  discipline: string;
  level: EducationLevel;
  hours: number;
  classTypes: Record<ClassType, boolean>;
  details: string;
}

export interface AnalysisResult {
  discipline: string;
  hours: number;
  hasLectures: boolean;
  hasLabs: boolean;
  hasPracticals: boolean;
  hasSRO: boolean;
  level: EducationLevel;
  topics?: string[];
  labsCount?: number;
  lecturesCount?: number;
  group?: string;
  teacher?: string;
  weeks?: number;
  controlType?: string;
  semester?: string;
  startDate?: string;
  endDate?: string;
}

export interface DiffItem {
  id: string;
  type: 'add' | 'remove' | 'modify';
  nodeType?: NodeKind;
  nodeId?: string;
  title: string;
  description: string;
  icon?: IconDefinition;
  color?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    type?: DocumentType;
    analysis?: AnalysisResult;
  };
}

export interface CanvasState {
  currentProjectId: string | null;
  projects: CanvasProject[];
  mode: CanvasMode;
  setMode: Dispatch<SetStateAction<CanvasMode>>;
  nodes: FlowNode[];
  setNodes: Dispatch<SetStateAction<FlowNode[]>>;
  conns: Connection[];
  setConns: Dispatch<SetStateAction<Connection[]>>;
  selected: string | null;
  setSelected: Dispatch<SetStateAction<string | null>>;
  pan: { x: number; y: number };
  setPan: (value: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) => void;
  zoom: number;
  setZoom: Dispatch<SetStateAction<number>>;
  editNode: FlowNode | null;
  setEditNode: Dispatch<SetStateAction<FlowNode | null>>;
  runningAll: boolean;
  setRunAll: Dispatch<SetStateAction<boolean>>;
  isPanningEnabled: React.MutableRefObject<boolean>;
  dragging: React.MutableRefObject<{ id: string; ox: number; oy: number } | null>;
  panning: React.MutableRefObject<{ sx: number; sy: number; px: number; py: number } | null>;
  drawing: React.MutableRefObject<{ fromId: string; fromSide: 'l'|'r' } | null>;
  draft: { x1: number; y1: number; x2: number; y2: number } | null;
  setDraft: Dispatch<SetStateAction<{ x1: number; y1: number; x2: number; y2: number } | null>>;
  toSV: (clientX: number, clientY: number, svgRef: React.RefObject<SVGSVGElement>) => { x: number; y: number };
  addNode: (kind: NodeKind, metadata?: Record<string, unknown>, svgRef?: React.RefObject<SVGSVGElement | null>) => string;
  addNodeAtPosition: (kind: NodeKind, x: number, y: number, metadata?: Record<string, unknown>) => string;
  delNode: (id: string) => void;
  updateNode: (id: string, updates: Partial<FlowNode>) => void;
  addConnection: (from: string, to: string) => void;
  resetAll: (cancelAll?: () => void) => void;
  doneN: number;
  genN: number;
  isSaving?: boolean;
  isOffline?: boolean;
  createProject: (name: string, description?: string, mode?: CanvasMode) => Promise<string>;
  switchProject: (projectId: string) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  updateProject: (projectId: string, updates: Partial<CanvasProject>) => Promise<void>;
  loadProjects: () => Promise<void>;
  saveCurrentProject: () => Promise<void>;
  nodesRef: React.MutableRefObject<FlowNode[]>;
  connsRef: React.MutableRefObject<Connection[]>;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const KINDS: Record<NodeKind, { emoji: string; label: string; border: string; desc: string; faIcon: IconDefinition; color: string }> = {
  import:     { emoji: '📥', label: 'Импорт силлабуса', border: '#B45F4D', desc: 'Загрузить .doc/.docx', faIcon: faFileLines, color: '#B45F4D' },
  calendar:   { emoji: '📅', label: 'Календарный план', border: '#6B8E7A', desc: 'КТП / расписание', faIcon: faCalendarCheck, color: '#6B8E7A' },
  lectures:   { emoji: '📋', label: 'Лекции',           border: '#9A7B8C', desc: 'План лекций', faIcon: faChalkboard, color: '#9A7B8C' },
  labs:       { emoji: '🧪', label: 'Лаб. работы',      border: '#C49A6C', desc: 'Лабораторные', faIcon: faMicroscope, color: '#C49A6C' },
  practicals: { emoji: '💻', label: 'Практические',     border: '#7C9A92', desc: 'Практические занятия', faIcon: faChalkboardUser, color: '#7C9A92' },
  sro:        { emoji: '✏️', label: 'СРО задания',       border: '#8A7C9A', desc: 'Самост. работа студента', faIcon: faPenToSquare, color: '#8A7C9A' },
  srop:       { emoji: '📝', label: 'СРОП задания',      border: '#9A8A7C', desc: 'Самост. работа с преп.', faIcon: faClipboardList, color: '#9A8A7C' },
  kp:         { emoji: '🏗️', label: 'Курсовой проект',  border: '#7C8A9A', desc: 'Курсовой проект / работа', faIcon: faLayerGroup, color: '#7C8A9A' },
  sro_full:   { emoji: '📚', label: 'СРО (полный)',      border: '#4A7A8C', desc: 'Полный документ СРО (как в PDF)', faIcon: faFileLines, color: '#4A7A8C' },
  boundary_control: { emoji: '📋', label: 'Рубежный контроль', border: '#A06A9A', desc: 'Материалы РК (тесты/вопросы)', faIcon: faClipboardList, color: '#A06A9A' },
  final_control:    { emoji: '🎓', label: 'Итоговый контроль', border: '#6A8ACA', desc: 'Материалы итогового экзамена', faIcon: faGraduationCap, color: '#6A8ACA' },
  excel:            { emoji: '📊', label: 'Excel таблица',     border: '#1D6F42', desc: 'Журнал, аналитика, отчёт .xlsx', faIcon: faTableCells, color: '#2e7d52' },
};

export const MODES: Record<CanvasMode, { label: string; icon: IconDefinition; desc: string; color: string }> = {
  constructor: { label: 'Конструктор', icon: faDiagramProject, desc: 'Ручная сборка графа', color: '#C49A6C' },
};

export const LEVELS = [
  { value: 'bachelor', label: 'Бакалавриат', icon: faUserGraduate, description: '4 года, базовое высшее' },
  { value: 'master', label: 'Магистратура', icon: faGraduationCap, description: '2 года, углублённое изучение' },
  { value: 'specialist', label: 'Специалитет', icon: faBriefcase, description: '5 лет, профессиональное образование' },
];

export const ANALYSIS_STEPS = [
  'Читаем документ...',
  'Ищем ключевые разделы...',
  'Определяем структуру...',
  'Анализируем содержание...'
];

export const NW = 240;
export const NH = 90;

// ─── Utility Functions ─────────────────────────────────────────────────────────

export function uid() {
  return Math.random().toString(36).slice(2, 8);
}

export function portPos(n: FlowNode, side: 'l' | 'r') {
  return { x: side === 'r' ? n.x + NW : n.x, y: n.y + NH / 2 };
}

export function bezier(x1: number, y1: number, x2: number, y2: number) {
  const dx = Math.abs(x2 - x1) * 0.5;
  return `M${x1},${y1} C${x1+dx},${y1} ${x2-dx},${y2} ${x2},${y2}`;
}

// ─── Canvas Persistence (Supabase) ──────────────────────────────────────────
import { supabase } from '@/lib/supabaseClient';

const LAST_ACTIVE_KEY = (userId: string) => `last_active_canvas_${userId}`;

/** Сохраняет/обновляет проект в Supabase. Fallback — localStorage. */
export async function saveCanvasProject(
  userId: string,
  project: CanvasProject
): Promise<boolean> {
  if (!userId) return false;
  try {
    const cleanNodes = project.nodes.map(n => {
      const { syllabusData, ...rest } = n;
      return {
        ...rest,
        status: rest.status === 'running' ? 'idle' : rest.status,
        syllabusData: syllabusData ? { ...syllabusData, rawText: undefined } : undefined,
      };
    });

    const payload = {
      id: project.id,
      user_id: userId,
      name: project.name,
      description: project.description || '',
      mode: project.mode,
      discipline: project.discipline || null,
      status: project.status,
      nodes: cleanNodes,
      conns: project.conns || [],
      tags: project.tags || [],
      settings: project.settings || { zoom: 0.88, pan: { x: 80, y: 50 } },
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('canvas_projects')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.warn('[canvas] Supabase save error, fallback localStorage:', error.message);
      _localSave(userId, project);
      return false;
    }
    return true;
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    console.warn('[canvas] saveCanvasProject error:', errorMessage);
    _localSave(userId, project);
    return false;
  }
}

/** Загружает проекты пользователя из Supabase. Fallback — localStorage. */
export async function loadCanvasProjects(userId: string): Promise<CanvasProject[]> {
  if (!userId) return [];
  try {
    const { data, error } = await supabase
      .from('canvas_projects')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.warn('[canvas] Supabase load error, fallback localStorage:', error.message);
      return _localLoad(userId);
    }
    return (data || []) as CanvasProject[];
  } catch (e) {
    console.warn('[canvas] loadCanvasProjects error:', e);
    return _localLoad(userId);
  }
}

/** Удаляет проект из Supabase. */
export async function deleteCanvasProject(projectId: string, userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('canvas_projects')
      .delete()
      .eq('id', projectId)
      .eq('user_id', userId);

    if (error) throw error;
    _localRemove(userId, projectId);
    return true;
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    console.warn('[canvas] deleteCanvasProject error:', errorMessage);
    _localRemove(userId, projectId);
    return true;
  }
}

// ── localStorage fallback ──────────────────────────────────────────────────────
function _localKey(userId: string) { return `canvas_projects_${userId}`; }
function _localSave(userId: string, project: CanvasProject) {
  try {
    const all = _localLoad(userId);
    const idx = all.findIndex(p => p.id === project.id);
    if (idx >= 0) all[idx] = project; else all.unshift(project);
    localStorage.setItem(_localKey(userId), JSON.stringify(all));
  } catch {}
}
function _localLoad(userId: string): CanvasProject[] {
  try {
    const data = localStorage.getItem(_localKey(userId));
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}
function _localRemove(userId: string, projectId: string) {
  try {
    const all = _localLoad(userId).filter(p => p.id !== projectId);
    localStorage.setItem(_localKey(userId), JSON.stringify(all));
  } catch {}
}

// ─── Custom Hooks ─────────────────────────────────────────────────────────────

export function useCanvasState(userId?: string) {
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [projects, setProjects] = useState<CanvasProject[]>([]);
  const [mode, setMode] = useState<CanvasMode>('constructor');
  const [nodes, setNodes] = useState<FlowNode[]>([]);
  const [conns, setConns] = useState<Connection[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [pan, setPan] = useState({ x: 80, y: 50 });
  const [zoom, setZoom] = useState(0.88);
  const [editNode, setEditNode] = useState<FlowNode | null>(null);
  const [runningAll, setRunAll] = useState(false);
  const [draft, setDraft] = useState<{ x1:number;y1:number;x2:number;y2:number } | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isPanningEnabled = useRef(false);
  const dragging = useRef<{ id: string; ox: number; oy: number } | null>(null);
  const panning = useRef<{ sx: number; sy: number; px: number; py: number } | null>(null);
  const drawing = useRef<{ fromId: string; fromSide: 'l'|'r' } | null>(null);

  const nodesRef = useRef(nodes);
  const connsRef = useRef(conns);
  const modeRef = useRef(mode);
  const panRef = useRef(pan);
  const zoomRef = useRef(zoom);
  const currentProjectIdRef = useRef(currentProjectId);
  const projectsRef = useRef(projects);
  const deletedProjectIdsRef = useRef<Set<string>>(new Set());
  const isSwitchingProjectRef = useRef(false);

  useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  useEffect(() => { connsRef.current = conns; }, [conns]);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { panRef.current = pan; }, [pan]);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { currentProjectIdRef.current = currentProjectId; }, [currentProjectId]);
  useEffect(() => { projectsRef.current = projects; }, [projects]);

  const prevUserIdRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (prevUserIdRef.current !== userId) {
      prevUserIdRef.current = userId;
      if (userId && loaded) {
        setLoaded(false);
      }
    }
  }, [userId, loaded]);

  const createProject = useCallback(async (
    name: string,
    description: string = '',
    initialMode: CanvasMode = 'constructor'
  ): Promise<string> => {
    if (!userId) {
      toast.error('Пользователь не авторизован');
      return '';
    }

    const newProject: CanvasProject = {
      id: `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      name,
      description,
      mode: initialMode,
      status: 'draft',
      nodes: [],
      conns: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tags: [],
      settings: { zoom: 0.88, pan: { x: 80, y: 50 } },
    };

    try {
      setProjects(prev => [newProject, ...prev]);
      projectsRef.current = [newProject, ...projectsRef.current];

      const saved = await saveCanvasProject(userId, newProject);

      if (!saved) {
        console.log('💾 Проект сохранён локально');
      }

      setCurrentProjectId(newProject.id);
      setNodes([]);
      setConns([]);
      setMode(initialMode);
      setPan({ x: 80, y: 50 });
      setZoom(0.88);
      setSelected(null);
      setEditNode(null);

      if (typeof window !== 'undefined') localStorage.setItem(LAST_ACTIVE_KEY(userId), newProject.id);
      toast.success(`Проект "${name}" создан`);

      return newProject.id;
    } catch (error) {
      console.error('❌ Ошибка создания проекта:', error);
      toast.error('Не удалось создать проект');
      setProjects(prev => prev.filter(p => p.id !== newProject.id));
      return '';
    }
  }, [userId]);

  const createProjectWithNodes = useCallback(async (
    name: string,
    description: string = '',
    initialNodes: FlowNode[],
    initialConns: Connection[],
  ): Promise<string> => {
    if (!userId) {
      toast.error('Пользователь не авторизован');
      return '';
    }

    const newProject: CanvasProject = {
      id: `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      name,
      description,
      mode: 'constructor',
      status: 'in_progress',
      nodes: initialNodes,
      conns: initialConns,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tags: [],
      settings: { zoom: 0.88, pan: { x: 80, y: 50 } },
    };

    try {
      setProjects(prev => [newProject, ...prev]);
      projectsRef.current = [newProject, ...projectsRef.current];

      await saveCanvasProject(userId, newProject);

      setCurrentProjectId(newProject.id);
      currentProjectIdRef.current = newProject.id;
      setNodes(initialNodes);
      nodesRef.current = initialNodes;
      setConns(initialConns);
      connsRef.current = initialConns;
      setMode('constructor');
      setPan({ x: 80, y: 50 });
      setZoom(0.88);
      setSelected(null);
      setEditNode(null);

      if (typeof window !== 'undefined') localStorage.setItem(LAST_ACTIVE_KEY(userId), newProject.id);

      return newProject.id;
    } catch (error) {
      console.error('❌ Ошибка создания проекта с нодами:', error);
      toast.error('Не удалось создать проект');
      setProjects(prev => prev.filter(p => p.id !== newProject.id));
      return '';
    }
  }, [userId]);

  const saveCurrentProject = useCallback(async () => {
    if (!userId || !currentProjectIdRef.current) return;

    const pid = currentProjectIdRef.current;

    if (deletedProjectIdsRef.current.has(pid)) return;

    const project = projectsRef.current.find(p => p.id === pid);
    if (!project) return;

    const nodesToSave: FlowNode[] = nodesRef.current.map(n =>
      n.status === 'running' ? { ...n, status: 'idle' } : n
    );

    const updatedProject: CanvasProject = {
      ...project,
      nodes: nodesToSave,
      conns: connsRef.current,
      mode: modeRef.current,
      status: nodesRef.current.length > 0 ? 'in_progress' : 'draft',
      updated_at: new Date().toISOString(),
      settings: { zoom: zoomRef.current, pan: panRef.current },
      discipline: nodesRef.current.find(n => n.kind === 'import' && n.syllabusData)?.syllabusData?.discipline || project.discipline,
    };

    try {
      await saveCanvasProject(userId, updatedProject);
    } catch (error) {
      console.error('❌ Ошибка сохранения проекта:', error);
    }
  }, [userId]);

  // Загрузка всех проектов при инициализации
  useEffect(() => {
    if (!userId || loaded) return;

    const initProjects = async () => {
      try {
        console.log('📥 Загрузка проектов для пользователя:', userId);
        const loadedProjects = await loadCanvasProjects(userId);
        console.log(`📦 Загружено ${loadedProjects.length} проектов`);

        setProjects(loadedProjects);

        if (loadedProjects.length > 0) {
          const lastActive = localStorage.getItem(LAST_ACTIVE_KEY(userId));
          console.log('🔍 Последний активный проект:', lastActive);

          let projectToLoad = lastActive
            ? loadedProjects.find(p => p.id === lastActive)
            : loadedProjects[0];

          if (!projectToLoad) {
            projectToLoad = loadedProjects[0];
          }

          if (projectToLoad) {
            console.log('🔄 Загружаем проект:', projectToLoad.name);
            setCurrentProjectId(projectToLoad.id);
            const safeNodes1 = (projectToLoad.nodes || []).map((n: FlowNode) =>
              n.status === 'running' ? { ...n, status: 'idle' as NodeStatus } : n
            );
            setNodes(safeNodes1);
            setConns(projectToLoad.conns || []);
            setMode(['constructor','master'].includes(projectToLoad.mode) ? projectToLoad.mode : 'constructor');
            setPan(projectToLoad.settings?.pan || { x: 80, y: 50 });
            setZoom(projectToLoad.settings?.zoom || 0.88);
          }
        } else {
          console.log('🆕 Создание первого проекта');
          await createProject('Мой первый проект', 'Начните работу с Canvas');
        }
      } catch (error) {
        console.error('❌ Ошибка инициализации:', error);
        try {
          await createProject('Мой первый проект', 'Начните работу с Canvas');
        } catch (e) {
          console.error('❌ Не удалось создать проект:', e);
        }
      } finally {
        setLoaded(true);
      }
    };

    initProjects();
  }, [userId, loaded, createProject]);

  const structureTimer = useRef<NodeJS.Timeout | null>(null);
  const settingsTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!userId || !loaded || !currentProjectId) return;

    if (structureTimer.current) clearTimeout(structureTimer.current);

    const delay = isSwitchingProjectRef.current ? 500 : 400;

    structureTimer.current = setTimeout(async () => {
      if (isSwitchingProjectRef.current) return;
      if (deletedProjectIdsRef.current.has(currentProjectId)) return;
      setIsSaving(true);
      try {
        await saveCurrentProject();
      } catch (e) {
        console.error('❌ Ошибка автосохранения:', e);
      } finally {
        setIsSaving(false);
      }
    }, delay);

    return () => {
      if (structureTimer.current) clearTimeout(structureTimer.current);
    };
  }, [nodes, conns, mode, currentProjectId, userId, loaded, saveCurrentProject]);

  useEffect(() => {
    if (!userId || !loaded || !currentProjectId) return;
    if (isSwitchingProjectRef.current) return;

    if (settingsTimer.current) clearTimeout(settingsTimer.current);
    settingsTimer.current = setTimeout(async () => {
      if (isSwitchingProjectRef.current) return;
      if (deletedProjectIdsRef.current.has(currentProjectId)) return;
      await saveCurrentProject();
    }, 2000);

    return () => {
      if (settingsTimer.current) clearTimeout(settingsTimer.current);
    };
  }, [pan, zoom, currentProjectId, userId, loaded, saveCurrentProject]);

  const toSV = useCallback((clientX: number, clientY: number, svgRef: React.RefObject<SVGSVGElement | null>) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const r = svgRef.current.getBoundingClientRect();
    return { x: (clientX - r.left - pan.x) / zoom, y: (clientY - r.top - pan.y) / zoom };
  }, [pan, zoom]);

  const addNode = useCallback((kind: NodeKind, metadata?: Record<string, unknown>, svgRef?: React.RefObject<SVGSVGElement | null>) => {
    let x = (480 - pan.x) / zoom;
    let y = (280 - pan.y) / zoom;

    if (svgRef?.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const center = toSV(rect.left + rect.width/2, rect.top + rect.height/2, svgRef);
      x = center.x;
      y = center.y;
    }

    const n: FlowNode = {
      id: uid(),
      kind,
      label: KINDS[kind].label,
      prompt: (metadata?.prompt as string) || '',
      status: 'idle',
      x,
      y,
      metadata,
    };
    setNodes(p => [...p, n]);
    setSelected(n.id);
    return n.id;
  }, [pan, zoom, toSV]);

  const addNodeAtPosition = useCallback((kind: NodeKind, x: number, y: number, metadata?: Record<string, unknown>) => {
    const n: FlowNode = {
      id: uid(),
      kind,
      label: KINDS[kind].label,
      prompt: (metadata?.prompt as string) || '',
      status: 'idle',
      x,
      y,
      metadata,
    };
    setNodes(p => [...p, n]);
    return n.id;
  }, []);

  const delNode = useCallback((id: string) => {
    setNodes(p => p.filter(n => n.id !== id));
    setConns(p => p.filter(c => c.from !== id && c.to !== id));
    if (selected === id) setSelected(null);
  }, [selected]);

  const updateNode = useCallback((id: string, updates: Partial<FlowNode>) => {
    setNodes(p => p.map(n => n.id === id ? { ...n, ...updates } : n));
  }, []);

  const addConnection = useCallback((from: string, to: string) => {
    if (!conns.some(c => c.from === from && c.to === to)) {
      setConns(prev => [...prev, { from, to }]);
    }
  }, [conns]);

  const resetAll = useCallback((cancelAll?: () => void) => {
    cancelAll?.();
    const idleNodes: FlowNode[] = nodesRef.current.map(n => ({
      ...n,
      status: 'idle' as const,
      error: undefined,
      filename: undefined
    }));
    nodesRef.current = idleNodes;
    setNodes(idleNodes);
  }, []);

  const doneN = nodes.filter(n => n.status === 'done').length;
  const genN = nodes.filter(n => n.kind !== 'import').length;

  const switchProject = useCallback(async (projectId: string) => {
    console.log('🔄 Переключение на проект:', projectId);

    isSwitchingProjectRef.current = true;

    if (currentProjectIdRef.current && !deletedProjectIdsRef.current.has(currentProjectIdRef.current)) {
      await saveCurrentProject();
    }

    let project = projectsRef.current.find(p => p.id === projectId);

    if (!project && userId) {
      const localProjects = _localLoad(userId);
      project = localProjects.find(p => p.id === projectId);
      if (project) {
        setProjects(prev => prev.some(p => p.id === project!.id) ? prev : [...prev, project!]);
      }
    }

    if (!project) {
      toast.error('Проект не найден');
      return;
    }

    setCurrentProjectId(projectId);
    const safeNodes = (project.nodes || []).map((n: FlowNode) =>
      n.status === 'running' ? { ...n, status: 'idle' as NodeStatus } : n
    );
    setNodes(safeNodes);
    setConns(project.conns || []);
    setMode(['constructor','master'].includes(project.mode) ? project.mode : 'constructor');
    setPan(project.settings?.pan || { x: 80, y: 50 });
    setZoom(project.settings?.zoom || 0.88);
    setSelected(null);
    setEditNode(null);

    if (userId) {
      if (typeof window !== 'undefined') localStorage.setItem(LAST_ACTIVE_KEY(userId), projectId);
    }

    toast.success(`Переключено на "${project.name}"`);
    setTimeout(() => { isSwitchingProjectRef.current = false; }, 100);
  }, [userId, saveCurrentProject]);

  const deleteProject = useCallback(async (projectId: string) => {
    if (!userId) return;
    try {
      deletedProjectIdsRef.current.add(projectId);

      const remaining = projectsRef.current.filter(p => p.id !== projectId);
      projectsRef.current = remaining;
      setProjects(remaining);

      if (currentProjectIdRef.current === projectId) {
        currentProjectIdRef.current = null;
        setCurrentProjectId(null);
        nodesRef.current = [];
        connsRef.current = [];
        setNodes([]);
        setConns([]);

        if (remaining.length > 0) {
          await switchProject(remaining[0].id);
        } else {
          if (typeof window !== 'undefined') localStorage.removeItem(LAST_ACTIVE_KEY(userId));
        }
      }

      await deleteCanvasProject(projectId, userId);

      toast.success('Проект удалён');
    } catch (error) {
      console.error('❌ Ошибка удаления проекта:', error);
      toast.error('Не удалось удалить проект');
      deletedProjectIdsRef.current.delete(projectId);
    }
  }, [userId, switchProject]);

  const updateProject = useCallback(async (projectId: string, updates: Partial<CanvasProject>) => {
    if (!userId) return;

    const existing = projectsRef.current.find(p => p.id === projectId);
    if (existing) {
      const hasChanges = Object.keys(updates).some(
        key => (existing as unknown as Record<string, unknown>)[key] !== (updates as unknown as Record<string, unknown>)[key]
      );
      if (!hasChanges) return;
    }

    setProjects(prev => prev.map(p =>
      p.id === projectId ? { ...p, ...updates, updated_at: new Date().toISOString() } : p
    ));

    if (projectId === currentProjectId) {
      if (updates.mode) setMode(updates.mode);
    }

    if (existing) {
      await saveCanvasProject(userId, { ...existing, ...updates });
    }
  }, [userId, currentProjectId]);

  return {
    currentProjectId,
    projects,
    mode, setMode,
    nodes, setNodes,
    conns, setConns,
    selected, setSelected,
    pan, setPan,
    zoom, setZoom,
    editNode, setEditNode,
    runningAll, setRunAll,
    isPanningEnabled,
    dragging,
    panning,
    drawing,
    draft, setDraft,
    toSV,
    addNode,
    addNodeAtPosition,
    delNode,
    updateNode,
    addConnection,
    resetAll,
    doneN,
    genN,
    isSaving,
    createProject,
    createProjectWithNodes,
    switchProject,
    deleteProject,
    updateProject,
    saveCurrentProject,
    nodesRef,
    connsRef,
  };
}

// ─── Syllabus Analysis ────────────────────────────────────────────────────────

export async function analyzeSyllabusText(rawText: string): Promise<SyllabusData> {
  const prompt = `Проанализируй текст силлабуса и определи какие типы занятий есть.
Текст (первые 3000 символов): ${rawText.slice(0, 3000)}

Верни ТОЛЬКО JSON без markdown:
{
  "discipline": "название дисциплины",
  "hasLectures": true/false,
  "hasLabs": true/false,
  "hasPracticals": true/false,
  "hasSRO": true/false,
  "hasSROP": true/false,
  "hasKP": true/false,
  "hours": число или null
}

hasKP=true если есть курсовой проект/работа, hasSROP=true если есть СРОП.`;

  try {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

    const response = await fetch(`${API_BASE}/ai-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        systemPrompt: 'Ты - эксперт по анализу учебных документов. Отвечай только валидным JSON.',
        maxTokens: 400,
      }),
    });

    if (!response.ok) throw new Error('API error');

    const data = await response.json();
    const text = data.content;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON');
    const parsed = JSON.parse(jsonMatch[0]) as {
      discipline: string;
      hasLectures: boolean;
      hasLabs: boolean;
      hasPracticals: boolean;
      hasSRO: boolean;
      hasSROP: boolean;
      hasKP: boolean;
      hours?: number;
    };

    return {
      discipline: parsed.discipline || 'Дисциплина',
      hasLectures: !!parsed.hasLectures,
      hasLabs: !!parsed.hasLabs,
      hasPracticals: !!parsed.hasPracticals,
      hasSRO: !!parsed.hasSRO,
      hasSROP: !!parsed.hasSROP,
      hasKP: !!parsed.hasKP,
      hours: parsed.hours || undefined,
      rawText,
    };
  } catch (e) {
    console.warn('AI анализ недоступен, используем regex:', e);
    return regexAnalyzeSyllabus(rawText);
  }
}

export function regexAnalyzeSyllabus(rawText: string): SyllabusData {
  const t = rawText;

  // Занятие считается присутствующим только если найдены реальные темы/задания,
  // а не просто упоминание слова в тексте.

  // Лекции: должна быть нумерованная тема в разделе лекций
  const hasLectures = (
    /^\d+\.\s+.{10,}/m.test(t) &&
    (/лекци[ия]/i.test(t)) &&
    // Исключаем случай когда "лекции" встречается только в заголовке таблицы
    (/^\d+\.\s+(?!лаборатор|практич|семинар)/mi.test(t))
  ) && (
    // Проверяем: есть нумерованные темы после слова "лекции" в тексте
    /(?:лекци[ия][^\n]{0,50}\n[\s\S]{0,200}?\d+\.\s+[А-ЯЁа-яёA-Za-z]{3})/i.test(t) ||
    // Или в таблице есть ненулевое значение в столбце лекций
    /\d+\.\s+.+\s+[1-9]\d*\s+[1-9\-]/m.test(t)
  );

  // Лабораторные: должны быть явные темы лаб. работ
  const hasLabs = (
    /лабораторная\s+работа\s+[№#]?\d/i.test(t) ||
    /^ЛР\s+[№#]?\d/im.test(t) ||
    /^ЗЖ\s+[№#]?\d/im.test(t) ||
    // Тема в разделе с подзаголовком "Лабораторные работы"
    /лабораторные\s+работы[\s\S]{0,100}?\d+\.\s+[А-ЯЁа-яё]/i.test(t)
  );

  // Практические: должны быть явные темы практик или семинаров
  const pracMatch = t.match(/практическое\s+занятие\s+[№#]?\d/i)
    || t.match(/практика\s+[№#]?\d/i)
    || t.match(/практические\s+занятия[\s\S]{0,100}?\d+\.\s+[А-ЯЁа-яё]/i)
    || t.match(/семинарские\s+занятия[\s\S]{0,100}?\d+\.\s+[А-ЯЁа-яё]/i);
  const hasPracticals = !!pracMatch;

  // СРОП: должен быть раздел 12 с реальными темами
  const hasSROP = (
    /12[\s.]+[Тт]ематический\s+план\s+самостоятельной/i.test(t) ||
    /12[\s.]+Оқытушымен/i.test(t) ||
    /12[\s.]+СОӨЖ/i.test(t)
  ) && /^\d+\.\s+.{5,}/m.test(t);

  // СРО: должен быть раздел 11 с реальными заданиями/вопросами
  const hasSRO = (
    /11[\s.]+[Тт]ем[ыа]\s+(?:контрольных|для\s+СРО)/i.test(t) ||
    /11[\s.]+[Зз]адания\s+(?:для\s+)?СРО/i.test(t) ||
    /11[\s.]+ОӨЖ/i.test(t)
  ) && /^\d+[.)]\s+.{5,}/m.test(t);

  const hasKP = (
    /10[\s.]+[Тт]ематик[аи]\s+(?:и\s+варианты\s+)?(?:тем\s+)?курсов/i.test(t) ||
    /10[\s.]+[Вв]арианты\s+тем\s+курсов/i.test(t) ||
    /курсов[ао][йе]\s+(?:проект|работ)/i.test(t) && /^\d+\.\s+.{5,}/m.test(t)
  );

  let hours: number | undefined;
  const hoursMatch = t.match(/[Ии]того[,\s]*часов[^0-9]*([0-9]+)/i)
    || t.match(/итого[:\s]+([0-9]{2,3})\s*$/im)
    || t.match(/\b150\b|\b180\b|\b120\b|\b108\b|\b90\b/);
  if (hoursMatch) hours = parseInt(hoursMatch[1] || hoursMatch[0]);

  return {
    discipline: extractDisciplineFromText(t),
    hasLectures,
    hasLabs,
    hasPracticals,
    hasSRO,
    hasSROP,
    hasKP,
    hours,
    rawText: t,
  };
}

function extractDisciplineFromText(text: string): string {
  const patterns = [
    /дисциплин[аеуы]\s+[A-Z]{2,4}\s+\d+\s+([^\n<]{3,80})/i,
    /SYLLABUS\)\s+Дисциплина\s+([^\n<«»"]{3,80})/i,
    /дисциплин[аеуы][\s:«"']+([^«»"'\n<]{3,60})/i,
    /[A-Z]{2,4}\s+\d{4}\s+([А-ЯЁа-яё][^\n<]{3,60})/,
    /<title[^>]*>([^<]{3,80})<\/title>/i,
    /силлабус[\s\nпо:—–]+([^\n<]{3,60})/i,
  ];

  for (const p of patterns) {
    const m = text.match(p);
    if (m && m[1]) {
      const result = m[1].trim()
        .replace(/["""»«']/g, '')
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .replace(/^(по|дисциплина|рабочая|учебная|программа)\s+/i, '')
        .trim();
      if (result.length > 2 && !/^(Print|Linux|html|css)/i.test(result)) {
        return result.slice(0, 60);
      }
    }
  }
  return 'Дисциплина';
}

// ─── AI Functions ──────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function callOpenRouter(prompt: string, systemPrompt: string = '', maxTokens: number = 1000) {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  console.log('📤 Отправка запроса к AI proxy...');
  console.log('URL:', `${API_BASE}/ai-proxy`);
  console.log('Prompt (первые 100 символов):', prompt.substring(0, 100));

  try {
    const response = await fetch(`${API_BASE}/ai-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        systemPrompt,
        maxTokens,
      }),
    });

    console.log('📥 Статус ответа:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Текст ошибки:', errorText);
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Успешный ответ, длина:', data.content?.length);

    return data.content;
  } catch (error) {
    console.error('❌ Ошибка вызова API:', error);
    throw error;
  }
}

export async function parsePromptWithAI(prompt: string, type: DocumentType): Promise<Partial<SyllabusData>> {
  const systemPrompt = `Ты - ассистент по извлечению данных из текста для создания учебных документов.
Верни ТОЛЬКО JSON без пояснений и markdown.`;

  const userPrompt = `Извлеки данные из запроса для создания ${type === 'calendar' ? 'календарного плана' : 'силлабуса'}.

Запрос: "${prompt}"

Верни JSON в формате:
{
  "discipline": "название дисциплины",
  "hours": число часов (если есть),
  ${type === 'calendar' ? `
  "group": "название группы (если есть)",
  "teacher": "ФИО преподавателя (если есть)",
  "weeks": число недель (если есть),
  "controlType": "экзамен/зачет (если есть)",
  "semester": "семестр (если есть)",
  ` : `
  "hasLectures": true/false,
  "hasLabs": true/false,
  "hasPracticals": true/false,
  "hasSRO": true/false,
  "hasSROP": true/false,
  "hasKP": true/false,
  `}
  "topics": ["тема 1", "тема 2", ...] (если есть)
}

Если данных нет, ставь null или пустой массив.`;

  try {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

    const response = await fetch(`${API_BASE}/ai-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: userPrompt,
        systemPrompt,
        maxTokens: 500,
      }),
    });

    if (!response.ok) throw new Error('API error');

    const data = await response.json();
    const responseText = data.content;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('Ошибка парсинга промпта:', e);
  }
  return {};
}

// ─── Контекстный резолвер цепочки блоков ─────────────────────────────────────

export interface NodeSource {
  node: FlowNode;
  syllabus?: SyllabusData;
  generatedTopics?: string[];
  generatedContext?: string;
  nodeFileData?: NodeFileData;
}

export function getNodeSources(
  nodeId: string,
  nodes: FlowNode[],
  conns: Connection[]
): NodeSource[] {
  const parentIds = conns.filter(c => c.to === nodeId).map(c => c.from);
  const sources: (NodeSource | null)[] = parentIds.map(pid => {
    const n = nodes.find(x => x.id === pid);
    if (!n) return null;
    return {
      node: n,
      syllabus: n.kind === 'import' ? n.syllabusData : undefined,
      generatedTopics: n.generatedTopics,
      generatedContext: n.generatedContext,
      nodeFileData: n.nodeFileData,
    };
  });
  return sources.filter((s): s is NodeSource => s !== null);
}

export function findConnectedSyllabus(
  nodeId: string,
  nodes: FlowNode[],
  conns: Connection[],
  depth = 0
): SyllabusData | null {
  if (depth > 5) return null;
  const parentIds = conns.filter(c => c.to === nodeId).map(c => c.from);
  for (const pid of parentIds) {
    const pNode = nodes.find(n => n.id === pid);
    if (!pNode) continue;
    if (pNode.kind === 'import' && pNode.syllabusData) return pNode.syllabusData;
    const found = findConnectedSyllabus(pid, nodes, conns, depth + 1);
    if (found) return found;
  }
  return null;
}

export function resolveGenerationContext(
  nodeId: string,
  nodes: FlowNode[],
  conns: Connection[]
): {
  syllabus: SyllabusData | null;
  sources: NodeSource[];
  discipline: string;
  enrichedContext: string;
  lectureTopics: string[];
  labTopics: string[];
  practicalTopics: string[];
  sropTopics: string[];
  kpTopics: string[];
  sroTasks: string[];
  hasNodeChain: boolean;
  hasNodeChainAny: boolean;
  sourceKind: NodeKind | null;
} {
  const syllabus = findConnectedSyllabus(nodeId, nodes, conns);
  const sources = getNodeSources(nodeId, nodes, conns);

  const chainSources = sources.filter(s => s.node.kind !== 'import');
  const hasNodeChain = chainSources.length > 0 && chainSources.some(s =>
    (s.nodeFileData && (s.nodeFileData.allTopics?.length || 0) > 0) ||
    (s.generatedTopics && s.generatedTopics.length > 0)
  );
  const hasNodeChainAny = chainSources.length > 0;
  const sourceKind = chainSources[0]?.node?.kind ?? null;

  let lectureTopics: string[] = [];
  let labTopics: string[] = [];
  let practicalTopics: string[] = [];
  let sropTopics: string[] = [];
  let kpTopics: string[] = [];
  let sroTasks: string[] = [];
  const contextParts: string[] = [];

  for (const src of sources) {
    if (src.syllabus) {
      if (src.syllabus.lectureTopics?.length)   lectureTopics  = [...lectureTopics,  ...src.syllabus.lectureTopics];
      if (src.syllabus.labTopics?.length)        labTopics      = [...labTopics,      ...src.syllabus.labTopics];
      if (src.syllabus.practicalTopics?.length)  practicalTopics = [...practicalTopics, ...src.syllabus.practicalTopics];
      if (src.syllabus.sropTopics?.length)       sropTopics     = [...sropTopics,     ...src.syllabus.sropTopics];
      else if (src.syllabus.sropTable?.length)   sropTopics     = [...sropTopics,     ...src.syllabus.sropTable.map(t => t.theme)];
      if (src.syllabus.kpTopics?.length)         kpTopics       = [...kpTopics,       ...src.syllabus.kpTopics];
      if (src.syllabus.sroTasks?.length)         sroTasks       = [...sroTasks,       ...src.syllabus.sroTasks];
      if (src.syllabus.rawText)                  contextParts.push(src.syllabus.rawText.slice(0, 6000));
    } else {
      const kind = src.node.kind;
      const fd = src.nodeFileData;

      let fileTopics: string[] = [];
      if (fd) {
        switch (kind) {
          case 'lectures':   fileTopics = fd.lectureTopics   || fd.allTopics || []; break;
          case 'labs':       fileTopics = fd.labTopics       || fd.allTopics || []; break;
          case 'practicals': fileTopics = fd.practicalTopics || fd.allTopics || []; break;
          case 'sro':        fileTopics = fd.sroTasks        || fd.allTopics || []; break;
          case 'srop':       fileTopics = fd.sropTopics      || fd.allTopics || []; break;
          case 'kp':         fileTopics = fd.kpTopics        || fd.allTopics || []; break;
          default:           fileTopics = fd.allTopics       || []; break;
        }
      }

      const topics = fileTopics.length > 0 ? fileTopics : (src.generatedTopics || []);
      const ctx = fd?.rawText ? fd.rawText.slice(0, 4000) : (src.generatedContext || '');

      if (kind === 'lectures')   lectureTopics   = [...lectureTopics,   ...topics];
      if (kind === 'labs')       labTopics        = [...labTopics,       ...topics];
      if (kind === 'practicals') practicalTopics  = [...practicalTopics, ...topics];
      if (kind === 'srop')       sropTopics       = [...sropTopics,      ...topics];
      if (kind === 'kp')         kpTopics         = [...kpTopics,        ...topics];
      if (kind === 'sro' || kind === 'sro_full') sroTasks = [...sroTasks, ...topics];
      if (kind === 'calendar' && topics.length > 0) lectureTopics = [...lectureTopics, ...topics];

      if (ctx) contextParts.push(`\n=== СОДЕРЖИМОЕ ФАЙЛА "${KINDS[kind]?.label}" ===\n${ctx}`);
      if (topics.length) {
        contextParts.push(`\n=== ТЕМЫ ИЗ БЛОКА "${KINDS[kind]?.label}" ===\n${topics.join('\n')}`);
      }
    }
  }

  if (lectureTopics.length)   contextParts.push(`\n\n=== ТЕМЫ ЛЕКЦИЙ ИЗ СИЛЛАБУСА ===\n${lectureTopics.join('\n')}`);
  if (labTopics.length)       contextParts.push(`\n\n=== ТЕМЫ ЛАБОРАТОРНЫХ РАБОТ ИЗ СИЛЛАБУСА ===\n${labTopics.join('\n')}`);
  if (practicalTopics.length) contextParts.push(`\n\n=== ТЕМЫ ПРАКТИЧЕСКИХ ЗАНЯТИЙ ИЗ СИЛЛАБУСА ===\n${practicalTopics.join('\n')}`);
  if (sroTasks.length)        contextParts.push(`\n\n=== ЗАДАНИЯ СРО ИЗ СИЛЛАБУСА ===\n${sroTasks.join('\n')}`);
  if (sropTopics.length)      contextParts.push(`\n\n=== ТЕМЫ СРОП ИЗ СИЛЛАБУСА ===\n${sropTopics.join('\n')}`);
  if (kpTopics.length)        contextParts.push(`\n\n=== ТЕМЫ КУРСОВЫХ ПРОЕКТОВ ИЗ СИЛЛАБУСА ===\n${kpTopics.join('\n')}`);

  const enrichedContext = contextParts.join('').slice(0, 12000);

  const discipline = syllabus?.discipline
    || chainSources[0]?.nodeFileData?.discipline
    || chainSources[0]?.node?.label
    || 'Дисциплина';

  return {
    syllabus, sources, discipline, enrichedContext,
    lectureTopics, labTopics, practicalTopics, sropTopics, kpTopics, sroTasks,
    hasNodeChain,
    hasNodeChainAny,
    sourceKind,
  };
}

export function canGenerateFromSyllabus(kind: NodeKind, syllabusData: SyllabusData): boolean {
  switch (kind) {
    case 'lectures':          return syllabusData.hasLectures;
    case 'labs':              return syllabusData.hasLabs;
    case 'practicals':        return syllabusData.hasPracticals;
    case 'sro':               return syllabusData.hasSRO;
    case 'srop':              return syllabusData.hasSROP;
    case 'kp':                return syllabusData.hasKP;
    case 'calendar':          return true;
    case 'sro_full':          return true;
    case 'boundary_control':  return true;
    case 'final_control':     return true;
    case 'excel':             return true; // всегда доступен
    default:                  return false;
  }
}

export function useNodeExecution() {
  const abortControllerRef = useRef<AbortController | null>(null);

  const cancelAll = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      console.log('🛑 Все запросы к API отменены (cancelAll)');
    }
    abortControllerRef.current = null;
  }, []);

  const runNode = useCallback(async (
    id: string,
    nodes: FlowNode[],
    conns: Connection[],
    updateNode: (id: string, updates: Partial<FlowNode>) => void,
    signal?: AbortSignal,
    onSuccess?: () => void,
    onLimitExceeded?: () => void,
    userId?: string
  ) => {
    const n = nodes.find(x => x.id === id);
    if (!n || n.kind === 'import') return;
    if (n.status === 'running') return;
    if (signal?.aborted) return;

    const ctx = resolveGenerationContext(id, nodes, conns);
    const {
      syllabus, hasNodeChainAny, sourceKind, enrichedContext,
      lectureTopics, labTopics, practicalTopics, sropTopics, kpTopics, sroTasks
    } = ctx;

    if (syllabus && !hasNodeChainAny && n.kind !== 'sro_full') {
      if (!canGenerateFromSyllabus(n.kind, syllabus)) {
        toast(`⚠️ В силлабусе «${syllabus.discipline}» нет ${KINDS[n.kind].label.toLowerCase()}. Генерация пропущена.`);
        return;
      }
    }

    updateNode(id, { status: 'running', error: undefined });
    const t0 = Date.now();

    try {
      let generatedTopics: string[] = [];
      const generatedContext: string = '';

      const discipline = ctx.discipline || n.prompt || n.label;

      const doGen = async (endpoint: string, body: object): Promise<Response> => {
        const res = await apiFetch(
          `${API_BASE}${endpoint}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal,
          },
          userId
        );
        if (!res.ok) throw new Error(`Ошибка сервера: ${res.status}`);
        return res;
      };

      const extractTopicsFromResponse = (res: Response): string[] => {
        try {
          const header = res.headers.get('X-Generated-Topics');
          if (header) return JSON.parse(decodeURIComponent(header));
        } catch {}
        return [];
      };

      let res: Response;

      if (n.kind === 'calendar') {
        res = await doGen('/generate-calendar-from-prompt', {
          prompt: discipline,
          syllabusContext: enrichedContext,
          lectureTopics,
          labTopics,
          practicalTopics,
          sropTopics,
          sourceKind: hasNodeChainAny ? sourceKind : null,
        });

      } else if (n.kind === 'sro_full') {
        // sro_full: только темы из силлабуса, без AI-содержания
        res = await doGen('/generate-sro-full', {
          subject:      discipline,
          syllabusContext: enrichedContext,
          teacher:      syllabus?.teacher     || '',
          department:   '',
          program:      syllabus?.program     || '',
          sropTable:    syllabus?.sropTable   || [],
          sroTasks,
          sroQuestions: syllabus?.sroQuestions || [],
          sourceKind: hasNodeChainAny ? sourceKind : null,
        });

      } else if (n.kind === 'boundary_control') {
        // boundary_control: генерируем на основе ВСЕХ тем (лекции + лабы + практика)
        res = await doGen('/generate-component', {
          type: 'boundary_control',
          discipline,
          syllabusContext: enrichedContext,
          prompt: n.prompt || '',
          lectureTopics,
          labTopics,
          practicalTopics,
          teacher:        syllabus?.teacher        || '',
          disciplineCode: syllabus?.disciplineCode || '',
          sourceKind: hasNodeChainAny ? sourceKind : null,
        });

      } else if (n.kind === 'final_control') {
        // final_control: генерируем на основе ВСЕХ тем (лекции + лабы + практика)
        res = await doGen('/generate-component', {
          type: 'final_control',
          discipline,
          syllabusContext: enrichedContext,
          prompt: n.prompt || '',
          lectureTopics,
          labTopics,
          practicalTopics,
          teacher:        syllabus?.teacher        || '',
          disciplineCode: syllabus?.disciplineCode || '',
          sourceKind: hasNodeChainAny ? sourceKind : null,
        });

      } else if (['lectures', 'labs', 'practicals', 'sro', 'srop', 'kp'].includes(n.kind)) {
        // kp: topicsOnly всегда true (только темы из силлабуса, AI не используется)
        // sro: topicsOnly управляется generationMode как обычно
        const forceTopicsOnly = n.kind === 'kp';
        res = await doGen('/generate-component', {
          type: n.kind,
          discipline,
          syllabusContext: enrichedContext,
          prompt: n.prompt || '',
          lectureTopics,
          labTopics,
          practicalTopics,
          sropTopics,
          kpTopics,
          sroTasks,
          teacher:          syllabus?.teacher          || '',
          disciplineCode:   syllabus?.disciplineCode   || '',
          introduction:     syllabus?.introduction     || '',
          goal:             syllabus?.goal             || '',
          tasks:            syllabus?.tasks            || '',
          learningResults:  syllabus?.learningResults  || '',
          thematicPlanText: syllabus?.thematicPlanText || '',
          thematicPlanRows: syllabus?.thematicPlanRows || null,
          topicsOnly: forceTopicsOnly || (n.generationMode ?? 'full') === 'topics',
          sourceKind: hasNodeChainAny ? sourceKind : null,
          hasNodeChain: hasNodeChainAny,
        });

      } else if (n.kind === 'excel') {
        // excel: AI генерирует JSON-схему → бэкенд строит .xlsx
        const excelTemplate = n.metadata?.excelTemplate || 'custom';
        res = await doGen('/generate-excel', {
          prompt:           n.prompt || '',
          template:         excelTemplate,
          discipline,
          teacher:          syllabus?.teacher || '',
          group:            (syllabus as unknown as { group?: string })?.group || '',
          lectureTopics,
          labTopics,
          practicalTopics,
          sroTasks,
        });

      } else {
        toast('🚧 Этот тип блока пока не поддерживает генерацию');
        updateNode(id, { status: 'idle' });
        return;
      }

      generatedTopics = extractTopicsFromResponse(res);

      const blob = new Blob([await res.arrayBuffer()]);

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      // .xlsx для excel, .docx для всего остального
      const ext = n.kind === 'excel' ? 'xlsx' : 'docx';
      const fname = `${KINDS[n.kind].label}_${discipline.slice(0, 18).trim()}.${ext}`;
      a.href = url; a.download = fname; a.click();
      URL.revokeObjectURL(url);

      updateNode(id, {
        status: 'done',
        filename: fname,
        duration: Date.now() - t0,
        generatedTopics: generatedTopics.length > 0 ? generatedTopics : undefined,
        generatedContext: generatedContext || undefined,
      });

      const childIds = conns.filter(c => c.from === id).map(c => c.to);
      const childNodes = childIds.map(cid => nodes.find(nx => nx.id === cid)).filter((n): n is FlowNode => n !== undefined);
      const readyChildren = childNodes.filter(c => c.kind !== 'import' && c.status !== 'done');

      if (readyChildren.length > 0) {
        const labels = readyChildren.map(c => KINDS[c.kind]?.label).join(', ');
        toast.success(`✅ ${fname}\n→ Готово к генерации: ${labels}`, { duration: 4000 });
      } else {
        toast.success(`✅ ${fname}`);
      }

      onSuccess?.();
    } catch (err: unknown) {
      const isCancelled =
        err instanceof Error && (
          (err as NodeJS.ErrnoException)?.code === 'ERR_CANCELED' ||
          err?.name === 'CanceledError' ||
          err?.name === 'AbortError' ||
          signal?.aborted
        );

      if (isCancelled) {
        updateNode(id, { status: 'idle', error: undefined });
      } else if (err instanceof GlobalLimitExceededError) {
        updateNode(id, { status: 'error', error: 'Сервис недоступен' });
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('hivers:global-limit-exceeded', { detail: { globalUsed: err.globalUsed, globalLimit: err.globalLimit } }));
        }
      } else if (err instanceof LimitExceededError) {
        updateNode(id, { status: 'error', error: 'Лимит генераций исчерпан' });
        onLimitExceeded?.();
      } else if (err instanceof AuthRequiredError) {
        updateNode(id, { status: 'error', error: 'Необходима авторизация' });
        window.dispatchEvent(new CustomEvent('hivers:open-auth', { detail: { mode: 'login' } }));
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
        updateNode(id, { status: 'error', error: errorMessage });
        toast.error('Ошибка: ' + errorMessage);
      }
    }
  }, []);

  const topoSort = useCallback((nodes: FlowNode[], conns: Connection[]): FlowNode[] => {
    const nonImport = nodes.filter(n => n.kind !== 'import');
    const ids = new Set(nonImport.map(n => n.id));
    const edges = conns.filter(c => ids.has(c.from) && ids.has(c.to));

    const inDegree = new Map<string, number>();
    const adjList = new Map<string, string[]>();
    for (const n of nonImport) { inDegree.set(n.id, 0); adjList.set(n.id, []); }
    for (const e of edges) {
      inDegree.set(e.to, (inDegree.get(e.to) || 0) + 1);
      adjList.get(e.from)?.push(e.to);
    }

    const queue = nonImport.filter(n => (inDegree.get(n.id) || 0) === 0);
    const sorted: FlowNode[] = [];
    while (queue.length > 0) {
      const n = queue.shift()!;
      sorted.push(n);
      for (const child of (adjList.get(n.id) || [])) {
        const deg = (inDegree.get(child) || 0) - 1;
        inDegree.set(child, deg);
        if (deg === 0) {
          const childNode = nodes.find(x => x.id === child);
          if (childNode) queue.push(childNode);
        }
      }
    }
    const sortedIds = new Set(sorted.map(n => n.id));
    for (const n of nonImport) { if (!sortedIds.has(n.id)) sorted.push(n); }
    return sorted;
  }, []);

  const runAll = useCallback(async (
    getNodes: () => FlowNode[],
    getConns: () => Connection[],
    updateNode: (id: string, updates: Partial<FlowNode>) => void,
    setRunAll: Dispatch<SetStateAction<boolean>>,
    onSuccess?: () => void,
    onLimitExceeded?: () => void,
    userId?: string
  ) => {
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const { signal } = controller;
    let limitHit = false;

    setRunAll(true);
    try {
      const sorted = topoSort(getNodes(), getConns());
      for (const n of sorted) {
        if (signal.aborted || limitHit) break;
        await runNode(
          n.id,
          getNodes(),
          getConns(),
          updateNode,
          signal,
          onSuccess,
          () => { limitHit = true; onLimitExceeded?.(); },
          userId
        );
      }
      if (!signal.aborted && !limitHit) {
        toast.success('🎉 Все шаги выполнены!');
      }
    } finally {
      setRunAll(false);
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  }, [runNode, topoSort]);

  return { runNode, runAll, cancelAll, topoSort };
}

// ─── Master Mode ─────────────────────────────────────────────────────────────

export function useMasterMode() {
  const [masterStep, setMasterStep] = useState(0);
  const [selectedBlocks, setSelectedBlocks] = useState<NodeKind[]>(['import', 'calendar', 'lectures', 'sro']);
  const [isGenerating, setIsGenerating] = useState(false);

  const masterAnswers: MasterAnswers = {
    discipline: '', level: 'bachelor', hours: 108,
    classTypes: { lectures: false, labs: false, practicals: false, sro: false },
    details: '',
  };

  const handleMasterNext = useCallback(() => {
    if (masterStep < 1) setMasterStep(masterStep + 1);
  }, [masterStep]);

  const handleMasterPrev = useCallback(() => {
    if (masterStep > 0) setMasterStep(masterStep - 1);
  }, [masterStep]);

  const toggleBlock = useCallback((kind: NodeKind) => {
    if (kind === 'import') return;
    setSelectedBlocks(prev =>
      prev.includes(kind) ? prev.filter(k => k !== kind) : [...prev, kind]
    );
  }, []);

 const generateGraphFromMaster = useCallback(async (
  addNodeAtPosition: (kind: NodeKind, x: number, y: number, metadata?: Record<string, unknown>) => string,
  setNodes: Dispatch<SetStateAction<FlowNode[]>>,
  setConns: Dispatch<SetStateAction<Connection[]>>,
  setMode: Dispatch<SetStateAction<CanvasMode>>,
  createProject?: (name: string, description?: string, mode?: CanvasMode) => Promise<string>
) => {
  setIsGenerating(true);
  try {
    if (createProject) {
      const blockLabels = selectedBlocks
        .filter(k => k !== 'import')
        .map(k => {
          // Type assertion to ensure k is treated as NodeKind
          const nodeKind = k as NodeKind;
          return KINDS[nodeKind]?.label ?? k;
        })
        .join(', ');
      const projectName = 'Новый проект';
      const description = `Создан через Мастер. Блоки: ${blockLabels}.`;
      const newProjectId = await createProject(projectName, description, 'constructor');
      if (!newProjectId) {
        toast.error('Не удалось создать проект');
        setIsGenerating(false);
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    const newNodes: FlowNode[] = [];
    const newConns: Connection[] = [];

    const makeNode = (kind: NodeKind, x: number, y: number): string => {
      const id = uid();
      newNodes.push({
        id, kind,
        label: KINDS[kind].label,
        prompt: '',
        status: 'idle',
        x, y,
      });
      return id;
    };

    const importId = makeNode('import', 60, 200);

    const orderedKinds: NodeKind[] = [
      'calendar', 'lectures', 'labs', 'practicals',
      'sro', 'srop', 'kp', 'sro_full', 'boundary_control', 'final_control', 'excel',
    ].filter(k => selectedBlocks.includes(k as NodeKind)) as NodeKind[];

    const COL1_X = 380;
    const COL2_X = 660;
    const START_Y = 80;
    const STEP_Y = 115;

    orderedKinds.forEach((kind, i) => {
      const col = i % 2 === 0 ? COL1_X : COL2_X;
      const row = Math.floor(i / 2);
      const nodeId = makeNode(kind, col, START_Y + row * STEP_Y);
      newConns.push({ from: importId, to: nodeId });
    });

    setNodes(newNodes);
    setConns(newConns);
    setMode('constructor');
    toast.success(`🎉 Проект создан! Загрузите силлабус в блок Импорт.`);
  } catch (err) {
    console.error('Ошибка генерации мастера:', err);
    toast.error('Ошибка при создании графа');
  } finally {
    setIsGenerating(false);
  }
}, [selectedBlocks]);

  return {
    masterStep, setMasterStep,
    masterAnswers,
    selectedBlocks,
    toggleBlock,
    isGenerating,
    handleMasterNext,
    handleMasterPrev,
    handleMasterInputChange: () => {},
    handleClassTypeToggle: () => {},
    generateGraphFromMaster,
  };
}