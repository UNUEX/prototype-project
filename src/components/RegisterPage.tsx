
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEye, faEyeSlash, faSpinner, faArrowLeft,
   faCheckCircle,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/hooks/useTranslation';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'react-hot-toast';

// ── Слайд-шоу ────────────────────────────
const SLIDES = [
  {
    src: '/img/bg1.png',
    titleKey: 'register.slide1_title',
    subtitleKey: 'register.slide1_subtitle',
  },
  {
    src: '/img/bg2.png',
    titleKey: 'register.slide2_title',
    subtitleKey: 'register.slide2_subtitle',
  },
  {
    src: '/img/bg3.png',
    titleKey: 'register.slide3_title',
    subtitleKey: 'register.slide3_subtitle',
  },
];

export default function RegisterPage() {
  const { signUp } = useAuth();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const router = useRouter();

  // Form state
  const [firstName,  setFirstName]  = useState('');
  const [lastName,   setLastName]   = useState('');
  const [middleName, setMiddleName] = useState('');
  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [showPass,   setShowPass]   = useState(false);
  const [agreed,     setAgreed]     = useState(false);
  const [isLoading,  setIsLoading]  = useState(false);
  const [done,       setDone]       = useState(false);

  // Slideshow state
  const [slide, setSlide]       = useState(0);
  const [fading, setFading]     = useState(false);

  // Auto-advance slides
  useEffect(() => {
    const id = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setSlide(s => (s + 1) % SLIDES.length);
        setFading(false);
      }, 600);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const goSlide = useCallback((idx: number) => {
    if (idx === slide) return;
    setFading(true);
    setTimeout(() => { setSlide(idx); setFading(false); }, 600);
  }, [slide]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      toast.error(t('errors.fill_required') || 'Имя и фамилия обязательны');
      return;
    }
    if (!agreed) {
      toast.error(t('auth.terms_required'));
      return;
    }
    setIsLoading(true);
    try {
      const fullName = `${lastName.trim()} ${firstName.trim()}${middleName.trim() ? ' ' + middleName.trim() : ''}`;
      const { error } = await signUp(email, password, fullName);
      if (error) {
        toast.error(error);
      } else {
        setDone(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const currentSlide = SLIDES[slide];

  return (
    <>
      <div className="reg-root">
        {/* ── LEFT: Form panel ─────────────────────────────────────── */}
        <div className="reg-form-panel">
          {/* Back button */}
          <button className="reg-back" onClick={() => router.push(`/${language}`)}>
            <FontAwesomeIcon icon={faArrowLeft} />
            <span>{t('common.back')}</span>
          </button>

          <div className="reg-form-inner">
            {done ? (
              /* ── Success state ─────────────────────────── */
              <div className="reg-success">
                <div className="reg-success-icon">
                  <FontAwesomeIcon icon={faCheckCircle} />
                </div>
                <h2>{t('common.success')}</h2>
                <p>{t('common.account_created')}</p>
                <button
                  className="reg-btn-primary"
                  onClick={() => router.push(`/${language}`)}
                >
                  {t('common.back')}
                </button>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="reg-form-header">
                  <h1>{t('common.create_account')}</h1>
                  <p>{t('auth.register_prompt')}</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="reg-form">
                  <div className="reg-grid-2">
                    <div className="reg-field">
                      <label>{t('auth.last_name')} <span className="req">*</span></label>
                      <input
                        type="text"
                        placeholder={t('auth.last_name_placeholder')}
                        value={lastName}
                        onChange={e => setLastName(e.target.value)}
                        required
                        autoFocus
                      />
                    </div>
                    <div className="reg-field">
                      <label>{t('auth.first_name')} <span className="req">*</span></label>
                      <input
                        type="text"
                        placeholder={t('auth.first_name_placeholder')}
                        value={firstName}
                        onChange={e => setFirstName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="reg-field">
                    <label>{t('auth.middle_name')}</label>
                    <input
                      type="text"
                      placeholder={t('auth.middle_name_placeholder')}
                      value={middleName}
                      onChange={e => setMiddleName(e.target.value)}
                    />
                  </div>

                  <div className="reg-field">
                    <label>{t('auth.email')} <span className="req">*</span></label>
                    <input
                      type="email"
                      placeholder={t('auth.email_placeholder')}
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="reg-field">
                    <label>{t('auth.password')} <span className="req">*</span></label>
                    <div className="reg-pass-wrap">
                      <input
                        type={showPass ? 'text' : 'password'}
                        placeholder={t('auth.password_placeholder')}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        className="reg-pass-toggle"
                        onClick={() => setShowPass(v => !v)}
                        tabIndex={-1}
                      >
                        <FontAwesomeIcon icon={showPass ? faEyeSlash : faEye} />
                      </button>
                    </div>
                    <span className="reg-hint">{t('auth.password_hint')}</span>
                  </div>

                  <label className="reg-checkbox">
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={e => setAgreed(e.target.checked)}
                    />
                    <span className="reg-checkbox-box" />
                    <span className="reg-checkbox-text">
                      {t('auth.agree_terms')}{' '}
                      <a href={`/${language}/terms`} target="_blank" rel="noopener noreferrer">
                        {t('auth.terms')}
                      </a>{' '}
                      {t('auth.and')}{' '}
                      <a href={`/${language}/privacy`} target="_blank" rel="noopener noreferrer">
                        {t('auth.privacy')}
                      </a>
                    </span>
                  </label>

                  <button
                    type="submit"
                    className="reg-btn-primary"
                    disabled={isLoading}
                  >
                    {isLoading
                      ? <FontAwesomeIcon icon={faSpinner} spin />
                      : t('auth.register')}
                  </button>
                </form>

                {/* Footer link */}
                <p className="reg-footer-link">
                  {t('auth.has_account')
                    .split('?')[0]}?{' '}
                  <button
                    type="button"
                    onClick={() => router.push(`/${language}?auth=login`)}
                  >
                    {t('auth.login')}
                  </button>
                </p>
              </>
            )}
          </div>
        </div>

        {/* ── RIGHT: Slideshow panel ────────────────────────────────── */}
        <div className="reg-visual-panel">
          {/* Background image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentSlide.src}
            alt=""
            className={`reg-slide-img ${fading ? 'fading' : ''}`}
            aria-hidden="true"
          />
          {/* Overlay gradient */}
          <div className="reg-slide-overlay" />

          {/* Text */}
          <div className={`reg-slide-content ${fading ? 'fading' : ''}`}>
            <div className="reg-slide-badge">HIVERSITY</div>
            <h2>{t(currentSlide.titleKey)}</h2>
            <p>{t(currentSlide.subtitleKey)}</p>
          </div>

          {/* Dots */}
          <div className="reg-dots">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                className={`reg-dot ${i === slide ? 'active' : ''}`}
                onClick={() => goSlide(i)}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        /* ── Reset & root ─────────────────────────────────────────────── */
        .reg-root {
          display: flex;
          min-height: 100vh;
          background: #08080d;
          font-family: 'Segoe UI', system-ui, sans-serif;
        }

        /* ── Form panel (left) ────────────────────────────────────────── */
        .reg-form-panel {
          position: relative;
          width: 50%;
          max-width: 600px;
          display: flex;
          flex-direction: column;
          padding: 32px 48px;
          overflow-y: auto;
        }

        .reg-back {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: transparent;
          border: none;
          color: rgba(255,255,255,0.45);
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 500;
          padding: 8px 0;
          transition: color 0.2s;
          width: fit-content;
        }
        .reg-back:hover { color: #fff; }

        .reg-form-inner {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          max-width: 440px;
          width: 100%;
          margin: 0 auto;
          padding: 24px 0;
        }

        /* Header */
        .reg-form-header {
          margin-bottom: 32px;
        }
        .reg-icon {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          background: linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15));
          border: 1px solid rgba(99,102,241,0.25);
          color: #818cf8;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.4rem;
          margin-bottom: 20px;
        }
        .reg-form-header h1 {
          color: #fff;
          font-size: 1.9rem;
          font-weight: 700;
          letter-spacing: -0.03em;
          margin: 0 0 6px;
        }
        .reg-form-header p {
          color: rgba(255,255,255,0.45);
          font-size: 0.9rem;
          margin: 0;
        }

        /* Fields */
        .reg-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .reg-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .reg-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .reg-field label {
          font-size: 0.72rem;
          font-weight: 600;
          color: rgba(255,255,255,0.55);
          letter-spacing: 0.4px;
          text-transform: uppercase;
        }
        .req { color: #f472b6; }
        .reg-field input {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 12px 14px;
          color: #fff;
          font-size: 0.92rem;
          outline: none;
          transition: border-color 0.25s, box-shadow 0.25s, background 0.25s;
          box-sizing: border-box;
          width: 100%;
        }
        .reg-field input:focus {
          border-color: #6366f1;
          background: rgba(99,102,241,0.06);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.15);
        }
        .reg-field input::placeholder {
          color: rgba(255,255,255,0.2);
        }
        .reg-pass-wrap {
          position: relative;
        }
        .reg-pass-wrap input { padding-right: 44px; }
        .reg-pass-toggle {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: transparent;
          border: none;
          color: rgba(255,255,255,0.35);
          cursor: pointer;
          padding: 6px;
          transition: color 0.2s;
          display: flex;
          align-items: center;
        }
        .reg-pass-toggle:hover { color: #818cf8; }
        .reg-hint {
          font-size: 0.68rem;
          color: rgba(255,255,255,0.3);
          padding-left: 2px;
        }

        /* Checkbox */
        .reg-checkbox {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          cursor: pointer;
          user-select: none;
        }
        .reg-checkbox input { display: none; }
        .reg-checkbox-box {
          width: 18px;
          height: 18px;
          border-radius: 5px;
          border: 2px solid rgba(255,255,255,0.2);
          background: rgba(255,255,255,0.03);
          flex-shrink: 0;
          margin-top: 2px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .reg-checkbox input:checked ~ .reg-checkbox-box {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border-color: transparent;
        }
        .reg-checkbox input:checked ~ .reg-checkbox-box::after {
          content: '✓';
          color: #fff;
          font-size: 0.65rem;
          font-weight: 700;
        }
        .reg-checkbox-text {
          font-size: 0.82rem;
          color: rgba(255,255,255,0.6);
          line-height: 1.5;
        }
        .reg-checkbox-text a {
          color: #818cf8;
          text-decoration: none;
          transition: color 0.2s;
        }
        .reg-checkbox-text a:hover { color: #a5b4fc; text-decoration: underline; }

        /* Submit button */
        .reg-btn-primary {
          width: 100%;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: #fff;
          border: none;
          padding: 14px;
          border-radius: 14px;
          font-weight: 700;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.3s;
          margin-top: 4px;
        }
        .reg-btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px -6px rgba(99,102,241,0.5);
        }
        .reg-btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }

        /* Footer link */
        .reg-footer-link {
          text-align: center;
          color: rgba(255,255,255,0.4);
          font-size: 0.85rem;
          margin-top: 20px;
        }
        .reg-footer-link button {
          background: none;
          border: none;
          color: #818cf8;
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          transition: color 0.2s;
          padding: 0;
        }
        .reg-footer-link button:hover { color: #a5b4fc; }

        /* Success */
        .reg-success {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          text-align: center;
          padding: 40px 0;
        }
        .reg-success-icon {
          font-size: 3.5rem;
          color: #10b981;
        }
        .reg-success h2 {
          color: #fff;
          font-size: 1.8rem;
          font-weight: 700;
          margin: 0;
        }
        .reg-success p {
          color: rgba(255,255,255,0.5);
          margin: 0;
          font-size: 0.95rem;
          max-width: 320px;
        }

        /* ── Visual panel (right) ─────────────────────────────────────── */
        .reg-visual-panel {
          flex: 1;
          position: relative;
          overflow: hidden;
        }
        .reg-slide-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: opacity 0.6s ease;
          opacity: 1;
        }
        .reg-slide-img.fading { opacity: 0; }

        .reg-slide-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to top,
            rgba(8,8,13,0.92) 0%,
            rgba(8,8,13,0.3) 50%,
            rgba(8,8,13,0.15) 100%
          );
          z-index: 1;
        }

        .reg-slide-content {
          position: absolute;
          bottom: 80px;
          left: 48px;
          right: 48px;
          z-index: 2;
          transition: opacity 0.6s ease, transform 0.6s ease;
          opacity: 1;
          transform: translateY(0);
        }
        .reg-slide-content.fading {
          opacity: 0;
          transform: translateY(12px);
        }

        .reg-slide-badge {
          display: inline-block;
          background: rgba(99,102,241,0.2);
          border: 1px solid rgba(99,102,241,0.4);
          color: #818cf8;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 1.5px;
          padding: 4px 12px;
          border-radius: 100px;
          margin-bottom: 14px;
        }
        .reg-slide-content h2 {
          color: #fff;
          font-size: 2rem;
          font-weight: 700;
          letter-spacing: -0.03em;
          line-height: 1.2;
          margin: 0 0 10px;
        }
        .reg-slide-content p {
          color: rgba(255,255,255,0.55);
          font-size: 0.95rem;
          margin: 0;
          max-width: 400px;
          line-height: 1.6;
        }

        /* Dots */
        .reg-dots {
          position: absolute;
          bottom: 40px;
          left: 48px;
          display: flex;
          gap: 8px;
          z-index: 2;
        }
        .reg-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          border: none;
          background: rgba(255,255,255,0.3);
          cursor: pointer;
          padding: 0;
          transition: all 0.3s;
        }
        .reg-dot.active {
          width: 24px;
          border-radius: 4px;
          background: #6366f1;
        }

        /* ── Responsive ───────────────────────────────────────────────── */
        @media (max-width: 860px) {
          .reg-form-panel {
            width: 100%;
            max-width: 100%;
            padding: 24px 28px;
          }
          .reg-visual-panel { display: none; }
        }
        @media (max-width: 480px) {
          .reg-form-panel { padding: 20px; }
          .reg-grid-2 { grid-template-columns: 1fr; }
          .reg-form-header h1 { font-size: 1.5rem; }
        }
      `}</style>
    </>
  );
}