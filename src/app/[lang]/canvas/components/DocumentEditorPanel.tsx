'use client';

/**
 * DocumentEditorPanel.tsx — v3
 * Layout: два столбца — слева документ (белый лист), справа AI-панель
 * Выделение текста → AI-панель оживает, показывает выделенный кусок и инпут
 *
 * ИЗМЕНЕНИЯ v3:
 * - Хранится оригинальный File объект (originalFile) после импорта
 * - Накапливается история замен (replacements: {oldText, newText}[])
 * - При экспорте: если есть оригинальный .docx → POST /export-patch (патч XML)
 *   Иначе → fallback на старый /export (plain text → .doc)
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { API_BASE } from '../page.functional';

interface SelectionState {
  text: string;
  start: number;
  end: number;
}

// Одна замена, которую сделал AI
interface TextReplacement {
  oldText: string;
  newText: string;
}

interface DocumentEditorPanelProps {
  userId?: string;
  onClose: () => void;
  expanded?: boolean;
  onToggleExpand?: () => void;
}

async function safeJson(res: Response): Promise<unknown> {
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    const text = await res.text();
    throw new Error(`Ошибка сервера (${res.status}): ${text.slice(0, 120)}`);
  }
  return res.json();
}

const QUICK_CMDS = [
  { label: '✂️ Короче',       value: 'Сделай текст короче, убери лишнее' },
  { label: '📖 Подробнее',    value: 'Расширь и добавь больше деталей' },
  { label: '✨ Улучши стиль', value: 'Улучши стиль и читаемость' },
  { label: '🔧 Ошибки',       value: 'Исправь грамматические и стилистические ошибки' },
  { label: '🎓 Академично',   value: 'Перепиши в академическом стиле' },
  { label: '💡 Проще',        value: 'Перепиши проще и понятнее' },
];

export const DocumentEditorPanel: React.FC<DocumentEditorPanelProps> = ({ userId, onClose, expanded, onToggleExpand }) => {
  const [docText, setDocText]           = useState('');
  const [originalName, setOriginalName] = useState('');
  const [selection, setSelection]       = useState<SelectionState | null>(null);
  const [instruction, setInstruction]   = useState('');
  const [isRewriting, setIsRewriting]   = useState(false);
  const [isExporting, setIsExporting]   = useState(false);
  const [isParsing, setIsParsing]       = useState(false);
  const [history, setHistory]           = useState<string[]>([]);

  // ── НОВОЕ: оригинальный файл и накопленные замены ──────────────────────────
  // originalFile хранится в ref (не в state) — не влияет на рендер
  const originalFileRef  = useRef<File | null>(null);
  // Все AI-замены за сессию — для патча при экспорте
  const [replacements, setReplacements] = useState<TextReplacement[]>([]);
  // ──────────────────────────────────────────────────────────────────────────

  const fileInputRef   = useRef<HTMLInputElement>(null);
  const textareaRef    = useRef<HTMLTextAreaElement>(null);
  const instructionRef = useRef<HTMLInputElement>(null);

  // ─── Выделение ────────────────────────────────────────────────────────────
  const handleSelect = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart ?? 0;
    const end   = ta.selectionEnd   ?? 0;
    if (end <= start) { setSelection(null); return; }
    const text = ta.value.slice(start, end);
    if (text.trim().length < 2) { setSelection(null); return; }
    setSelection({ text, start, end });
    setInstruction('');
  }, []);

  // Фокус на инпут когда появляется выделение
  useEffect(() => {
    if (selection) {
      setTimeout(() => instructionRef.current?.focus(), 40);
    }
  }, [selection]);

  // ─── Upload ───────────────────────────────────────────────────────────────
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsParsing(true);
    setSelection(null);

    // Сохраняем оригинальный файл (только если .docx — для патча)
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'docx') {
      originalFileRef.current = file;
    } else {
      originalFileRef.current = null;
    }
    // Сбрасываем историю замен при новом файле
    setReplacements([]);

    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${API_BASE}/doc-editor/parse`, { method: 'POST', body: fd });
      if (!res.ok) {
        const err = await safeJson(res) as { error?: string };
        throw new Error(err.error || `Ошибка ${res.status}`);
      }
      const data = await safeJson(res) as { text: string; originalName: string; charCount: number };
      setDocText(data.text);
      setOriginalName(data.originalName);
      setHistory([]);
      toast.success(`Загружено: ${data.originalName}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Ошибка загрузки');
      // Если парсинг упал — сбрасываем originalFile
      originalFileRef.current = null;
    } finally {
      setIsParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, []);

  // ─── AI Rewrite ───────────────────────────────────────────────────────────
  const handleRewrite = useCallback(async () => {
    if (!selection || !instruction.trim() || isRewriting) return;
    setIsRewriting(true);
    try {
      const res = await fetch(`${API_BASE}/doc-editor/rewrite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(userId ? { 'x-user-id': userId } : {}),
        },
        body: JSON.stringify({ selectedText: selection.text, instruction: instruction.trim() }),
      });
      if (!res.ok) {
        const err = await safeJson(res) as { error?: string };
        throw new Error(err.error || `Ошибка ${res.status}`);
      }
      const { newText } = await safeJson(res) as { newText: string };

      setHistory(prev => [...prev.slice(-9), docText]);

      // Накапливаем замену для экспорта-патча
      setReplacements(prev => [...prev, { oldText: selection.text, newText }]);

      const updated = docText.slice(0, selection.start) + newText + docText.slice(selection.end);
      setDocText(updated);
      setSelection(null);
      setInstruction('');
      toast.success('Готово');

      setTimeout(() => {
        const ta = textareaRef.current;
        if (!ta) return;
        ta.focus();
        ta.setSelectionRange(selection.start, selection.start + newText.length);
      }, 50);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Ошибка AI');
    } finally {
      setIsRewriting(false);
    }
  }, [selection, instruction, docText, userId, isRewriting]);

  // ─── Undo ─────────────────────────────────────────────────────────────────
  const handleUndo = useCallback(() => {
    if (!history.length) return;
    setDocText(history[history.length - 1]);
    setHistory(h => h.slice(0, -1));
    // Откатываем последнюю замену
    setReplacements(prev => prev.slice(0, -1));
    setSelection(null);
    toast('Отменено', { icon: '↩' });
  }, [history]);

  // ─── Export ───────────────────────────────────────────────────────────────
  const handleExport = useCallback(async () => {
    if (!docText || isExporting) return;
    setIsExporting(true);

    try {
      const originalFile = originalFileRef.current;
      const hasDocx = !!originalFile && replacements.length > 0;

      // ── Путь 1: есть оригинальный .docx и есть замены → патч ──────────────
      if (hasDocx) {
        const fd = new FormData();
        fd.append('file', originalFile);
        fd.append('replacements', JSON.stringify(replacements));

        const res = await fetch(`${API_BASE}/doc-editor/export-patch`, {
          method: 'POST',
          body: fd,
        });

        if (!res.ok) {
          const ct = res.headers.get('content-type') || '';
          const msg = ct.includes('json')
            ? ((await res.json()) as { error?: string }).error
            : await res.text();
          throw new Error(msg || `Ошибка ${res.status}`);
        }

        const blob = await res.blob();
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href = url;
        a.download = originalName || 'document.docx';
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Файл скачан (оригинальное форматирование сохранено)');
        return;
      }

      // ── Путь 2: нет оригинала или нет замен → отдаём оригинал как есть ────
      if (originalFile && replacements.length === 0) {
        // Файл не изменялся — просто скачиваем оригинал напрямую
        const url = URL.createObjectURL(originalFile);
        const a   = document.createElement('a');
        a.href = url;
        a.download = originalName || 'document.docx';
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Файл скачан');
        return;
      }

      // ── Путь 3: fallback — legacy plain text → .doc ────────────────────────
      const res = await fetch(`${API_BASE}/doc-editor/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text:     docText,
          filename: originalName.replace(/\.[^.]+$/, '') || 'document',
        }),
      });
      if (!res.ok) {
        const ct  = res.headers.get('content-type') || '';
        const msg = ct.includes('json')
          ? ((await res.json()) as { error?: string }).error
          : await res.text();
        throw new Error(msg || `Ошибка ${res.status}`);
      }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url;
      a.download = (originalName.replace(/\.[^.]+$/, '') || 'document') + '.doc';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Файл скачан');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Ошибка экспорта');
    } finally {
      setIsExporting(false);
    }
  }, [docText, originalName, replacements, isExporting]);

  const wordCount = docText.trim() ? docText.trim().split(/\s+/).length : 0;
  const charCount = docText.length;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={s.root}>
      {/* ── Header ── */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <div style={s.headerIcon}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
          </div>
          <div>
            <div style={s.headerTitle}>Редактор документов</div>
            {originalName
              ? <div style={s.headerSub}>{originalName}</div>
              : <div style={s.headerSub}>Загрузите DOCX или TXT</div>
            }
          </div>
        </div>

        <div style={s.headerRight}>
          {history.length > 0 && (
            <button onClick={handleUndo} style={s.btnUndo} title="Отменить (Ctrl+Z)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>
              </svg>
              Отмена
            </button>
          )}
          {/* Expand / Collapse */}
          {onToggleExpand && (
            <button
              onClick={onToggleExpand}
              style={s.btnIcon}
              title={expanded ? 'Свернуть' : 'Развернуть на весь экран'}
            >
              {expanded ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/>
                  <line x1="10" y1="14" x2="3" y2="21"/><line x1="21" y1="3" x2="14" y2="10"/>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
                  <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
                </svg>
              )}
            </button>
          )}
          {docText && (
            <button
              onClick={handleExport}
              disabled={isExporting}
              style={{ ...s.btnExport, opacity: isExporting ? 0.6 : 1 }}
            >
              {isExporting ? (
                <span style={s.spinnerSmall} />
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              )}
              Скачать .docx
            </button>
          )}
          <button onClick={onClose} style={s.btnClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      {!docText ? (
        /* Drop zone */
        <div
          style={s.dropzone}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => {
            e.preventDefault();
            const file = e.dataTransfer.files?.[0];
            if (!file || !fileInputRef.current) return;
            const dt = new DataTransfer();
            dt.items.add(file);
            fileInputRef.current.files = dt.files;
            fileInputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
          }}
        >
          {isParsing ? (
            <div style={s.dropzoneContent}>
              <div style={s.spinnerLarge} />
              <div style={s.dropzoneTitle}>Читаю документ…</div>
            </div>
          ) : (
            <div style={s.dropzoneContent}>
              <div style={s.dropzoneIconWrap}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="12" y1="18" x2="12" y2="12"/>
                  <line x1="9" y1="15" x2="15" y2="15"/>
                </svg>
              </div>
              <div style={s.dropzoneTitle}>Загрузите документ</div>
              <div style={s.dropzoneSub}>DOCX, DOC или TXT — перетащите или кликните</div>
              <div style={s.dropzoneBtn}>Выбрать файл</div>
            </div>
          )}
        </div>
      ) : (
        /* Two-column editor */
        <div style={s.editorBody}>

          {/* ── LEFT: Document ── */}
          <div style={s.docCol}>
            {/* Статистика */}
            <div style={s.docStats}>
              <span style={s.statBadge}>📄 {originalName}</span>
              <span style={s.statBadge}>{wordCount.toLocaleString()} слов</span>
              <span style={s.statBadge}>{charCount.toLocaleString()} симв.</span>
              {/* Индикатор замен */}
              {replacements.length > 0 && (
                <span style={{ ...s.statBadge, color: '#818cf8', borderColor: 'rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.08)' }}>
                  ✨ {replacements.length} {replacements.length === 1 ? 'правка' : replacements.length < 5 ? 'правки' : 'правок'}
                </span>
              )}
              <button
                style={s.changeFileBtn}
                onClick={() => fileInputRef.current?.click()}
              >
                Другой файл
              </button>
            </div>

            {/* Лист A4 */}
            <div style={s.pageWrap}>
              <div style={s.page}>
                {/* Подсказка над textarea */}
                {!selection && (
                  <div style={s.selectHint}>
                    Выделите любой фрагмент текста мышью — появится AI-панель
                  </div>
                )}
                <textarea
                  ref={textareaRef}
                  value={docText}
                  onChange={e => { setDocText(e.target.value); setSelection(null); }}
                  onSelect={handleSelect}
                  onMouseUp={handleSelect}
                  onKeyUp={e => {
                    handleSelect();
                    // Ctrl+Z
                    if ((e.ctrlKey || e.metaKey) && e.key === 'z') handleUndo();
                  }}
                  style={s.textarea}
                  spellCheck={false}
                />
              </div>
            </div>
          </div>

          {/* ── RIGHT: AI Panel ── */}
          <div style={s.aiCol}>
            {!selection ? (
              /* Idle state */
              <div style={s.aiIdle}>
                <div style={s.aiIdleIcon}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4040a0" strokeWidth="1.5">
                    <path d="M12 2a10 10 0 1 0 10 10"/>
                    <path d="M12 8v4l3 3"/>
                    <path d="M18 2v4h4"/>
                  </svg>
                </div>
                <div style={s.aiIdleTitle}>AI-редактор</div>
                <div style={s.aiIdleText}>
                  Выделите любой фрагмент текста в документе — здесь появятся инструменты для его переработки
                </div>
                <div style={s.aiIdleDivider} />
                <div style={s.aiIdleHints}>
                  <div style={s.aiIdleHint}>
                    <span style={s.hintNum}>1</span>
                    Выделите текст мышью
                  </div>
                  <div style={s.aiIdleHint}>
                    <span style={s.hintNum}>2</span>
                    Выберите команду или напишите инструкцию
                  </div>
                  <div style={s.aiIdleHint}>
                    <span style={s.hintNum}>3</span>
                    AI перепишет фрагмент
                  </div>
                </div>
                {/* Информация об экспорте */}
                {originalFileRef.current && (
                  <div style={s.exportInfo}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                    {replacements.length > 0
                      ? `При скачивании сохранится оригинальное форматирование (${replacements.length} правок)`
                      : 'Скачается оригинальный файл с форматированием'
                    }
                  </div>
                )}
              </div>
            ) : (
              /* Active state */
              <div style={s.aiActive}>
                {/* Заголовок панели */}
                <div style={s.aiPanelHeader}>
                  <div style={s.aiPanelHeaderIcon}>✨</div>
                  <span style={s.aiPanelHeaderTitle}>Переписать фрагмент</span>
                </div>

                {/* Превью выделенного */}
                <div style={s.selectionPreview}>
                  <div style={s.selectionPreviewLabel}>Выделено:</div>
                  <div style={s.selectionPreviewText}>
                    {selection.text.length > 200
                      ? selection.text.slice(0, 200) + '…'
                      : selection.text}
                  </div>
                  <div style={s.selectionMeta}>
                    {selection.text.split(/\s+/).filter(Boolean).length} слов ·{' '}
                    {selection.text.length} симв.
                  </div>
                </div>

                {/* Инпут инструкции */}
                <div style={s.instructionWrap}>
                  <div style={s.instructionLabel}>Инструкция для AI</div>
                  <div style={s.instructionRow}>
                    <input
                      ref={instructionRef}
                      type="text"
                      placeholder="Что сделать с этим текстом?"
                      value={instruction}
                      onChange={e => setInstruction(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !isRewriting) handleRewrite();
                        if (e.key === 'Escape') setSelection(null);
                      }}
                      style={s.instructionInput}
                    />
                  </div>

                  <button
                    onClick={handleRewrite}
                    disabled={isRewriting || !instruction.trim()}
                    style={{
                      ...s.rewriteBtn,
                      opacity:  isRewriting || !instruction.trim() ? 0.5 : 1,
                      cursor:   isRewriting || !instruction.trim() ? 'not-allowed' : 'pointer',
                      transform: isRewriting ? 'none' : undefined,
                    }}
                  >
                    {isRewriting ? (
                      <>
                        <span style={s.spinnerSmall} />
                        Генерирую…
                      </>
                    ) : (
                      <>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M5 3l14 9-14 9V3z"/>
                        </svg>
                        Применить
                      </>
                    )}
                  </button>
                </div>

                {/* Быстрые команды */}
                <div style={s.quickSection}>
                  <div style={s.quickLabel}>Быстрые команды</div>
                  <div style={s.quickGrid}>
                    {QUICK_CMDS.map(cmd => (
                      <button
                        key={cmd.value}
                        style={{
                          ...s.quickCard,
                          ...(instruction === cmd.value ? s.quickCardActive : {}),
                        }}
                        onClick={() => {
                          setInstruction(cmd.value);
                          setTimeout(() => instructionRef.current?.focus(), 10);
                        }}
                      >
                        {cmd.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Отмена выделения */}
                <button style={s.cancelSelBtn} onClick={() => setSelection(null)}>
                  Снять выделение
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".docx,.doc,.txt"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes panelIn { from { opacity: 0; transform: translateX(12px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>
    </div>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: '#0e0e16',
    color: '#f0f0f0',
    fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif",
    overflow: 'hidden',
  },

  // Header
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 20px',
    height: 56,
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    flexShrink: 0,
    background: 'rgba(10,10,18,0.95)',
    backdropFilter: 'blur(12px)',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: 'rgba(99,102,241,0.12)',
    border: '1px solid rgba(99,102,241,0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#818cf8',
    flexShrink: 0,
  },
  headerTitle: {
    fontWeight: 700,
    fontSize: 14,
    color: '#eeeef4',
    letterSpacing: '-0.01em',
  },
  headerSub: {
    fontSize: 11,
    color: '#50507a',
    marginTop: 1,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  btnUndo: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '7px 12px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 9,
    color: '#80809a',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  btnExport: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    padding: '7px 15px',
    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
    border: 'none',
    borderRadius: 9,
    color: '#fff',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
    transition: 'all 0.15s',
  },
  btnClose: {
    width: 32,
    height: 32,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 8,
    color: '#60607a',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s',
  },
  btnIcon: {
    width: 32,
    height: 32,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 8,
    color: '#818cf8',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s',
  },

  // Drop zone
  dropzone: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.04) 0%, transparent 70%)',
  },
  dropzoneContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    padding: 48,
    border: '2px dashed rgba(99,102,241,0.2)',
    borderRadius: 20,
    textAlign: 'center',
    transition: 'all 0.2s',
  },
  dropzoneIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 18,
    background: 'rgba(99,102,241,0.08)',
    border: '1px solid rgba(99,102,241,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  dropzoneTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: '#eeeef4',
    letterSpacing: '-0.02em',
  },
  dropzoneSub: {
    fontSize: 13,
    color: '#50507a',
    marginTop: -4,
  },
  dropzoneBtn: {
    marginTop: 8,
    padding: '9px 24px',
    background: 'rgba(99,102,241,0.15)',
    border: '1px solid rgba(99,102,241,0.3)',
    borderRadius: 10,
    color: '#818cf8',
    fontSize: 13,
    fontWeight: 600,
  },

  // Editor body — two columns
  editorBody: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
    minHeight: 0,
  },

  // Left: document column
  docCol: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    minWidth: 0,
    background: '#111118',
    borderRight: '1px solid rgba(255,255,255,0.05)',
  },
  docStats: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    flexShrink: 0,
    flexWrap: 'wrap' as const,
  },
  statBadge: {
    fontSize: 11,
    color: '#44445e',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: 5,
    padding: '2px 8px',
    fontFamily: 'monospace',
  },
  changeFileBtn: {
    marginLeft: 'auto',
    fontSize: 11,
    color: '#5050a0',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '2px 6px',
    borderRadius: 5,
    transition: 'color 0.15s',
  },
  pageWrap: {
    flex: 1,
    overflow: 'auto',
    padding: '24px 32px 32px',
    scrollbarWidth: 'thin' as const,
    scrollbarColor: 'rgba(80,80,100,0.3) transparent',
  },
  page: {
    background: '#fff',
    borderRadius: 4,
    boxShadow: '0 2px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06)',
    minHeight: '100%',
    position: 'relative',
  },
  selectHint: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: '6px 16px',
    fontSize: 11,
    color: 'rgba(99,102,241,0.7)',
    background: 'rgba(99,102,241,0.04)',
    borderBottom: '1px solid rgba(99,102,241,0.1)',
    textAlign: 'center',
    borderRadius: '4px 4px 0 0',
    pointerEvents: 'none',
    zIndex: 1,
  },
  textarea: {
    width: '100%',
    minHeight: 600,
    resize: 'none',
    background: 'transparent',
    color: '#1a1a2e',
    border: 'none',
    outline: 'none',
    padding: '40px 48px 48px',
    paddingTop: 48,
    fontSize: 13.5,
    lineHeight: 1.9,
    fontFamily: "'Times New Roman', 'Georgia', serif",
    letterSpacing: '0.01em',
    boxSizing: 'border-box' as const,
    display: 'block',
  },

  // Right: AI column
  aiCol: {
    width: 300,
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    background: '#0c0c14',
  },

  // AI idle state
  aiIdle: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px 24px',
    textAlign: 'center',
  },
  aiIdleIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    background: 'rgba(30,30,50,0.8)',
    border: '1px solid rgba(80,80,120,0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  aiIdleTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#7070a0',
    marginBottom: 10,
    letterSpacing: '-0.02em',
  },
  aiIdleText: {
    fontSize: 12,
    color: '#36364a',
    lineHeight: 1.7,
    maxWidth: 220,
  },
  aiIdleDivider: {
    width: 40,
    height: 1,
    background: 'rgba(80,80,120,0.2)',
    margin: '24px auto',
  },
  aiIdleHints: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    width: '100%',
  },
  aiIdleHint: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 12,
    color: '#40405a',
    textAlign: 'left',
  },
  hintNum: {
    width: 20,
    height: 20,
    borderRadius: 6,
    background: 'rgba(99,102,241,0.08)',
    border: '1px solid rgba(99,102,241,0.15)',
    color: '#5050a0',
    fontSize: 10,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  exportInfo: {
    marginTop: 20,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 10,
    color: '#4040a0',
    background: 'rgba(99,102,241,0.06)',
    border: '1px solid rgba(99,102,241,0.12)',
    borderRadius: 8,
    padding: '8px 12px',
    textAlign: 'left',
    lineHeight: 1.5,
  },

  // AI active state
  aiActive: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '16px',
    gap: 14,
    overflowY: 'auto',
    scrollbarWidth: 'thin' as const,
    scrollbarColor: 'rgba(80,80,100,0.3) transparent',
    animation: 'panelIn 0.2s ease',
  },
  aiPanelHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  aiPanelHeaderIcon: {
    fontSize: 18,
  },
  aiPanelHeaderTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: '#c0c0e0',
    letterSpacing: '-0.01em',
  },

  // Selection preview
  selectionPreview: {
    background: 'rgba(99,102,241,0.06)',
    border: '1px solid rgba(99,102,241,0.18)',
    borderRadius: 10,
    padding: '12px 13px',
  },
  selectionPreviewLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: '#5050a0',
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    marginBottom: 6,
  },
  selectionPreviewText: {
    fontSize: 12,
    color: '#9090c0',
    lineHeight: 1.6,
    fontFamily: "'Times New Roman', serif",
    maxHeight: 100,
    overflowY: 'auto',
    scrollbarWidth: 'none' as const,
  },
  selectionMeta: {
    fontSize: 10,
    color: '#40405a',
    marginTop: 6,
  },

  // Instruction
  instructionWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  instructionLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: '#40405a',
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
  },
  instructionRow: {
    display: 'flex',
    gap: 6,
  },
  instructionInput: {
    flex: 1,
    padding: '10px 12px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(99,102,241,0.25)',
    borderRadius: 9,
    color: '#e0e0f0',
    fontSize: 13,
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'border-color 0.15s',
  },
  rewriteBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    padding: '11px 0',
    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
    border: 'none',
    borderRadius: 10,
    color: '#fff',
    fontSize: 13,
    fontWeight: 700,
    transition: 'all 0.15s',
    boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
    letterSpacing: '-0.01em',
  },

  // Quick commands
  quickSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  quickLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: '#40405a',
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
  },
  quickGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 6,
  },
  quickCard: {
    padding: '8px 10px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 8,
    color: '#60609a',
    fontSize: 11,
    fontWeight: 500,
    cursor: 'pointer',
    textAlign: 'left' as const,
    transition: 'all 0.15s',
    fontFamily: 'inherit',
    lineHeight: 1.4,
  },
  quickCardActive: {
    background: 'rgba(99,102,241,0.1)',
    border: '1px solid rgba(99,102,241,0.3)',
    color: '#8080d0',
  },

  cancelSelBtn: {
    marginTop: 'auto',
    padding: '8px 0',
    background: 'none',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 8,
    color: '#36364a',
    fontSize: 11,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.15s',
  },

  // Spinners
  spinnerSmall: {
    display: 'inline-block',
    width: 13,
    height: 13,
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#fff',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
  },
  spinnerLarge: {
    width: 36,
    height: 36,
    border: '3px solid rgba(99,102,241,0.15)',
    borderTopColor: '#6366f1',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    marginBottom: 12,
  },
};