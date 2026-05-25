'use client';


import React, { useEffect, useState } from 'react';

const LIMIT_MODAL_EVENT = 'hivers:limit-exceeded';
const GLOBAL_LIMIT_MODAL_EVENT = 'hivers:global-limit-exceeded';

export function openLimitModal(used?: number, dailyLimit?: number) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(LIMIT_MODAL_EVENT, {
        detail: used !== undefined ? { used, dailyLimit } : undefined,
      })
    );
  }
}

export function openGlobalLimitModal(globalUsed?: number, globalLimit?: number) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(GLOBAL_LIMIT_MODAL_EVENT, {
        detail: globalUsed !== undefined ? { globalUsed, globalLimit } : undefined,
      })
    );
  }
}

interface LimitModalEventDetail {
  used?: number;
  dailyLimit?: number;
}

interface GlobalLimitModalEventDetail {
  globalUsed?: number;
  globalLimit?: number;
}

export function useLimitModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [eventData, setEventData] = useState<LimitModalEventDetail | null>(null);

  useEffect(() => {
    const handler = (e: CustomEvent<LimitModalEventDetail>) => {
      if (e.detail) setEventData(e.detail);
      setIsOpen(true);
    };
    window.addEventListener(LIMIT_MODAL_EVENT, handler as EventListener);
    return () => window.removeEventListener(LIMIT_MODAL_EVENT, handler as EventListener);
  }, []);

  return {
    isOpen,
    eventData,
    open: () => setIsOpen(true),
    close: () => { setIsOpen(false); setEventData(null); },
  };
}

export function useGlobalLimitModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [eventData, setEventData] = useState<GlobalLimitModalEventDetail | null>(null);

  useEffect(() => {
    const handler = (e: CustomEvent<GlobalLimitModalEventDetail>) => {
      if (e.detail) setEventData(e.detail);
      setIsOpen(true);
    };
    window.addEventListener(GLOBAL_LIMIT_MODAL_EVENT, handler as EventListener);
    return () => window.removeEventListener(GLOBAL_LIMIT_MODAL_EVENT, handler as EventListener);
  }, []);

  return {
    isOpen,
    eventData,
    open: () => setIsOpen(true),
    close: () => { setIsOpen(false); setEventData(null); },
  };
}



function getTimeUntilAstanaMidnight() {
  const ASTANA_OFFSET_MS = 5 * 60 * 60 * 1000;
  const now = new Date();
  const astanaNow = new Date(now.getTime() + ASTANA_OFFSET_MS);

  const astanaMidnight = new Date(Date.UTC(
    astanaNow.getUTCFullYear(),
    astanaNow.getUTCMonth(),
    astanaNow.getUTCDate() + 1,
    0, 0, 0, 0
  ));

  const resetUtc = new Date(astanaMidnight.getTime() - ASTANA_OFFSET_MS);

  const diff = resetUtc.getTime() - now.getTime();
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  return `${h} ч ${m} мин`;
}

// ─── Общие стили ─────────────────────────────────────────────────────────────

const MODAL_STYLES = `
  @keyframes lm-backdrop-in { from { opacity: 0; } to { opacity: 1; } }
  @keyframes lm-card-in { from { opacity: 0; transform: translateY(28px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
  @keyframes lm-backdrop-out { from { opacity: 1; } to { opacity: 0; } }
  @keyframes lm-card-out { from { opacity: 1; transform: translateY(0) scale(1); } to { opacity: 0; transform: translateY(28px) scale(0.96); } }
  @keyframes lm-pulse-ring { 0% { transform: scale(1); opacity: 0.6; } 100% { transform: scale(1.7); opacity: 0; } }
  @keyframes lm-icon-float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-6px); } }
  @keyframes lm-shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
  @keyframes lm-bar-fill { from { width: 0%; } to { width: 100%; } }

  .lm-backdrop {
    position: fixed; inset: 0; z-index: 99999;
    display: flex; align-items: center; justify-content: center; padding: 20px;
    background: rgba(0,0,0,0.75); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
  }
  .lm-backdrop.entering { animation: lm-backdrop-in 0.3s ease forwards; }
  .lm-backdrop.leaving { animation: lm-backdrop-out 0.35s ease forwards; }
  .lm-card {
    position: relative; width: 100%; max-width: 460px;
    background: #0f1117; border: 1px solid rgba(255,255,255,0.08);
    border-radius: 24px; padding: 40px 36px 32px;
    box-shadow: 0 0 0 1px rgba(255,255,255,0.04), 0 32px 80px rgba(0,0,0,0.6), 0 0 60px rgba(99,102,241,0.08);
    overflow: hidden;
  }
  .lm-card.entering { animation: lm-card-in 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards; }
  .lm-card.leaving { animation: lm-card-out 0.3s ease forwards; }
  .lm-card::before {
    content: ''; position: absolute; top: -80px; left: 50%; transform: translateX(-50%);
    width: 300px; height: 300px; pointer-events: none;
  }
  .lm-card.personal::before { background: radial-gradient(circle, rgba(239,68,68,0.12) 0%, transparent 70%); }
  .lm-card.global::before  { background: radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%); }
  .lm-top-bar {
    position: absolute; top: 0; left: 0; right: 0; height: 3px;
    background-size: 200% 100%; animation: lm-shimmer 2.5s linear infinite;
  }
  .lm-top-bar.personal { background-image: linear-gradient(90deg, #ef4444, #f97316, #ef4444); }
  .lm-top-bar.global   { background-image: linear-gradient(90deg, #f59e0b, #ef4444, #f59e0b); }
  .lm-icon-wrap { position: relative; width: 72px; height: 72px; margin: 0 auto 24px; }
  .lm-icon-ring {
    position: absolute; inset: 0; border-radius: 50%;
    animation: lm-pulse-ring 2s ease-out infinite;
  }
  .lm-icon-ring.personal { border: 2px solid rgba(239,68,68,0.4); }
  .lm-icon-ring.global   { border: 2px solid rgba(245,158,11,0.4); }
  .lm-icon-ring:nth-child(2) { animation-delay: 0.7s; }
  .lm-icon-circle {
    position: relative; z-index: 1; width: 100%; height: 100%; border-radius: 50%;
    display: flex; align-items: center; justify-content: center; font-size: 28px;
    animation: lm-icon-float 3s ease-in-out infinite;
  }
  .lm-icon-circle.personal {
    background: linear-gradient(135deg, rgba(239,68,68,0.2), rgba(239,68,68,0.08));
    border: 1px solid rgba(239,68,68,0.3);
  }
  .lm-icon-circle.global {
    background: linear-gradient(135deg, rgba(245,158,11,0.2), rgba(245,158,11,0.08));
    border: 1px solid rgba(245,158,11,0.3);
  }
  .lm-title { text-align: center; font-size: 22px; font-weight: 700; color: #f1f5f9; letter-spacing: -0.3px; margin-bottom: 10px; }
  .lm-subtitle { text-align: center; font-size: 14px; color: rgba(148,163,184,0.85); line-height: 1.6; margin-bottom: 28px; }
  .lm-progress-wrap { margin-bottom: 24px; }
  .lm-progress-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
  .lm-progress-label { font-size: 12px; color: rgba(148,163,184,0.7); font-weight: 500; }
  .lm-progress-count.personal { font-size: 12px; font-weight: 700; color: #ef4444; }
  .lm-progress-count.global   { font-size: 12px; font-weight: 700; color: #f59e0b; }
  .lm-progress-track { height: 6px; background: rgba(255,255,255,0.06); border-radius: 3px; overflow: hidden; }
  .lm-progress-fill {
    height: 100%; width: 100%; border-radius: 3px;
    animation: lm-bar-fill 0.8s cubic-bezier(0.22,1,0.36,1) 0.3s both;
  }
  .lm-progress-fill.personal { background: linear-gradient(90deg, #ef4444, #f97316); }
  .lm-progress-fill.global   { background: linear-gradient(90deg, #f59e0b, #ef4444); }
  .lm-info-block {
    display: flex; align-items: center; gap: 12px;
    background: rgba(99,102,241,0.07); border: 1px solid rgba(99,102,241,0.15);
    border-radius: 12px; padding: 14px 16px; margin-bottom: 28px;
  }
  .lm-info-icon { font-size: 20px; flex-shrink: 0; }
  .lm-info-text { font-size: 13px; color: rgba(148,163,184,0.9); line-height: 1.5; }
  .lm-info-text strong { color: #a5b4fc; font-weight: 600; }
  .lm-tips { margin-bottom: 28px; }
  .lm-tips-title { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: rgba(148,163,184,0.5); margin-bottom: 10px; font-weight: 600; }
  .lm-tip-item { display: flex; align-items: flex-start; gap: 8px; font-size: 13px; color: rgba(148,163,184,0.8); margin-bottom: 8px; line-height: 1.5; }
  .lm-tip-dot { width: 5px; height: 5px; border-radius: 50%; background: #6366f1; margin-top: 7px; flex-shrink: 0; }
  .lm-btn {
    width: 100%; padding: 14px; border-radius: 12px; border: none; cursor: pointer;
    font-size: 15px; font-weight: 600; letter-spacing: -0.2px; transition: all 0.2s ease;
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .lm-btn-primary { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; box-shadow: 0 8px 24px rgba(99,102,241,0.25); }
  .lm-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 12px 32px rgba(99,102,241,0.35); }
  .lm-close-btn {
    position: absolute; top: 16px; right: 16px; width: 32px; height: 32px; border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.04);
    color: rgba(148,163,184,0.6); cursor: pointer; display: flex; align-items: center; justify-content: center;
    font-size: 16px; transition: all 0.15s;
  }
  .lm-close-btn:hover { background: rgba(255,255,255,0.08); color: rgba(148,163,184,1); }
`;

// ─── Персональный лимит ───────────────────────────────────────────────────────

interface LimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  used?: number;
  dailyLimit?: number;
  eventData?: LimitModalEventDetail | null;
}

export function LimitModal({ isOpen, onClose, used = 0, dailyLimit = 20, eventData }: LimitModalProps) {
  const displayUsed  = eventData?.used      ?? used;
  const displayLimit = eventData?.dailyLimit ?? dailyLimit;

  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      requestAnimationFrame(() => setVisible(true));
      document.body.style.overflow = 'hidden';
    } else {
      setVisible(false);
      const t = setTimeout(() => { setMounted(false); document.body.style.overflow = ''; }, 350);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  if (!mounted) return null;

  return (
    <>
      <style>{MODAL_STYLES}</style>
      <div
        className={`lm-backdrop ${visible ? 'entering' : 'leaving'}`}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className={`lm-card personal ${visible ? 'entering' : 'leaving'}`}>
          <div className="lm-top-bar personal" />
          <button className="lm-close-btn" onClick={onClose}>✕</button>

          <div className="lm-icon-wrap">
            <div className="lm-icon-ring personal" />
            <div className="lm-icon-ring personal" />
            <div className="lm-icon-circle personal">🚫</div>
          </div>

          <div className="lm-title">Дневной лимит исчерпан</div>
          <div className="lm-subtitle">
            Вы использовали все доступные генерации на сегодня. Лимит обновится в&nbsp;полночь по&nbsp;Астане (UTC+5).
          </div>

          <div className="lm-progress-wrap">
            <div className="lm-progress-header">
              <span className="lm-progress-label">Использовано сегодня</span>
              <span className="lm-progress-count personal">{displayUsed} / {displayLimit}</span>
            </div>
            <div className="lm-progress-track">
              <div className="lm-progress-fill personal" />
            </div>
          </div>

          <div className="lm-info-block">
            <span className="lm-info-icon">🕐</span>
            <div className="lm-info-text">
              До сброса лимита осталось: <strong>{getTimeUntilAstanaMidnight()}</strong>
            </div>
          </div>

          <div className="lm-tips">
            <div className="lm-tips-title">Пока ждёте</div>
            <div className="lm-tip-item"><div className="lm-tip-dot" /><span>Проверьте уже созданные документы в редакторе Canvas</span></div>
            <div className="lm-tip-item"><div className="lm-tip-dot" /><span>Скачайте сгенерированные документы если ещё не скачали</span></div>
            <div className="lm-tip-item"><div className="lm-tip-dot" /><span>Подготовьте промпты для следующей сессии</span></div>
          </div>

          <button className="lm-btn lm-btn-primary" onClick={onClose}>
            <span>Понятно</span>
            <span>→</span>
          </button>
        </div>
      </div>
    </>
  );
}



interface GlobalLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventData?: GlobalLimitModalEventDetail | null;
}

export function GlobalLimitModal({ isOpen, onClose, eventData }: GlobalLimitModalProps) {
  const displayUsed  = eventData?.globalUsed  ?? 1000;
  const displayLimit = eventData?.globalLimit ?? 1000;

  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      requestAnimationFrame(() => setVisible(true));
      document.body.style.overflow = 'hidden';
    } else {
      setVisible(false);
      const t = setTimeout(() => { setMounted(false); document.body.style.overflow = ''; }, 350);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  if (!mounted) return null;

  return (
    <>
      <style>{MODAL_STYLES}</style>
      <div
        className={`lm-backdrop ${visible ? 'entering' : 'leaving'}`}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className={`lm-card global ${visible ? 'entering' : 'leaving'}`}>
          <div className="lm-top-bar global" />
          <button className="lm-close-btn" onClick={onClose}>✕</button>

          <div className="lm-icon-wrap">
            <div className="lm-icon-ring global" />
            <div className="lm-icon-ring global" />
            <div className="lm-icon-circle global">⚠️</div>
          </div>

          <div className="lm-title">Сервис временно недоступен</div>
          <div className="lm-subtitle">
            Сегодня все пользователи суммарно исчерпали дневной лимит генераций сервиса.
            Попробуйте завтра — лимит обновится в&nbsp;полночь по&nbsp;Астане (UTC+5).
          </div>

          <div className="lm-progress-wrap">
            <div className="lm-progress-header">
              <span className="lm-progress-label">Генераций использовано сегодня</span>
              <span className="lm-progress-count global">{displayUsed} / {displayLimit}</span>
            </div>
            <div className="lm-progress-track">
              <div className="lm-progress-fill global" />
            </div>
          </div>

          <div className="lm-info-block">
            <span className="lm-info-icon">🕐</span>
            <div className="lm-info-text">
              До сброса лимита осталось: <strong>{getTimeUntilAstanaMidnight()}</strong>
            </div>
          </div>

          <div className="lm-tips">
            <div className="lm-tips-title">Пока ждёте</div>
            <div className="lm-tip-item"><div className="lm-tip-dot" /><span>Проверьте уже созданные документы в редакторе Canvas</span></div>
            <div className="lm-tip-item"><div className="lm-tip-dot" /><span>Скачайте сгенерированные документы если ещё не скачали</span></div>
            <div className="lm-tip-item"><div className="lm-tip-dot" /><span>Подготовьте промпты — утром можно будет сразу начать</span></div>
          </div>

          <button className="lm-btn lm-btn-primary" onClick={onClose}>
            <span>Понятно</span>
            <span>→</span>
          </button>
        </div>
      </div>
    </>
  );
}