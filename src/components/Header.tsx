// components/Header.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronDown,
  faLayerGroup, faDiagramProject,
  faBookOpen,
  faGlobe, faUser,
} from '@fortawesome/free-solid-svg-icons';
import { useLanguage, Language } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useGenerationLimit } from '@/hooks/useGenerationLimit';
import { useTranslation } from '@/hooks/useTranslation';
import AuthModal from './AuthModal';
import './Header.css';

type HeaderVariant = 'dark' | 'light' | 'glass';

export default function Header({
  solidBg = false,
  variant = 'dark',
  glassOffset = true,
}: {
  solidBg?: boolean;
  variant?: HeaderVariant;
  glassOffset?: boolean;
}) {
  const { language, setLanguage } = useLanguage();
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const { t } = useTranslation();
  const { used, dailyLimit, isReady: limitReady } = useGenerationLimit();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeMenu, setActiveMenu] = useState<'language' | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const langMenuRef = useRef<HTMLDivElement>(null);

  const openAuth = useCallback((mode: 'login' | 'register') => {
    if (mode === 'register') {
      router.push(`/${language}/register`);
      return;
    }
    setShowAuthModal(true);
  }, [router, language]);

  const handleRegisterRedirect = useCallback(() => {
    router.push(`/${language}/register`);
  }, [router, language]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    const handleClickOutside = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        if (activeMenu === 'language') setActiveMenu(null);
      }
    };
    window.addEventListener('scroll', handleScroll);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeMenu]);

  useEffect(() => {
    const handler = (e: CustomEvent) => openAuth(e.detail?.mode || 'login');
    window.addEventListener('hivers:open-auth', handler as EventListener);
    return () => window.removeEventListener('hivers:open-auth', handler as EventListener);
  }, [openAuth]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const PROTECTED_PATHS = ['/canvas'];

  const handleNavigation = (path: string) => {
    const isProtected = PROTECTED_PATHS.some(p => path === p || path.startsWith(p + '/'));
    if (isProtected && !user) {
      setActiveMenu(null);
      setMobileOpen(false);
      openAuth('login');
      return;
    }
    setMobileOpen(false);
    setActiveMenu(null);
    router.push(`/${language}${path}`);
  };

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    setActiveMenu(null);
  };

  const getLanguageName = (lang: Language) => {
    const translation = t(`rup_form.${lang === 'ru' ? 'russian' : lang === 'kz' ? 'kazakh' : 'english'}`);
    if (lang === 'ru') return translation === 'rup_form.russian' ? 'Русский' : translation;
    if (lang === 'kz') return translation === 'rup_form.kazakh' ? 'Қазақша' : translation;
    return translation === 'rup_form.english' ? 'English' : translation;
  };
  const getLangFlag = (lang: Language) => lang === 'ru' ? '🇷🇺' : lang === 'kz' ? '🇰🇿' : '🇬🇧';

  const getHeaderClasses = useMemo(() => {
    const classes = ['hdr'];
    if (variant === 'dark') {
      classes.push('hdr--dark');
    } else if (variant === 'light') {
      classes.push('hdr--light');
    } else if (variant === 'glass') {
      classes.push('hdr--glass');
      if (scrolled && glassOffset) {
        classes.push('hdr--glass-offset');
      }
    }
    if (scrolled) classes.push('is-scrolled');
    if (solidBg) classes.push('is-solid');
    return classes.filter(Boolean).join(' ');
  }, [variant, scrolled, solidBg, glassOffset]);

  return (
    <>
      <header className={getHeaderClasses}>
        <div className="hdr-inner">

          {/* ── BRAND ── */}
          <div className="brand" onClick={() => router.push(`/${language}`)}>
            {variant === 'glass' ? (
              <>
                <Image src="/img/gen4.png" alt="HIVERSITY" className="brand-img" width={32} height={32} />
                <span className="brand-text">hiversity.ai</span>
              </>
            ) : variant === 'light' ? (
              <>
                <Image src="/img/gen4.png" alt="HIVERSITY" className="brand-img" width={32} height={32} />
                <span className="brand-text">hiversity.ai</span>
              </>
            ) : (
              <>
                <Image src="/img/gemini2.png" alt="HIVERSITY" className="brand-img" width={40} height={40} />
              </>
            )}
          </div>

          {/* ── CENTER NAV ── */}
          <nav className="nav">
            <button className="hdr-nav-btn" onClick={() => handleNavigation('/canvas')}>
              {t('header.canvas_editor')}
            </button>
            <button className="hdr-nav-btn" onClick={() => handleNavigation('/canvas/sbs')}>
              {t('header.step_by_step')}
            </button>
            <button className="hdr-nav-btn" onClick={() => handleNavigation('/canvas/master')}>
              {t('header.master') || 'Мастер'}
            </button>
            <button className="hdr-nav-btn" onClick={() => handleNavigation('/docs')}>
              {t('header.documentation')}
            </button>
          </nav>

          {/* ── RIGHT ── */}
          <div className="right">

            {/* Language switcher */}
            <div className="lang-wrap" ref={langMenuRef}>
              <button
                className={`lang-btn ${activeMenu === 'language' ? 'active' : ''}`}
                onClick={() => setActiveMenu(activeMenu === 'language' ? null : 'language')}
              >
                <FontAwesomeIcon icon={faGlobe} className="globe-icon" />
                <span className="lang-code">{language.toUpperCase()}</span>
                <FontAwesomeIcon icon={faChevronDown} className={`chevron ${activeMenu === 'language' ? 'up' : ''}`} />
              </button>
              {activeMenu === 'language' && (
                <div className="lang-dropdown">
                  {(['ru', 'kz', 'en'] as Language[]).map(lang => (
                    <button
                      key={lang}
                      className={`lang-option ${language === lang ? 'active' : ''}`}
                      onClick={() => handleLanguageChange(lang)}
                    >
                      <span className="lang-flag">{getLangFlag(lang)}</span>
                      <span className="lang-name">{getLanguageName(lang)}</span>
                      {language === lang && <span className="lang-check">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Auth / Profile */}
            {authLoading ? (
              <div style={{ width: 36, height: 36 }} />
            ) : user ? (
              <button className="profile-btn" onClick={() => handleNavigation('/profile')}>
                <div className="profile-avatar">
                  {profile?.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt="avatar"
                      width={36}
                      height={36}
                      style={{ borderRadius: '50%', objectFit: 'cover' }}
                    />
                  ) : (
                    user.email?.[0]?.toUpperCase() || <FontAwesomeIcon icon={faUser} />
                  )}
                </div>
                <div className="profile-info">
                  <span className="profile-name">
                    {user.user_metadata?.full_name?.split(' ')[0] || t('profile.my_profile') || 'Профиль'}
                  </span>
                  {!limitReady
                    ? <span className="profile-count loading">··· / ···</span>
                    : <span className="profile-count">{used} / {dailyLimit}</span>
                  }
                </div>
              </button>
            ) : (
              <div className="auth-cluster">
                <button className="btn-ghost" onClick={() => openAuth('login')}>
                  {t('header.login')}
                </button>
                <button className="btn-primary" onClick={() => openAuth('register')}>
                  {t('header.create_account')}
                </button>
              </div>
            )}

            {/* Burger mobile */}
            <button
              className={`burger ${mobileOpen ? 'open' : ''}`}
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Меню"
            >
              <span /><span /><span />
            </button>
          </div>
        </div>

        {/* ── MOBILE DRAWER ── */}
        <div className={`mob-drawer ${mobileOpen ? 'open' : ''}`}>
          <div className="mob-nav">
            <button className="mob-link" onClick={() => handleNavigation('/canvas')}>
              <FontAwesomeIcon icon={faLayerGroup} className="mob-icon" />
              {t('header.canvas_editor')}
            </button>
            <button className="mob-link" onClick={() => handleNavigation('/canvas/sbs')}>
              <FontAwesomeIcon icon={faDiagramProject} className="mob-icon" />
              {t('header.step_by_step')}
            </button>
            <button className="mob-link" onClick={() => handleNavigation('/canvas/master')}>
              <FontAwesomeIcon icon={faBookOpen} className="mob-icon" />
              {t('header.master') || 'Мастер'}
            </button>
            <div className="mob-sep" />
            <button className="mob-link" onClick={() => handleNavigation('/docs')}>
              {t('header.documentation')}
            </button>
          </div>
          {!user && (
            <div className="mob-auth">
              <button className="mob-login" onClick={() => { setMobileOpen(false); openAuth('login'); }}>
                {t('header.login')}
              </button>
              <button className="mob-register" onClick={() => { setMobileOpen(false); openAuth('register'); }}>
                {t('header.create_account')}
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ── AUTH MODAL ── */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onRegisterClick={handleRegisterRedirect}
      />
    </>
  );
}