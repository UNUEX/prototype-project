// app/[lang]/canvas/sbs/PageDesign.tsx
// Apple × Meta redesign — white bg, wide layout, living effects, progressive detail form

export default function SBSPageStyles() {
  return (
    <style jsx global>{`

      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400&family=DM+Serif+Display:ital@0;1&display=swap');

      /* ═══════════════════════════════
         TOKENS
      ═══════════════════════════════ */
      :root {
        --font:            'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
        --font-display:    'DM Serif Display', Georgia, serif;

        --accent:          #5b5bd6;
        --accent-2:        #7c3aed;
        --accent-mid:      #6d5ce8;
        --accent-soft:     rgba(91,91,214,0.07);
        --accent-soft2:    rgba(91,91,214,0.12);
        --accent-glow:     rgba(91,91,214,0.20);
        --accent-border:   rgba(91,91,214,0.20);
        --accent-border2:  rgba(91,91,214,0.35);

        --green:           #0d9f6e;
        --green-soft:      rgba(13,159,110,0.08);
        --green-border:    rgba(13,159,110,0.25);

        --white:           #ffffff;
        --off-white:       #fafafb;
        --surface:         #f4f4f8;
        --surface-2:       #eeeef6;
        --border:          rgba(0,0,0,0.07);
        --border-2:        rgba(0,0,0,0.12);
        --text:            #0f0f1a;
        --text-2:          #52526b;
        --text-3:          #9494aa;
        --text-4:          #bbbbd0;

        /* Part 2 — unchanged */
        --light-bg:        #ffffff;
        --light-surface:   #ffffff;
        --light-border:    rgba(0,0,0,0.07);
        --light-border2:   rgba(0,0,0,0.12);
        --light-text:      #16151e;
        --light-text2:     #6b6a75;
        --light-text3:     #a5a4ae;

        --sh-xs:   0 1px 3px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.04);
        --sh-sm:   0 2px 8px rgba(0,0,0,0.07);
        --sh-md:   0 8px 24px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04);
        --sh-lg:   0 20px 52px rgba(0,0,0,0.09), 0 4px 12px rgba(0,0,0,0.04);
        --sh-acc:  0 8px 28px rgba(91,91,214,0.22), 0 2px 8px rgba(91,91,214,0.12);
        --sh-acc2: 0 16px 44px rgba(91,91,214,0.28), 0 4px 12px rgba(91,91,214,0.14);

        --spring: cubic-bezier(0.34,1.4,0.64,1);
        --smooth: cubic-bezier(0.4,0,0.2,1);
        --out:    cubic-bezier(0,0,0.2,1);

        --r-xs: 8px; --r-sm: 12px; --r-md: 16px;
        --r-lg: 22px; --r-xl: 30px; --r-2xl: 40px;
      }

      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

      /* ═══════════════════════════════
         PAGE
      ═══════════════════════════════ */
      .sbs-page {
        min-height: 100vh;
        font-family: var(--font);
        background: var(--white);
        color: var(--text);
        position: relative;
        overflow-x: hidden;
      }

      /* Ambient mesh background */
      .sbs-page::before {
        content: '';
        position: fixed; inset: 0;
        background:
          radial-gradient(ellipse 900px 600px at 15% 0%, rgba(91,91,214,0.055) 0%, transparent 60%),
          radial-gradient(ellipse 600px 500px at 85% 10%, rgba(124,58,237,0.04) 0%, transparent 55%),
          radial-gradient(ellipse 700px 400px at 50% 100%, rgba(13,159,110,0.03) 0%, transparent 60%);
        pointer-events: none; z-index: 0;
        animation: meshDrift 20s ease-in-out infinite alternate;
      }
      @keyframes meshDrift {
        0%   { opacity: 0.7; transform: scale(1); }
        100% { opacity: 1;   transform: scale(1.04) translate(10px, -8px); }
      }

      .sbs-main {
        position: relative; z-index: 1;
        max-width: 1280px; margin: 0 auto;
        padding: 0 40px 100px;
      }

      /* ═══════════════════════════════
         HERO HEADER  — Part 1
      ═══════════════════════════════ */
      .sbs-header {
        padding: 80px 0 56px;
        position: relative;
        display: grid;
        grid-template-columns: 1fr auto;
        align-items: center;
        gap: 48px;
      }

      .sbs-header-left { position: relative; }

      /* Eyebrow badge */
      .sbs-badge {
        display: inline-flex; align-items: center; gap: 7px;
        padding: 6px 16px;
        background: var(--accent-soft2);
        border: 1px solid var(--accent-border2);
        border-radius: 100px;
        color: var(--accent);
        font-size: 11.5px; font-weight: 700;
        letter-spacing: 0.07em; text-transform: uppercase;
        margin-bottom: 22px;
        animation: fadeSlideUp 0.6s var(--spring) both;
      }
      .sbs-badge-dot {
        width: 6px; height: 6px; border-radius: 50%;
        background: var(--accent);
        animation: badgePulse 2.2s ease infinite;
      }
      @keyframes badgePulse { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:0.4;transform:scale(0.65);} }

      /* Title — DM Serif Display for premium feel */
      .sbs-title {
        font-family: var(--font-display);
        font-size: clamp(2.6rem, 4.5vw, 4rem);
        font-weight: 400;
        line-height: 1.06;
        letter-spacing: -0.02em;
        color: var(--text);
        margin-bottom: 18px;
        animation: fadeSlideUp 0.7s var(--spring) 0.07s both;
      }
      .sbs-title em {
        font-style: italic;
        background: linear-gradient(135deg, #5b5bd6 0%, #7c3aed 45%, #a855f7 100%);
        -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        background-clip: text;
        background-size: 200%;
        animation: gradShift 5s ease infinite;
      }
      @keyframes gradShift { 0%,100%{background-position:0% 50%;} 50%{background-position:100% 50%;} }

      .sbs-subtitle {
        font-size: 1.1rem; color: var(--text-2);
        max-width: 500px;
        line-height: 1.75; font-weight: 400;
        animation: fadeSlideUp 0.7s var(--spring) 0.13s both;
      }

      /* Hero stats — right column */
      .sbs-hero-stats {
        display: flex; flex-direction: column; gap: 10px;
        animation: fadeSlideUp 0.7s var(--spring) 0.18s both;
      }
      .sbs-stat {
        display: flex; align-items: center; gap: 14px;
        padding: 14px 20px;
        background: var(--white);
        border: 1px solid var(--border);
        border-radius: var(--r-lg);
        box-shadow: var(--sh-xs);
        transition: all 0.28s var(--spring);
        min-width: 200px;
      }
      .sbs-stat:hover {
        border-color: var(--accent-border2);
        box-shadow: var(--sh-acc);
        transform: translateX(-4px);
      }
      .sbs-stat-icon {
        width: 38px; height: 38px; border-radius: var(--r-sm);
        background: var(--accent-soft2);
        display: flex; align-items: center; justify-content: center;
        color: var(--accent); font-size: 1rem; flex-shrink: 0;
      }
      .sbs-stat-body { display: flex; flex-direction: column; gap: 1px; }
      .sbs-stat-num {
        font-size: 1.35rem; font-weight: 800; letter-spacing: -0.03em;
        color: var(--text);
        font-family: var(--font-display);
        font-style: italic;
      }
      .sbs-stat-label { font-size: 0.72rem; color: var(--text-3); font-weight: 500; text-transform: uppercase; letter-spacing: 0.06em; }

      /* ═══════════════════════════════
         GEN BLOCK — white card
      ═══════════════════════════════ */
      .gen-block {
        position: relative;
        background: var(--white);
        border: 1px solid var(--border);
        border-radius: var(--r-2xl);
        overflow: hidden;
        padding: 40px 44px 44px;
        margin-bottom: 32px;
        box-shadow: var(--sh-lg);
        animation: fadeSlideUp 0.7s var(--spring) 0.1s both;
        transition: box-shadow 0.35s;
      }
      .gen-block:hover { box-shadow: 0 28px 64px rgba(0,0,0,0.10), 0 6px 18px rgba(0,0,0,0.05); }

      /* Top shimmer line */
      .gen-block::before {
        content: '';
        position: absolute; top: 0; left: 0; right: 0; height: 2px;
        background: linear-gradient(90deg,
          transparent 0%, var(--accent) 30%,
          var(--accent-2) 70%, transparent 100%
        );
        opacity: 0.6;
      }

      /* Floating orbs */
      .gen-block-bg { position: absolute; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; border-radius: var(--r-2xl); }
      .gen-sphere { position: absolute; border-radius: 50%; filter: blur(72px); }
      .gen-sphere-1 { width: 380px; height: 380px; background: radial-gradient(circle, rgba(91,91,214,0.06), transparent); top: -140px; left: -80px; animation: orbFloat 14s ease-in-out infinite; }
      .gen-sphere-2 { width: 260px; height: 260px; background: radial-gradient(circle, rgba(124,58,237,0.05), transparent); bottom: -80px; right: -60px; animation: orbFloat 18s ease-in-out infinite reverse; }
      .gen-sphere-3 { width: 180px; height: 180px; background: radial-gradient(circle, rgba(13,159,110,0.04), transparent); top: 40%; left: 58%; animation: orbFloat 11s ease-in-out infinite 3s; }
      @keyframes orbFloat { 0%,100%{transform:translate(0,0) scale(1);} 50%{transform:translate(22px,-14px) scale(1.06);} }

      .gen-block-inner { position: relative; z-index: 1; }

      /* Block top label */
      .gen-block-top {
        display: flex; align-items: center; justify-content: space-between;
        margin-bottom: 32px;
      }
      .gen-block-label {
        display: flex; align-items: center; gap: 8px;
        font-size: 0.8rem; font-weight: 700; text-transform: uppercase;
        letter-spacing: 0.09em; color: var(--text-3);
      }
      .gen-block-label-dot {
        width: 8px; height: 8px; border-radius: 50%;
        background: linear-gradient(135deg, var(--accent), var(--accent-2));
        box-shadow: 0 0 8px rgba(91,91,214,0.4);
        animation: badgePulse 2s ease infinite;
      }
      .gen-block-desc { font-size: 0.875rem; color: var(--text-3); }

      /* ═══════════════════════════════
         SEGMENT CONTROLS (Apple style)
      ═══════════════════════════════ */

      /* Mode switcher */
      .gen-mode-switcher {
        display: inline-flex; align-items: center;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--r-xl);
        padding: 4px;
        gap: 2px;
        margin-bottom: 24px;
      }
      .gen-mode-btn {
        display: flex; align-items: center; gap: 9px;
        padding: 10px 20px;
        background: transparent;
        border: none; border-radius: 18px;
        cursor: pointer; font-family: var(--font);
        color: var(--text-2); font-size: 0.88rem; font-weight: 500;
        transition: all 0.22s var(--smooth);
        white-space: nowrap; position: relative;
      }
      .gen-mode-btn .gm-icon {
        width: 28px; height: 28px; border-radius: 8px;
        background: transparent;
        display: flex; align-items: center; justify-content: center;
        font-size: 0.8rem; color: var(--text-3);
        transition: all 0.22s var(--smooth);
      }
      .gen-mode-btn .gm-text { display: flex; flex-direction: column; gap: 1px; text-align: left; }
      .gen-mode-btn .gm-name { font-weight: 600; font-size: 0.875rem; color: var(--text-2); transition: color 0.2s; }
      .gen-mode-btn .gm-hint { font-size: 0.71rem; color: var(--text-4); }

      .gen-mode-btn.active {
        background: var(--white);
        box-shadow: 0 2px 10px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05);
      }
      .gen-mode-btn.active .gm-icon {
        background: var(--accent-soft2);
        color: var(--accent);
      }
      .gen-mode-btn.active .gm-name { color: var(--text); }
      .gen-mode-btn:not(.active):hover { background: rgba(0,0,0,0.03); }

      /* Doc type pills */
      .gen-doctype-row {
        display: flex; align-items: center; gap: 8px;
        margin-bottom: 28px;
      }
      .gen-doctype-label {
        font-size: 0.76rem; font-weight: 600; text-transform: uppercase;
        letter-spacing: 0.07em; color: var(--text-4); margin-right: 4px;
      }
      .gen-pill {
        display: flex; align-items: center; gap: 7px;
        padding: 7px 16px;
        background: var(--off-white);
        border: 1px solid var(--border);
        border-radius: 100px;
        color: var(--text-2); font-size: 0.85rem; font-weight: 500;
        font-family: var(--font); cursor: pointer;
        transition: all 0.2s var(--smooth);
      }
      .gen-pill:hover { border-color: var(--accent-border); color: var(--accent); background: var(--accent-soft); }
      .gen-pill.active {
        background: var(--accent); border-color: var(--accent);
        color: #fff; font-weight: 600;
        box-shadow: var(--sh-acc);
      }
      .gen-pill svg { font-size: 0.78rem; }

      /* ═══════════════════════════════
         QUICK PANEL
      ═══════════════════════════════ */
      .quick-panel {
        animation: panelReveal 0.38s var(--spring) both;
      }
      @keyframes panelReveal {
        from { opacity: 0; transform: translateY(12px); }
        to   { opacity: 1; transform: translateY(0); }
      }

      /* Prompt field */
      .prompt-wrap {
        position: relative;
        background: var(--off-white);
        border: 1.5px solid var(--border);
        border-radius: var(--r-xl);
        overflow: hidden;
        margin-bottom: 20px;
        transition: border-color 0.28s, box-shadow 0.28s;
      }
      .prompt-wrap:focus-within,
      .prompt-wrap.filled {
        border-color: var(--accent-border2);
        box-shadow: 0 0 0 4px rgba(91,91,214,0.08), var(--sh-acc);
        background: var(--white);
      }

      .prompt-header {
        display: flex; align-items: center; justify-content: space-between;
        padding: 14px 20px 10px;
      }
      .prompt-header-left {
        display: flex; align-items: center; gap: 10px;
      }
      .prompt-header-icon {
        width: 30px; height: 30px; border-radius: 9px;
        background: var(--accent-soft2); border: 1px solid var(--accent-border);
        display: flex; align-items: center; justify-content: center;
        color: var(--accent); font-size: 0.78rem;
        transition: all 0.25s var(--spring);
      }
      .prompt-wrap:focus-within .prompt-header-icon {
        background: var(--accent); color: #fff;
        box-shadow: 0 0 14px rgba(91,91,214,0.3);
        transform: rotate(-8deg) scale(1.08);
      }
      .prompt-header-title { font-size: 0.82rem; font-weight: 600; color: var(--text-2); }
      .prompt-counter { font-size: 0.74rem; color: var(--text-4); font-variant-numeric: tabular-nums; }
      .prompt-counter b { color: var(--accent); font-weight: 700; }

      .prompt-textarea {
        width: 100%; 
        background: transparent; 
        border: none; 
        outline: none;
        padding: 8px 20px 16px;
        color: var(--text); 
        font-size: 0.95rem; 
        font-family: 
        var(--font);
        line-height: 1.7; resize: none; min-height: 110px;
          color: #000000 !important; /* Черный цвет текста */
  background: #ffffff !important; /* Белый фон */
  font-weight: 400;
      }
      .prompt-textarea::placeholder { 
      color: var(--text-4); }

      /* Animated bottom bar */
      .prompt-shine {
        height: 2px;
        background: linear-gradient(90deg, var(--accent) 0%, var(--accent-2) 50%, #a855f7 100%);
        transform: scaleX(0); transform-origin: left;
        transition: transform 0.5s var(--smooth);
      }
      .prompt-wrap.filled .prompt-shine,
      .prompt-wrap:focus-within .prompt-shine { transform: scaleX(1); }

      .prompt-footer {
        display: flex; align-items: center; justify-content: space-between;
        flex-wrap: wrap; gap: 10px;
        padding: 12px 20px 14px;
        border-top: 1px solid var(--border);
      }
      .prompt-chips { display: flex; gap: 6px; flex-wrap: wrap; }
      .prompt-chip {
        display: flex; align-items: center; gap: 5px;
        padding: 4px 10px;
        background: var(--white); border: 1px solid var(--border);
        border-radius: 100px; font-size: 0.72rem; color: var(--text-3); font-weight: 500;
      }
      .prompt-chip svg { font-size: 0.65rem; }

      .prompt-gen-btn {
        display: flex; align-items: center; gap: 8px;
        padding: 11px 26px;
        background: linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 100%);
        border: none; border-radius: 100px;
        color: #fff; font-size: 0.875rem; font-weight: 700;
        font-family: var(--font); cursor: pointer;
        transition: all 0.28s var(--spring);
        position: relative; overflow: hidden; letter-spacing: 0.01em;
        box-shadow: var(--sh-acc);
      }
      .prompt-gen-btn::after {
        content: ''; position: absolute; inset: 0;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
        transform: translateX(-100%); transition: transform 0.6s;
      }
      .prompt-gen-btn:hover:not(:disabled)::after { transform: translateX(100%); }
      .prompt-gen-btn:hover:not(:disabled) { transform: translateY(-3px) scale(1.02); box-shadow: var(--sh-acc2); }
      .prompt-gen-btn:active:not(:disabled) { transform: translateY(-1px) scale(0.99); }
      .prompt-gen-btn:disabled { opacity: 0.3; cursor: not-allowed; }
      .btn-spinner {
        width: 14px; height: 14px;
        border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff;
        border-radius: 50%; animation: spin 0.6s linear infinite;
      }
      @keyframes spin { to { transform: rotate(360deg); } }
      .btn-arrow { font-size: 0.75rem; transition: transform 0.25s; }
      .prompt-gen-btn:hover .btn-arrow { transform: translateX(4px); }

      /* Quick bottom grid */
      .quick-bottom-grid {
        display: grid;
        grid-template-columns: 280px 1fr;
        gap: 16px;
      }

      /* Tips card */
      .tips-card {
        background: var(--off-white);
        border: 1px solid var(--border);
        border-radius: var(--r-lg);
        padding: 18px 20px;
      }
      .tips-card-header {
        display: flex; align-items: center; gap: 7px;
        margin-bottom: 14px;
      }
      .tips-card-icon {
        width: 26px; height: 26px; border-radius: 7px;
        background: #fef3c7; border: 1px solid rgba(245,158,11,0.25);
        display: flex; align-items: center; justify-content: center;
        font-size: 0.75rem; color: #d97706;
      }
      .tips-card-title { font-size: 0.73rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-3); }
      .tips-list { display: flex; flex-direction: column; gap: 5px; }
      .tip-row {
        display: flex; align-items: center; gap: 8px;
        font-size: 0.815rem; color: var(--text-2);
        padding: 5px 8px; border-radius: 8px;
        transition: all 0.18s;
        animation: tipSlide 0.4s var(--out) both;
      }
      .tip-row:hover { background: var(--white); color: var(--text); }
      @keyframes tipSlide { from{opacity:0;transform:translateX(-6px);} to{opacity:1;transform:translateX(0);} }
      .tip-bullet {
        width: 5px; height: 5px; border-radius: 50%;
        background: var(--accent); opacity: 0.55; flex-shrink: 0;
      }

      /* Examples card */
      .examples-card {
        background: var(--off-white);
        border: 1px solid var(--border);
        border-radius: var(--r-lg);
        padding: 18px 20px;
        overflow: hidden;
      }
      .examples-card-header {
        display: flex; align-items: center; gap: 7px;
        margin-bottom: 14px;
      }
      .examples-card-icon {
        width: 26px; height: 26px; border-radius: 7px;
        background: var(--accent-soft2); border: 1px solid var(--accent-border);
        display: flex; align-items: center; justify-content: center;
        font-size: 0.72rem; color: var(--accent);
      }
      .examples-card-title { font-size: 0.73rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-3); }
      .examples-list { display: flex; flex-direction: column; gap: 6px; }

      .example-row {
        display: flex; align-items: stretch;
        background: var(--white); border: 1px solid var(--border);
        border-radius: var(--r-md); cursor: pointer; overflow: hidden;
        transition: all 0.22s var(--spring);
        animation: exSlide 0.4s var(--out) both;
      }
      @keyframes exSlide { from{opacity:0;transform:translateX(6px);} to{opacity:1;transform:translateX(0);} }
      .example-row:hover {
        border-color: var(--accent-border2);
        transform: translateX(-3px);
        box-shadow: 0 4px 16px rgba(91,91,214,0.1);
      }
      .example-row-body { flex: 1; padding: 10px 14px; display: flex; flex-direction: column; gap: 3px; }
      .example-row-top { display: flex; align-items: center; gap: 6px; }
      .example-tag-emoji { font-size: 0.85rem; }
      .example-tag-label { font-size: 0.7rem; font-weight: 700; color: var(--accent); text-transform: uppercase; letter-spacing: 0.05em; }
      .example-text { font-size: 0.79rem; color: var(--text-2); line-height: 1.45; }
      .example-hint { font-size: 0.67rem; color: var(--text-4); font-style: italic; padding-left: 6px; border-left: 2px solid var(--accent-border); margin-top: 2px; }
      .example-apply {
        width: 38px; display: flex; align-items: center; justify-content: center;
        background: var(--off-white); border-left: 1px solid var(--border);
        color: var(--text-4); font-size: 0.72rem; flex-shrink: 0;
        transition: all 0.2s;
      }
      .example-row:hover .example-apply { background: var(--accent-soft2); color: var(--accent); }

      /* ═══════════════════════════════
         DETAILED PANEL — Progressive reveal
      ═══════════════════════════════ */
      .detailed-panel {
        animation: panelReveal 0.38s var(--spring) both;
      }

      /* Section steps header */
      .detail-steps-bar {
        display: flex; align-items: center; gap: 0;
        margin-bottom: 32px;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--r-xl);
        padding: 6px;
        overflow: hidden;
      }
      .detail-step-pill {
        flex: 1; display: flex; align-items: center; justify-content: center; gap: 7px;
        padding: 9px 14px; border-radius: 14px;
        font-size: 0.8rem; font-weight: 600; color: var(--text-4);
        transition: all 0.3s var(--spring); white-space: nowrap;
        position: relative;
      }
      .detail-step-pill .dsp-num {
        width: 22px; height: 22px; border-radius: 50%;
        background: var(--border); color: var(--text-4);
        display: flex; align-items: center; justify-content: center;
        font-size: 0.72rem; font-weight: 800; flex-shrink: 0;
        transition: all 0.3s var(--spring);
      }
      .detail-step-pill.active {
        background: var(--white);
        color: var(--accent);
        box-shadow: 0 2px 10px rgba(0,0,0,0.07);
      }
      .detail-step-pill.active .dsp-num {
        background: var(--accent); color: #fff;
        box-shadow: 0 0 10px rgba(91,91,214,0.3);
        transform: scale(1.1);
      }
      .detail-step-pill.done { color: var(--green); }
      .detail-step-pill.done .dsp-num {
        background: var(--green); color: #fff;
        box-shadow: 0 0 8px rgba(13,159,110,0.25);
      }

      /* Section container */
      .detail-section {
        margin-bottom: 28px;
        animation: sectionReveal 0.5s var(--spring) both;
      }
      @keyframes sectionReveal {
        from { opacity: 0; transform: translateY(18px) scale(0.99); }
        to   { opacity: 1; transform: translateY(0) scale(1); }
      }
      .detail-section.locked {
        opacity: 0.35;
        pointer-events: none;
        filter: blur(1px);
        animation: none;
        transform: none;
      }

      .detail-section-header {
        display: flex; align-items: center; gap: 12px;
        margin-bottom: 18px;
      }
      .detail-section-num {
        width: 32px; height: 32px; border-radius: 50%;
        background: linear-gradient(135deg, var(--accent), var(--accent-2));
        color: #fff; font-size: 0.78rem; font-weight: 800;
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 4px 12px rgba(91,91,214,0.25);
        flex-shrink: 0;
      }
      .detail-section.locked .detail-section-num {
        background: var(--surface-2);
        color: var(--text-4);
        box-shadow: none;
      }
      .detail-section-title { font-size: 1rem; font-weight: 700; color: var(--text); }
      .detail-section-desc { font-size: 0.8rem; color: var(--text-3); margin-top: 1px; }

      /* Card-style field */
      .field-card {
        position: relative;
        background: var(--white);
        border: 1.5px solid var(--border);
        border-radius: var(--r-lg);
        padding: 16px 20px;
        transition: all 0.25s var(--spring);
        overflow: hidden;
      }
      .field-card::before {
        content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
        background: linear-gradient(to bottom, var(--accent), var(--accent-2));
        transform: scaleY(0); transform-origin: top;
        transition: transform 0.3s var(--spring);
        border-radius: 0 2px 2px 0;
      }
      .field-card:focus-within {
        border-color: var(--accent-border2);
        box-shadow: 0 0 0 3px rgba(91,91,214,0.07), var(--sh-sm);
        transform: translateY(-1px);
      }
      .field-card:focus-within::before { transform: scaleY(1); }

      .field-card-label {
        display: flex; align-items: center; gap: 6px;
        font-size: 0.73rem; font-weight: 700; text-transform: uppercase;
        letter-spacing: 0.07em; color: var(--text-3); margin-bottom: 8px;
      }
      .field-card-label svg { font-size: 0.7rem; color: var(--accent); opacity: 0.7; }
      .field-card-input {
        width: 100%; background: transparent; border: none; outline: none;
        font-size: 0.95rem; font-family: var(--font); color: var(--text);
        line-height: 1.5; padding: 0;
      }
      .field-card-input::placeholder { color: var(--text-4); }
      .field-card-hint { font-size: 0.72rem; color: var(--text-4); margin-top: 6px; font-style: italic; }

      /* Fields grid */
      .fields-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
      .fields-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
      .field-full { grid-column: 1 / -1; }

      /* Toggle card (for yes/no choices) */
      .toggle-cards { display: flex; gap: 10px; flex-wrap: wrap; }
      .toggle-card {
        display: flex; align-items: center; gap: 10px;
        padding: 12px 18px;
        background: var(--off-white);
        border: 1.5px solid var(--border);
        border-radius: var(--r-md);
        cursor: pointer; font-family: var(--font);
        color: var(--text-2); font-size: 0.875rem; font-weight: 500;
        transition: all 0.22s var(--spring);
        flex: 1; min-width: 140px;
      }
      .toggle-card:hover { border-color: var(--accent-border); background: var(--accent-soft); }
      .toggle-card.active {
        background: var(--accent-soft2);
        border-color: var(--accent-border2);
        color: var(--accent); font-weight: 600;
        box-shadow: 0 0 0 3px rgba(91,91,214,0.06);
      }
      .toggle-card-check {
        width: 18px; height: 18px; border-radius: 50%;
        border: 2px solid var(--border-2); flex-shrink: 0;
        display: flex; align-items: center; justify-content: center;
        transition: all 0.22s var(--spring); font-size: 0.65rem;
      }
      .toggle-card.active .toggle-card-check {
        background: var(--accent); border-color: var(--accent); color: #fff;
        box-shadow: 0 0 8px rgba(91,91,214,0.3);
        transform: scale(1.1);
      }

      /* Number input cards */
      .number-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; }
      .number-card {
        background: var(--white);
        border: 1.5px solid var(--border);
        border-radius: var(--r-lg);
        padding: 14px 16px;
        transition: all 0.25s var(--spring);
        position: relative; overflow: hidden;
      }
      .number-card:focus-within {
        border-color: var(--accent-border2);
        box-shadow: 0 0 0 3px rgba(91,91,214,0.07);
        transform: translateY(-2px);
      }
      .number-card-label { font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: var(--text-4); margin-bottom: 6px; }
      .number-card-input {
        width: 100%; background: transparent; border: none; outline: none;
        font-size: 1.6rem; font-family: var(--font-display); font-style: italic;
        font-weight: 400; color: var(--text); letter-spacing: -0.02em;
        padding: 0; line-height: 1.2;
      }
      .number-card-input::placeholder { color: var(--text-4); font-style: normal; font-size: 1.2rem; }
      .number-card-unit { font-size: 0.72rem; color: var(--text-4); margin-top: 3px; }

      /* Section completion indicator */
      .section-complete-badge {
        display: inline-flex; align-items: center; gap: 6px;
        padding: 4px 12px;
        background: var(--green-soft);
        border: 1px solid var(--green-border);
        border-radius: 100px;
        color: var(--green); font-size: 0.74rem; font-weight: 600;
        animation: badgeIn 0.4s var(--spring) both;
      }
      @keyframes badgeIn { from{opacity:0;transform:scale(0.8);} to{opacity:1;transform:scale(1);} }

      /* Next section button */
      .detail-next-btn {
        display: inline-flex; align-items: center; gap: 8px;
        padding: 10px 22px; margin-top: 20px;
        background: var(--accent-soft2);
        border: 1px solid var(--accent-border2);
        border-radius: 100px;
        color: var(--accent); font-size: 0.875rem; font-weight: 700;
        font-family: var(--font); cursor: pointer;
        transition: all 0.25s var(--spring);
      }
      .detail-next-btn:hover {
        background: var(--accent); color: #fff;
        box-shadow: var(--sh-acc); transform: translateY(-2px);
      }

      /* Detail header strip */
      .detailed-header-strip {
        display: flex; align-items: center; gap: 12px; padding: 14px 18px;
        background: var(--accent-soft);
        border: 1px solid var(--accent-border);
        border-radius: var(--r-lg); margin-bottom: 28px;
      }
      .dhs-icon {
        width: 36px; height: 36px; border-radius: 10px;
        background: var(--accent-soft2); border: 1px solid var(--accent-border2);
        display: flex; align-items: center; justify-content: center;
        color: var(--accent); font-size: 0.875rem; flex-shrink: 0;
      }
      .dhs-info { display: flex; flex-direction: column; gap: 1px; flex: 1; }
      .dhs-info strong { font-size: 0.875rem; font-weight: 700; color: var(--text); }
      .dhs-info span { font-size: 0.77rem; color: var(--text-3); }
      .dhs-kz {
        display: flex; align-items: center; gap: 5px; padding: 5px 12px;
        background: var(--green-soft); border: 1px solid var(--green-border);
        border-radius: 100px; font-size: 0.73rem; font-weight: 700; color: var(--green); white-space: nowrap;
      }

      /* ═══════════════════════════════
         SEPARATOR
      ═══════════════════════════════ */
      .block-separator {
        display: flex; align-items: center; gap: 16px;
        margin: 8px 0 28px;
      }
      .separator-line {
        flex: 1; height: 1px;
        background: linear-gradient(90deg, transparent, var(--border), var(--accent-border), var(--border), transparent);
      }
      .separator-icon {
        width: 34px; height: 34px; border-radius: 50%;
        background: var(--white); border: 1px solid var(--border);
        box-shadow: var(--sh-xs);
        display: flex; align-items: center; justify-content: center;
        color: var(--text-4); font-size: 0.72rem;
        animation: sepBounce 2.8s ease-in-out infinite;
      }
      @keyframes sepBounce { 0%,100%{transform:translateY(0);} 50%{transform:translateY(5px);} }

      /* ═══════════════════════════════
         CONTENT BLOCK — Part 2 (UNCHANGED)
      ═══════════════════════════════ */
      .content-block {
        position: relative;
        background: var(--light-surface);
        border: 1px solid var(--light-border);
        border-radius: var(--r-xl); overflow: hidden;
        margin-bottom: 20px;
        box-shadow: var(--sh-md);
        animation: fadeSlideUp 0.6s var(--spring) both;
        transition: box-shadow 0.3s, border-color 0.3s;
      }
      .content-block:hover { box-shadow: var(--sh-lg); border-color: rgba(91,91,214,0.12); }
      .content-block::before {
        content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
        background: linear-gradient(90deg, transparent, rgba(91,91,214,0.45), rgba(124,58,237,0.45), transparent);
        opacity: 0; transition: opacity 0.35s;
      }
      .content-block:hover::before { opacity: 1; }

      .block-header {
        display: flex; align-items: center; gap: 14px; padding: 20px 24px;
        background: rgba(91,91,214,0.02); border-bottom: 1px solid var(--light-border);
      }
      .block-icon {
        width: 44px; height: 44px; border-radius: var(--r-sm);
        background: linear-gradient(135deg, rgba(91,91,214,0.10), rgba(124,58,237,0.06));
        border: 1px solid rgba(91,91,214,0.16);
        display: flex; align-items: center; justify-content: center;
        font-size: 1.2rem; color: var(--accent); flex-shrink: 0;
        box-shadow: 0 0 12px rgba(91,91,214,0.08);
        transition: transform 0.25s var(--spring);
      }
      .content-block:hover .block-icon { transform: scale(1.08) rotate(-3deg); }
      .block-title { font-size: 1.05rem; font-weight: 700; color: var(--light-text); margin-bottom: 2px; letter-spacing: -0.01em; }
      .block-subtitle { color: var(--light-text2); font-size: 0.825rem; }

      .syllabus-flow-content { padding: 24px; }

      /* ─── PROGRESS TRACK ─── */
      .sbs-progress-track {
        display: flex; align-items: center; justify-content: center;
        margin: 0 0 28px; padding: 16px 20px;
        background: var(--light-surface); border: 1px solid var(--light-border);
        border-radius: var(--r-md); gap: 0; box-shadow: var(--sh-xs);
      }
      .progress-step { display: flex; flex-direction: column; align-items: center; gap: 5px; position: relative; z-index: 1; }
      .step-indicator {
        width: 40px; height: 40px; border-radius: 50%;
        background: #f0eff9; border: 1.5px solid var(--light-border2);
        display: flex; align-items: center; justify-content: center;
        font-weight: 700; font-size: 0.82rem; color: var(--light-text3);
        transition: all 0.4s var(--spring);
      }
      .progress-step.active .step-indicator {
        background: linear-gradient(135deg, var(--accent), var(--accent-2));
        border-color: transparent; color: #fff;
        box-shadow: 0 0 0 4px rgba(91,91,214,0.14), 0 0 20px rgba(91,91,214,0.32);
        transform: scale(1.12);
      }
      .progress-step.completed .step-indicator {
        background: linear-gradient(135deg, #10b981, #059669);
        border-color: transparent; color: #fff;
        box-shadow: 0 0 14px rgba(16,185,129,0.28);
      }
      .step-label { font-size: 0.7rem; color: var(--light-text3); font-weight: 500; white-space: nowrap; }
      .progress-step.active .step-label { color: var(--accent); font-weight: 700; }
      .progress-step.completed .step-label { color: #059669; }
      .progress-line {
        flex: 1; min-width: 28px; height: 2px;
        background: var(--light-border2); border-radius: 1px;
        transition: background 0.5s;
      }
      .progress-line.active { background: linear-gradient(90deg, #10b981, #059669); }

      /* ─── SBS STEP CONTENT ─── */
      .sbs-step-content { animation: fadeSlideUp 0.4s var(--spring) both; }

      /* Upload */
      .upload-area {
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        padding: 52px 28px; border: 2px dashed rgba(91,91,214,0.2); border-radius: var(--r-md);
        cursor: pointer; transition: all 0.3s var(--spring);
        position: relative; overflow: hidden; background: rgba(91,91,214,0.01);
      }
      .upload-area::before {
        content: ''; position: absolute; inset: 0;
        background: radial-gradient(ellipse at center, rgba(91,91,214,0.05) 0%, transparent 65%);
        opacity: 0; transition: opacity 0.28s;
      }
      .upload-area:hover::before { opacity: 1; }
      .upload-area:hover { border-color: rgba(91,91,214,0.45); background: rgba(91,91,214,0.025); }
      .upload-icon-wrapper {
        width: 80px; height: 80px; border-radius: 50%;
        background: rgba(91,91,214,0.08); border: 1px solid rgba(91,91,214,0.16);
        display: flex; align-items: center; justify-content: center; margin-bottom: 20px;
        transition: all 0.32s var(--spring); box-shadow: 0 0 20px rgba(91,91,214,0.07);
      }
      .upload-area:hover .upload-icon-wrapper {
        transform: scale(1.12) translateY(-4px);
        background: rgba(91,91,214,0.15); box-shadow: 0 0 32px rgba(91,91,214,0.2);
      }
      .upload-icon { font-size: 2rem; color: var(--accent); }
      .upload-title { font-size: 1.3rem; font-weight: 700; color: var(--light-text); margin-bottom: 6px; letter-spacing: -0.01em; }
      .upload-description { color: var(--light-text2); margin-bottom: 8px; text-align: center; font-size: 0.9rem; }
      .upload-hint { color: var(--light-text3); font-size: 0.8rem; margin-bottom: 24px; }
      .upload-btn {
        display: flex; align-items: center; gap: 8px; padding: 11px 24px;
        background: linear-gradient(135deg, var(--accent), var(--accent-2));
        border: none; border-radius: 100px;
        color: #fff; font-weight: 700; font-size: 0.9rem; cursor: pointer; font-family: var(--font);
        transition: all 0.28s var(--spring); position: relative; overflow: hidden;
        box-shadow: var(--sh-acc);
      }
      .upload-btn:hover { transform: translateY(-3px); box-shadow: var(--sh-acc2); }

      /* Parse */
      .parse-animation { display: flex; flex-direction: column; align-items: center; padding: 20px 0; color: var(--light-text); }
      .parse-spinner { position: relative; width: 110px; height: 110px; display: flex; align-items: center; justify-content: center; margin-bottom: 24px; }
      .brain-icon { font-size: 2.8rem; color: var(--accent); z-index: 2; animation: brainPulse 2s ease-in-out infinite; }
      @keyframes brainPulse { 0%,100%{opacity:1;transform:scale(1);filter:drop-shadow(0 0 6px rgba(91,91,214,0.5));} 50%{opacity:0.75;transform:scale(0.94);filter:drop-shadow(0 0 14px rgba(91,91,214,0.8));} }
      .spinner-ring {
        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        border: 2.5px solid transparent; border-top-color: var(--accent); border-right-color: var(--accent-2);
        border-radius: 50%; animation: spin 1.6s linear infinite;
      }
      .parse-title { font-size: 1.4rem; font-weight: 700; margin-bottom: 6px; color: var(--light-text); letter-spacing: -0.015em; }
      .parse-subtitle { color: var(--light-text2); margin-bottom: 24px; text-align: center; }
      .parse-progress { width: 100%; max-width: 380px; display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
      .progress-bar { flex: 1; height: 4px; background: rgba(91,91,214,0.08); border-radius: 2px; overflow: hidden; }
      .progress-fill {
        height: 100%; background: linear-gradient(90deg, var(--accent), var(--accent-2), #a855f7);
        background-size: 200%; border-radius: 2px; transition: width 0.3s var(--smooth);
        animation: progressShimmer 2.2s linear infinite;
      }
      @keyframes progressShimmer { 0%{background-position:0%;} 100%{background-position:200%;} }
      .progress-text { font-weight: 700; color: var(--accent); font-size: 0.875rem; }
      .parse-messages { color: var(--light-text3); font-size: 0.875rem; }

      /* Select */
      .select-header {
        display: flex; justify-content: space-between; align-items: center;
        margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--light-border);
      }
      .syllabus-info { display: flex; align-items: center; gap: 12px; }
      .syllabus-icon { font-size: 1.4rem; color: var(--accent); }
      .syllabus-title { font-size: 1rem; font-weight: 700; color: var(--light-text); margin-bottom: 2px; }
      .syllabus-meta { color: var(--light-text2); font-size: 0.825rem; }
      .select-actions { display: flex; gap: 6px; }
      .select-action-btn {
        padding: 5px 12px; background: rgba(91,91,214,0.06); border: 1px solid rgba(91,91,214,0.18);
        border-radius: 100px; color: var(--accent); font-size: 0.8rem; cursor: pointer; font-family: var(--font);
        font-weight: 600; transition: all 0.18s var(--spring);
      }
      .select-action-btn:hover { background: rgba(91,91,214,0.14); transform: translateY(-1px); }

      .docs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; margin-bottom: 24px; }
      .doc-card {
        padding: 16px 16px 13px; background: var(--light-surface);
        border: 1.5px solid var(--light-border); border-radius: var(--r-md); cursor: pointer;
        transition: all 0.28s var(--spring); position: relative; overflow: hidden;
        box-shadow: var(--sh-xs);
      }
      .doc-card::before {
        content: ''; position: absolute; inset: 0;
        background: linear-gradient(135deg, var(--card-color, #5b5bd6) 0%, transparent 55%);
        opacity: 0; transition: opacity 0.28s; border-radius: inherit;
      }
      .doc-card:not(.disabled):hover { transform: translateY(-4px); border-color: var(--card-color, #5b5bd6); box-shadow: 0 6px 20px rgba(0,0,0,0.09); }
      .doc-card:not(.disabled):hover::before { opacity: 0.06; }
      .doc-card.selected {
        border-color: var(--card-color, #5b5bd6);
        box-shadow: 0 0 0 3px rgba(91,91,214,0.08), 0 6px 20px rgba(91,91,214,0.1);
        transform: translateY(-3px);
      }
      .doc-card.selected::before { opacity: 0.08; }
      .doc-card.disabled { opacity: 0.32; cursor: not-allowed; }
      .doc-card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; position: relative; z-index: 1; }
      .doc-icon-wrapper { width: 36px; height: 36px; border-radius: 9px; display: flex; align-items: center; justify-content: center; transition: transform 0.25s var(--spring); }
      .doc-card.selected .doc-icon-wrapper { transform: scale(1.08) rotate(-4deg); }
      .doc-disabled-badge { font-size: 0.65rem; padding: 2px 7px; background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); border-radius: 100px; color: #ef4444; }
      .doc-check { font-size: 1rem; transition: transform 0.25s var(--spring); }
      .doc-card.selected .doc-check { transform: scale(1.15); }
      .doc-title { font-size: 0.875rem; font-weight: 700; color: var(--light-text); margin-bottom: 4px; position: relative; z-index: 1; }
      .doc-description { color: var(--light-text2); font-size: 0.76rem; line-height: 1.5; position: relative; z-index: 1; }

      .select-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 16px; border-top: 1px solid var(--light-border); }
      .selected-count { color: var(--light-text2); font-size: 0.875rem; }
      .selected-count span { color: var(--accent); font-weight: 800; }

      .generate-start-btn {
        display: flex; align-items: center; gap: 9px; padding: 11px 22px;
        background: linear-gradient(135deg, var(--accent), var(--accent-2));
        border: none; border-radius: 100px;
        color: #fff; font-weight: 700; font-size: 0.875rem; font-family: var(--font);
        cursor: pointer; transition: all 0.28s var(--spring);
        position: relative; overflow: hidden; box-shadow: var(--sh-acc);
      }
      .generate-start-btn::before {
        content: ''; position: absolute; inset: 0;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
        transform: translateX(-100%); transition: transform 0.55s;
      }
      .generate-start-btn:hover:not(:disabled)::before { transform: translateX(100%); }
      .generate-start-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: var(--sh-acc2); }
      .generate-start-btn:disabled { opacity: 0.3; cursor: not-allowed; }
      .btn-icon { transition: transform 0.25s; }
      .generate-start-btn:hover .btn-icon { transform: translateX(4px); }

      /* Generate queue */
      .generate-header { text-align: center; margin-bottom: 24px; }
      .generate-title { display: flex; align-items: center; justify-content: center; gap: 9px; font-size: 1.3rem; font-weight: 800; color: var(--light-text); margin-bottom: 6px; letter-spacing: -0.015em; }
      .generate-subtitle { color: var(--light-text2); font-size: 0.875rem; }
      .generate-queue { max-width: 580px; margin: 0 auto; display: flex; flex-direction: column; gap: 9px; }
      .queue-item {
        display: flex; align-items: center; justify-content: space-between;
        padding: 13px 16px; background: var(--light-surface); border: 1px solid var(--light-border);
        border-radius: var(--r-md); transition: all 0.3s var(--spring); box-shadow: var(--sh-xs);
      }
      .queue-item.done { border-color: rgba(16,185,129,0.28); background: rgba(16,185,129,0.04); animation: queueDone 0.4s var(--spring) both; }
      @keyframes queueDone { 0%{transform:scale(0.97);} 60%{transform:scale(1.02);} 100%{transform:scale(1);} }
      .queue-item.running { border-color: rgba(91,91,214,0.4); background: rgba(91,91,214,0.04); box-shadow: 0 0 0 1px rgba(91,91,214,0.08), 0 0 16px rgba(91,91,214,0.12); }
      .queue-item.error { border-color: rgba(239,68,68,0.28); background: rgba(239,68,68,0.04); }
      .queue-item-left { display: flex; align-items: center; gap: 11px; flex: 1; min-width: 0; }
      .queue-icon { width: 36px; height: 36px; border-radius: 9px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
      .queue-icon.done { background: rgba(16,185,129,0.1); color: #10b981; }
      .queue-icon.running { background: rgba(91,91,214,0.12); color: var(--accent); }
      .queue-icon.pending { background: rgba(0,0,0,0.04); color: var(--light-text3); }
      .queue-icon.error { background: rgba(239,68,68,0.1); color: #ef4444; }
      .queue-info { display: flex; flex-direction: column; min-width: 0; }
      .queue-title { font-weight: 600; font-size: 0.875rem; color: var(--light-text); margin-bottom: 2px; }
      .queue-status { font-size: 0.76rem; }
      .queue-status.done { color: #059669; }
      .queue-status.running { color: var(--accent); }
      .queue-status.pending { color: var(--light-text3); }
      .queue-status.error { color: #ef4444; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 190px; }
      .queue-check { color: #10b981; font-size: 1.05rem; margin-left: 6px; }
      .queue-download-btn {
        width: 32px; height: 32px; border-radius: 8px;
        background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.24);
        color: #10b981; cursor: pointer; display: flex; align-items: center; justify-content: center;
        transition: all 0.18s var(--spring); margin-left: 6px; flex-shrink: 0; font-size: 0.78rem;
      }
      .queue-download-btn:hover { background: rgba(16,185,129,0.2); transform: scale(1.08); }

      /* Complete */
      .complete-step { text-align: center; }
      .complete-animation { display: flex; flex-direction: column; align-items: center; }
      .complete-checkmark {
        width: 80px; height: 80px; margin: 0 auto 24px; border-radius: 50%;
        background: linear-gradient(135deg, #10b981, #059669);
        display: flex; align-items: center; justify-content: center;
        font-size: 2.2rem; color: #fff;
        animation: completePop 0.55s var(--spring);
        box-shadow: 0 0 0 8px rgba(16,185,129,0.1), 0 0 32px rgba(16,185,129,0.28);
      }
      @keyframes completePop { from{transform:scale(0);opacity:0;} to{transform:scale(1);opacity:1;} }
      .complete-title { font-size: 1.8rem; font-weight: 900; color: var(--light-text); margin-bottom: 8px; letter-spacing: -0.025em; }
      .complete-description { color: var(--light-text2); margin-bottom: 24px; font-size: 0.95rem; }
      .complete-files-list { width: 100%; max-width: 560px; display: flex; flex-direction: column; gap: 7px; margin-bottom: 24px; text-align: left; }
      .complete-file-item {
        display: flex; align-items: center; justify-content: space-between;
        padding: 11px 14px; background: var(--light-surface); border: 1px solid var(--light-border);
        border-radius: var(--r-sm); transition: all 0.2s var(--spring); box-shadow: var(--sh-xs);
      }
      .complete-file-item:hover { transform: translateX(3px); box-shadow: var(--sh-sm); }
      .complete-file-item.done { border-color: rgba(16,185,129,0.2); background: rgba(16,185,129,0.03); }
      .complete-file-item.error { border-color: rgba(239,68,68,0.2); background: rgba(239,68,68,0.03); }
      .complete-file-left { display: flex; align-items: center; gap: 11px; flex: 1; min-width: 0; }
      .complete-file-icon { width: 36px; height: 36px; border-radius: 9px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
      .complete-file-info { display: flex; flex-direction: column; min-width: 0; }
      .complete-file-name { font-weight: 600; font-size: 0.875rem; color: var(--light-text); }
      .complete-file-fname { color: var(--light-text3); font-size: 0.75rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .complete-file-error { color: #ef4444; font-size: 0.75rem; }
      .complete-download-btn {
        display: flex; align-items: center; gap: 5px; padding: 5px 12px;
        background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.24);
        border-radius: 100px; color: #059669; font-size: 0.78rem; font-weight: 600; font-family: var(--font);
        cursor: pointer; white-space: nowrap; transition: all 0.18s var(--spring); flex-shrink: 0;
      }
      .complete-download-btn:hover { background: rgba(16,185,129,0.18); transform: translateY(-1px); }
      .complete-error-badge { padding: 3px 8px; background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); border-radius: 100px; color: #ef4444; font-size: 0.75rem; flex-shrink: 0; }
      .complete-actions { display: flex; gap: 9px; justify-content: center; flex-wrap: wrap; }
      .complete-action-btn {
        display: flex; align-items: center; gap: 7px; padding: 10px 20px;
        background: var(--light-surface); border: 1px solid var(--light-border2);
        border-radius: 100px; color: var(--light-text2); font-weight: 600; font-size: 0.855rem;
        cursor: pointer; font-family: var(--font); transition: all 0.25s var(--spring); box-shadow: var(--sh-xs);
      }
      .complete-action-btn.primary {
        background: linear-gradient(135deg, var(--accent), var(--accent-2));
        border: none; color: #fff; box-shadow: var(--sh-acc);
      }
      .complete-action-btn:hover { transform: translateY(-2px); box-shadow: var(--sh-md); }
      .complete-action-btn.primary:hover { box-shadow: var(--sh-acc2); }

      /* Legacy compat */
      .generate-doc-tab { padding: 24px; }
      .mode-selector { display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
      .mode-title { display:flex; align-items:center; gap:6px; color: var(--light-text2); font-weight:600; font-size:0.9rem; }
      .mode-tabs { display:flex; gap:5px; padding:3px; background: rgba(0,0,0,0.04); border:1px solid var(--light-border); border-radius:11px; }
      .mode-tab { display:flex; align-items:center; gap:5px; padding:5px 12px; background:transparent; border:none; border-radius:8px; color: var(--light-text2); font-size:0.875rem; font-weight:500; cursor:pointer; transition:all 0.18s; font-family: var(--font); }
      .mode-tab:hover { color: var(--light-text); }
      .mode-tab.active { background: linear-gradient(135deg,var(--accent),var(--accent-2)); color:#fff; box-shadow: 0 3px 10px rgba(91,91,214,0.22); }
      .type-buttons { display:flex; gap:8px; flex-wrap:wrap; }
      .type-button { display:flex; align-items:center; gap:6px; padding:7px 14px; background: rgba(0,0,0,0.03); border:1px solid var(--light-border); border-radius:100px; color: var(--light-text2); font-size:0.875rem; font-weight:500; cursor:pointer; transition:all 0.18s; font-family: var(--font); }
      .type-button:hover { color: var(--light-text); border-color: var(--light-border2); }
      .type-button.active { background:rgba(91,91,214,0.1); border-color:rgba(91,91,214,0.36); color:var(--accent); font-weight:600; }
      .section-title { font-size:1.05rem; font-weight:700; margin-bottom:12px; color: var(--light-text); }
      .gen-hints { display:flex; gap:12px; color: var(--light-text3); font-size:0.83rem; flex-wrap:wrap; }
      .gen-hints span { display:flex; align-items:center; gap:5px; }

      /* ═══════════════════════════════
         KEYFRAMES & UTILITIES
      ═══════════════════════════════ */
      @keyframes fadeSlideUp {
        from { opacity: 0; transform: translateY(18px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.6;} }

      /* ═══════════════════════════════
         RESPONSIVE
      ═══════════════════════════════ */
      @media (max-width: 900px) {
        .sbs-main { padding: 0 20px 60px; }
        .sbs-header { grid-template-columns: 1fr; padding: 48px 0 36px; }
        .sbs-hero-stats { flex-direction: row; flex-wrap: wrap; }
        .sbs-stat { min-width: 150px; }
        .gen-block { padding: 24px 22px 28px; border-radius: var(--r-xl); }
        .gen-mode-switcher { width: 100%; }
        .gen-mode-btn { flex: 1; justify-content: center; }
        .quick-bottom-grid { grid-template-columns: 1fr; }
        .fields-grid { grid-template-columns: 1fr; }
        .fields-grid-3 { grid-template-columns: 1fr 1fr; }
        .sbs-progress-track { padding: 12px 10px; flex-wrap: wrap; justify-content: center; }
        .progress-line { min-width: 20px; }
        .step-label { display: none; }
        .select-header { flex-direction: column; align-items: flex-start; gap: 10px; }
        .docs-grid { grid-template-columns: 1fr 1fr; }
        .complete-actions { flex-direction: column; align-items: center; }
        .detail-steps-bar { overflow-x: auto; }
        .detail-step-pill { font-size: 0.72rem; padding: 8px 10px; }
      }

      @media (max-width: 560px) {
        .sbs-title { font-size: 2.1rem; }
        .fields-grid-3 { grid-template-columns: 1fr; }
        .number-cards { grid-template-columns: 1fr 1fr; }
        .detail-steps-bar { display: none; }
      }
    `}</style>
  );
}