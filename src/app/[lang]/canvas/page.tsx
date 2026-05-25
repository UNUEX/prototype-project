//app/[lang]/canvas/page.tsx
'use client';

/**
 * app/canvas/page.tsx
 * HiVersity Canvas — Конструктор
 *
 * ИЗМЕНЕНИЯ:
 * - Удалён мастер-режим (useMasterMode, MasterModeUI, handleMasterGenerate)
 * - Удалён useSearchParams для mode=master
 * - Добавлено: при ?from=master читает sessionStorage и инициализирует ноды
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useTranslation } from '@/hooks/useTranslation';

import { useAuth } from '@/hooks/useAuth';
import { useGenerationLimit } from '@/hooks/useGenerationLimit';
import { openLimitModal } from '@/components/LimitModal';

import {
  useCanvasState,
  findConnectedSyllabus,
  KINDS,
  MODES,
  API_BASE,
  useNodeExecution,
  NodeKind,
  FlowNode,
  Connection,
} from './page.functional';

import {
  TopBar,
  Sidebar,
  CanvasSVG,
  Footer,
  SyllabusPanel,
  NodeInfoPanel,
  styles,
} from './page.design';

import { DocumentEditorPanel } from './components/DocumentEditorPanel';

export default function CanvasPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const language = (params?.lang as string) || 'ru';
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { t: _t } = useTranslation();

  const { user, loading: authLoading } = useAuth();
  const userId = authLoading ? undefined : (user?.id ?? '');

  const {
    remaining,
    used,
    dailyLimit,
    isReady: limitReady,
    incrementOptimistic,
    refetch: refetchLimit,
  } = useGenerationLimit();

  const canvas = useCanvasState(userId);
  const execution = useNodeExecution();

  const svgRef = useRef<SVGSVGElement | null>(null);
  const syllabusInputRef = useRef<HTMLInputElement | null>(null);
  const nodeFileInputRef = useRef<HTMLInputElement | null>(null);

  const [syllabusPanel, setSyllabusPanel] = useState<string | null>(null);
  const [nodeInfoPanel, setNodeInfoPanel] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorExpanded, setEditorExpanded] = useState(false);

  // ─── Auth guard ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      toast.error('Для работы с Canvas необходима авторизация');
      window.dispatchEvent(new CustomEvent('hivers:open-auth', { detail: { mode: 'login' } }));
      router.replace(`/${language}`);
    }
  }, [user, authLoading, router, language]);

  // ─── Read project from ?from=master (sessionStorage) ─────────────────────
  // Ждём пока auth загрузится и пользователь авторизован
  useEffect(() => {
    if (authLoading || !user) return;

    const fromMaster = searchParams.get('from') === 'master';
    if (!fromMaster) return;

    const rawNodes = sessionStorage.getItem('master_nodes');
    const rawConns = sessionStorage.getItem('master_conns');
    const masterName = sessionStorage.getItem('master_project_name') || 'Новый проект';

    // Сразу очищаем sessionStorage чтобы не читать повторно
    sessionStorage.removeItem('master_nodes');
    sessionStorage.removeItem('master_conns');
    sessionStorage.removeItem('master_project_name');

    if (!rawNodes) return;

    const nodes: FlowNode[] = JSON.parse(rawNodes);
    const conns: Connection[] = rawConns ? JSON.parse(rawConns) : [];

    const init = async () => {
      try {
        const projectId = await canvas.createProject(masterName, 'Создан через Мастер', 'constructor');
        if (!projectId) return;

        // updateProject сохраняет ноды/конны напрямую в Supabase через saveCanvasProject
        // Это тот же механизм что используется при обычном редактировании проекта
        await canvas.updateProject(projectId, { nodes, conns, status: 'in_progress' });

        // setNodes/setConns обновляют локальный state для отображения на канве
        canvas.setNodes(nodes);
        canvas.setConns(conns);

        toast.success(`🎉 Проект «${masterName}» создан! Загрузите силлабус.`);
      } catch (e) {
        console.error('Ошибка создания проекта из мастера:', e);
        toast.error('Не удалось создать проект');
      }
    };

    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, searchParams]);

  // ─── Canvas interaction handlers ─────────────────────────────────────────
  const onNodeDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    canvas.setSelected(id);
    const n = canvas.nodes.find(x => x.id === id)!;
    const sv = canvas.toSV(e.clientX, e.clientY, svgRef);
    canvas.dragging.current = { id, ox: sv.x - n.x, oy: sv.y - n.y };
    canvas.isPanningEnabled.current = false;
  };

  const onNodeClick = (id: string) => {
    canvas.setSelected(id);
    const node = canvas.nodes.find(n => n.id === id);
    if (node?.kind === 'import' && node.syllabusData) {
      setSyllabusPanel(id);
      setNodeInfoPanel(null);
    } else if (node && node.kind !== 'import') {
      setNodeInfoPanel(id);
      setSyllabusPanel(null);
    }
  };

  const onPortDown = (e: React.MouseEvent, id: string, s: 'l' | 'r') => {
    e.stopPropagation();
    const n = canvas.nodes.find(x => x.id === id)!;
    const p = s === 'r' ? { x: n.x + 240, y: n.y + 45 } : { x: n.x, y: n.y + 45 };
    canvas.drawing.current = { fromId: id, fromSide: s };
    canvas.setDraft({ x1: p.x, y1: p.y, x2: p.x, y2: p.y });
    canvas.isPanningEnabled.current = false;
  };

  const onPortUp = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!canvas.drawing.current || canvas.drawing.current.fromId === id) {
      canvas.drawing.current = null;
      canvas.setDraft(null);
      return;
    }
    canvas.addConnection(canvas.drawing.current.fromId, id);
    canvas.drawing.current = null;
    canvas.setDraft(null);
  };

  const onCanvasDown = (e: React.MouseEvent) => {
    const target = e.target as SVGElement;
    const isBackground =
      target === svgRef.current ||
      target.id === 'bgRect' ||
      target.tagName === 'rect' ||
      target.tagName === 'svg';

    if (isBackground) {
      canvas.setSelected(null);
      setSyllabusPanel(null);
      setNodeInfoPanel(null);
      canvas.panning.current = {
        sx: e.clientX, sy: e.clientY,
        px: canvas.pan.x, py: canvas.pan.y,
      };
      canvas.isPanningEnabled.current = true;
      if (svgRef.current) svgRef.current.style.cursor = 'grabbing';
    }
  };

  const onMove = (e: React.MouseEvent) => {
    if (canvas.dragging.current) {
      const sv = canvas.toSV(e.clientX, e.clientY, svgRef);
      const { id, ox, oy } = canvas.dragging.current;
      canvas.setNodes(prev => prev.map(n => n.id === id ? { ...n, x: sv.x - ox, y: sv.y - oy } : n));
    } else if (canvas.drawing.current) {
      const sv = canvas.toSV(e.clientX, e.clientY, svgRef);
      const n = canvas.nodes.find(x => x.id === canvas.drawing.current!.fromId)!;
      const p = canvas.drawing.current.fromSide === 'r'
        ? { x: n.x + 240, y: n.y + 45 }
        : { x: n.x, y: n.y + 45 };
      canvas.setDraft({ x1: p.x, y1: p.y, x2: sv.x, y2: sv.y });
    } else if (canvas.panning.current && canvas.isPanningEnabled.current) {
      const dx = e.clientX - canvas.panning.current.sx;
      const dy = e.clientY - canvas.panning.current.sy;
      canvas.setPan({ x: canvas.panning.current.px + dx, y: canvas.panning.current.py + dy });
    }
  };

  const onUp = () => {
    canvas.dragging.current = null;
    canvas.drawing.current = null;
    canvas.setDraft(null);
    if (canvas.panning.current) canvas.panning.current = null;
    canvas.isPanningEnabled.current = false;
    if (svgRef.current) svgRef.current.style.cursor = 'default';
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.min(2, Math.max(0.2, canvas.zoom * zoomFactor));
    const worldX = (mouseX - canvas.pan.x) / canvas.zoom;
    const worldY = (mouseY - canvas.pan.y) / canvas.zoom;
    canvas.setZoom(newZoom);
    canvas.setPan({ x: mouseX - worldX * newZoom, y: mouseY - worldY * newZoom });
  };

  useEffect(() => {
    const handleGlobalWheel = (e: WheelEvent) => {
      if (svgRef.current && svgRef.current.contains(e.target as Node)) {
        e.preventDefault();
      }
    };
    window.addEventListener('wheel', handleGlobalWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleGlobalWheel);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && canvas.selected) {
        const active = document.activeElement;
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return;
        canvas.delNode(canvas.selected);
        setSyllabusPanel(null);
        setNodeInfoPanel(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas.selected, canvas.delNode]);

  const lastDisciplineRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!canvas.currentProjectId) return;
    const importNode = canvas.nodes.find(n => n.kind === 'import' && n.syllabusData);
    const discipline = importNode?.syllabusData?.discipline;
    if (discipline && typeof discipline === 'string' && discipline !== lastDisciplineRef.current) {
      lastDisciplineRef.current = discipline;
      canvas.updateProject(canvas.currentProjectId, { discipline });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas.nodes, canvas.currentProjectId, canvas.updateProject]);

  // ─── Слушатели событий от Excel-блока ───────────────────────────────────
  useEffect(() => {
    // Обновление metadata (шаблон)
    const metaHandler = (e: Event) => {
      const { id, meta } = (e as CustomEvent<{ id: string; meta: Record<string, unknown> }>).detail;
      const node = canvas.nodes.find(n => n.id === id);
      if (!node) return;
      canvas.updateNode(id, {
        metadata: { ...(node.metadata || {}), ...meta },
      });
    };
    // Обновление prompt (текст описания)
    const promptHandler = (e: Event) => {
      const { id, prompt } = (e as CustomEvent<{ id: string; prompt: string }>).detail;
      canvas.updateNode(id, { prompt });
    };

    window.addEventListener('canvas:update-node-meta',   metaHandler);
    window.addEventListener('canvas:update-node-prompt', promptHandler);
    return () => {
      window.removeEventListener('canvas:update-node-meta',   metaHandler);
      window.removeEventListener('canvas:update-node-prompt', promptHandler);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas.nodes, canvas.updateNode]);

  // ─── Syllabus upload ──────────────────────────────────────────────────────
  const openSyllabusDialog = useCallback((nodeId?: string) => {
    if (syllabusInputRef.current) {
      syllabusInputRef.current.value = '';
      syllabusInputRef.current.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) await handleSyllabusUpload(file, nodeId);
      };
      syllabusInputRef.current.click();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSyllabusUpload = async (file: File, targetNodeId?: string) => {
    const targetId = targetNodeId ?? canvas.nodes.find(n => n.kind === 'import')?.id;
    if (!targetId) {
      toast.error('Нет блока Импорт на холсте');
      return;
    }
    canvas.updateNode(targetId, { status: 'running' });
    try {
      const fd = new FormData();
      fd.append('file', file);
      // Бэкенд сам парсит DOCX и возвращает полный SyllabusData с темами — AI не нужен
      const res = await fetch(`${API_BASE}/analyze-syllabus`, { method: 'POST', body: fd });
      if (!res.ok) throw new Error(`Ошибка анализа: ${res.status}`);
      // Берём JSON напрямую — lectureTopics, labTopics и т.д. уже внутри
      const syllabusData = await res.json();
      canvas.updateNode(targetId, {
        status: 'done',
        uploadedFile: file.name,
        syllabusData,
        filename: file.name,
      });
      const topicsCount =
        (syllabusData.lectureTopics?.length || 0) +
        (syllabusData.labTopics?.length || 0) +
        (syllabusData.practicalTopics?.length || 0);
      toast.success(`✅ Силлабус «${file.name}» загружен${topicsCount > 0 ? ` (${topicsCount} тем)` : ''}`);
    } catch (err) {
      canvas.updateNode(targetId, { status: 'error', error: String(err) });
      toast.error('Ошибка загрузки силлабуса');
    }
  };

  // ─── Node file upload ─────────────────────────────────────────────────────
  const handleNodeFileUpload = async (file: File, nodeId: string) => {
    canvas.updateNode(nodeId, { status: 'running' });
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${API_BASE}/parse-node-file`, { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Ошибка разбора файла');
      const data = await res.json();
      canvas.updateNode(nodeId, {
        status: 'idle',
        nodeFileData: { fileName: file.name, ...data },
      });
      toast.success(`📎 Файл «${file.name}» прикреплён`);
    } catch (err) {
      canvas.updateNode(nodeId, { status: 'error', error: String(err) });
      toast.error('Ошибка прикрепления файла');
    }
  };

  const openNodeFileDialog = (nodeId: string) => {
    if (nodeFileInputRef.current) {
      nodeFileInputRef.current.value = '';
      nodeFileInputRef.current.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) await handleNodeFileUpload(file, nodeId);
      };
      nodeFileInputRef.current.click();
    }
  };

  // ─── Generation ───────────────────────────────────────────────────────────
  const checkCanGenerate = (): boolean => {
    if (!user) {
      toast.error('Необходима авторизация');
      window.dispatchEvent(new CustomEvent('hivers:open-auth', { detail: { mode: 'login' } }));
      return false;
    }
    if (limitReady && remaining <= 0) {
      openLimitModal(used, dailyLimit);
      return false;
    }
    return true;
  };

  const handleRunAll = () => {
    if (!checkCanGenerate()) return;

    const generatableNodes = (canvas.nodesRef?.current ?? canvas.nodes)
      .filter(n => n.kind !== 'import');

    if (generatableNodes.length === 0) {
      toast.error('Нет блоков для генерации. Добавьте блоки на холст.');
      return;
    }

    execution.runAll(
      () => canvas.nodesRef?.current ?? canvas.nodes,
      () => canvas.connsRef?.current ?? canvas.conns,
      canvas.updateNode,
      canvas.setRunAll,
      () => { incrementOptimistic(); },
      () => {
        openLimitModal(used, dailyLimit);
        refetchLimit();
      },
      userId
    );
  };

  const handleReset = () => {
    canvas.resetAll(execution.cancelAll);
    toast('🛑 Генерация остановлена', { icon: '⚠️' });
  };

  const handleRunNode = (nodeId: string) => {
    if (!checkCanGenerate()) return;

    execution.runNode(
      nodeId,
      canvas.nodesRef?.current ?? canvas.nodes,
      canvas.connsRef?.current ?? canvas.conns,
      canvas.updateNode,
      undefined,
      () => { incrementOptimistic(); },
      () => {
        openLimitModal(used, dailyLimit);
        refetchLimit();
      },
      userId
    );
  };

  const handleDeleteNode = (id: string) => {
    canvas.delNode(id);
    if (syllabusPanel === id) setSyllabusPanel(null);
    if (nodeInfoPanel === id) setNodeInfoPanel(null);
  };

  const handleAddNode = (kind: string) => {
    canvas.addNode(kind as NodeKind, {}, svgRef);
  };

  // ─── Derived ──────────────────────────────────────────────────────────────
  const syllabusNode = syllabusPanel ? canvas.nodes.find(n => n.id === syllabusPanel) : null;
  const syllabusConnectedIds = syllabusPanel
    ? canvas.conns.filter(c => c.from === syllabusPanel).map(c => c.to)
    : [];

  const nodeInfoNode = nodeInfoPanel ? (canvas.nodes.find(n => n.id === nodeInfoPanel) ?? null) : null;
  const nodeInfoSyllabus = nodeInfoNode
    ? findConnectedSyllabus(nodeInfoNode.id, canvas.nodes, canvas.conns)
    : null;

  // ─── Render ───────────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div style={{ ...styles.root, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1rem' }}>Загрузка...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div style={styles.root}>
      <input
        ref={syllabusInputRef}
        type="file"
        accept=".doc,.docx,.txt,.md"
        style={{ display: 'none' }}
      />
      <input
        type="file"
        accept=".docx,.doc"
        style={{ display: 'none' }}
        ref={nodeFileInputRef}
      />

      <TopBar
        mode={canvas.mode}
        MODES={MODES}
        setMode={canvas.setMode}
        doneN={canvas.doneN}
        genN={canvas.genN}
        runningAll={canvas.runningAll}
        onReset={handleReset}
        onRunAll={handleRunAll}
        onLogoClick={() => router.push('/')}
        isSaving={canvas.isSaving}
        projects={canvas.projects}
        currentProjectId={canvas.currentProjectId}
        onSwitchProject={canvas.switchProject}
        onCreateProject={async (name, description, mode) => {
          await canvas.createProject(name, description, mode);
        }}
        onDeleteProject={canvas.deleteProject}
        onUpdateProject={canvas.updateProject}
        editorOpen={editorOpen}
        onToggleEditor={() => setEditorOpen(v => !v)}
      />

      <div style={styles.ws}>
        <Sidebar
          KINDS={KINDS}
          addNode={handleAddNode}
          zoom={canvas.zoom}
          setZoom={canvas.setZoom}
          setPan={canvas.setPan}
          selectedNode={canvas.selected ? canvas.nodes.find(n => n.id === canvas.selected) ?? null : null}
          onUploadForNode={(nodeId) => openSyllabusDialog(nodeId)}
        />

        <div style={styles.cvWrap}>
          <CanvasSVG
            svgRef={svgRef}
            pan={canvas.pan}
            zoom={canvas.zoom}
            nodes={canvas.nodes}
            conns={canvas.conns}
            selected={canvas.selected}
            draft={canvas.draft}
            onMouseDown={onCanvasDown}
            onMouseMove={onMove}
            onMouseUp={onUp}
            onWheel={onWheel}
            onNodeDown={onNodeDown}
            onNodeClick={onNodeClick}
            onPortDown={onPortDown}
            onPortUp={onPortUp}
            onDeleteNode={handleDeleteNode}
            onRunNode={handleRunNode}
          />

          {syllabusNode?.syllabusData && (
            <SyllabusPanel
              node={syllabusNode}
              connectedNodeIds={syllabusConnectedIds}
              allNodes={canvas.nodes}
              onClose={() => setSyllabusPanel(null)}
              onRunNode={handleRunNode}
            />
          )}

          {nodeInfoNode && nodeInfoNode.kind !== 'import' && (
            <NodeInfoPanel
              node={nodeInfoNode}
              syllabus={nodeInfoSyllabus}
              allNodes={canvas.nodes}
              allConns={canvas.conns}
              onClose={() => setNodeInfoPanel(null)}
              onRunNode={handleRunNode}
              onUploadNodeFile={(nodeId: string) => openNodeFileDialog(nodeId)}
              onChangeMode={(nodeId: string, mode: 'topics' | 'full') =>
                canvas.updateNode(nodeId, { generationMode: mode })
              }
            />
          )}

          <Footer
            nodesCount={canvas.nodes.length}
            connsCount={canvas.conns.length}
          />
        </div>

        {/* ── Document Editor overlay ── */}
        {editorOpen && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 50,
            display: 'flex', justifyContent: 'flex-end',
            pointerEvents: 'none',
            transition: 'all 0.25s ease',
          }}>
            <div style={{
              width: editorExpanded ? '100%' : 700,
              height: '100%',
              borderLeft: editorExpanded ? 'none' : '1px solid rgba(255,255,255,0.07)',
              pointerEvents: 'all',
              boxShadow: '-12px 0 40px rgba(0,0,0,0.4)',
              transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
            }}>
              <DocumentEditorPanel
                userId={user?.id}
                onClose={() => { setEditorOpen(false); setEditorExpanded(false); }}
                expanded={editorExpanded}
                onToggleExpand={() => setEditorExpanded(v => !v)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}