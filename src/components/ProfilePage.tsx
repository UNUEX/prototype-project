'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSpinner, faEye, faEyeSlash, faCamera, faArrowLeft,
  faUser, faShieldHalved, faChartBar, faCheck, faXmark,
  faEnvelope, faCalendarAlt, faIdCard, faBolt,
  faPencil, faSignOutAlt, faCrown,
  faLock, faArrowRight, faComments,
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-hot-toast';
import { useGenerationLimit } from '@/hooks/useGenerationLimit';
import { supabase } from '@/lib/supabaseClient';

interface ProfilePageProps {
  onBack?: () => void;
}

type Section = 'profile' | 'security' | 'stats' | 'voice';

export default function ProfilePage({ onBack }: ProfilePageProps) {
  const { profile, loading: authLoading, updateProfile, updatePassword, uploadAvatar, signOut } = useAuth();
  const router = useRouter();
  const { language, t } = useLanguage();
  const { used, remaining, dailyLimit, isLoading: limitLoading } = useGenerationLimit();
  const fileRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [bannerLoading, setBannerLoading] = useState(false);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<Section>('profile');
  const [editingName, setEditingName] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);


  // Load banner URL from user metadata
  useEffect(() => {
    const meta = profile?.id !== 'guest' ? profile : null;
    if (meta?.banner_url) {
      setBannerUrl(meta.banner_url);
    } else {
      // Try loading from supabase storage
      const loadBanner = async () => {
        if (!profile?.id || profile.id === 'guest') return;
        try {
          const { data } = await supabase.storage.from('banners').list(profile.id + '/');
          if (data && data.length > 0) {
            const latest = data.sort((a, b) =>
              new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
            )[0];
            const { data: { publicUrl } } = supabase.storage
              .from('banners')
              .getPublicUrl(`${profile.id}/${latest.name}`);
            setBannerUrl(publicUrl);
          }
        } catch { /* ignore */ }
      };
      loadBanner();
    }
  }, [profile]); // Добавлена зависимость profile



  /* ── helpers ── */
  const getInitials = () => {
    if (profile?.full_name) {
      const parts = profile.full_name.trim().split(' ').filter(Boolean);
      if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
      return profile.full_name.slice(0, 2).toUpperCase();
    }
    if (profile?.email) return profile.email[0].toUpperCase();
    return 'U';
  };

  const MAX_FILE_SIZE = 500 * 1024; // 500 KB

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      toast.error(language === 'ru'
        ? 'Аватар не должен превышать 500 КБ'
        : language === 'kz'
        ? 'Аватар 500 КБ-тан аспауы керек'
        : 'Avatar must be under 500 KB');
      return;
    }
    setAvatarLoading(true);
    const { error } = await uploadAvatar(file);
    if (error) toast.error(error);
    setAvatarLoading(false);
    // Reset input so same file can be reselected
    e.target.value = '';
  };

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      toast.error(language === 'ru'
        ? 'Фото профиля не должно превышать 500 КБ'
        : language === 'kz'
        ? 'Профиль суреті 500 КБ-тан аспауы керек'
        : 'Banner must be under 500 KB');
      return;
    }
    if (!profile?.id || profile.id === 'guest') {
      toast.error(language === 'ru' ? 'Необходимо авторизоваться' : 'Please sign in');
      return;
    }
    setBannerLoading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `${profile.id}/banner-${Date.now()}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from('banners')
        .upload(fileName, file, { upsert: true });
      if (uploadErr) throw new Error(uploadErr.message);

      const { data: { publicUrl } } = supabase.storage
        .from('banners')
        .getPublicUrl(fileName);

      // Save URL to user metadata
      await supabase.auth.updateUser({ data: { banner_url: publicUrl } });

      setBannerUrl(publicUrl);
      toast.success(language === 'ru'
        ? 'Фон профиля обновлён'
        : language === 'kz'
        ? 'Профиль фоны жаңартылды'
        : 'Profile banner updated');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setBannerLoading(false);
      e.target.value = '';
    }
  };

  const handleSaveName = async () => {
    if (!fullName.trim()) { toast.error(t('profile.name_placeholder')); return; }
    setIsSaving(true);
    const { error } = await updateProfile({ full_name: fullName });
    if (error) toast.error(error); else setEditingName(false);
    setIsSaving(false);
  };

  const handleSavePassword = async () => {
    if (newPassword.length < 6) { toast.error(t('profile.password_too_short')); return; }
    if (newPassword !== confirmPassword) { toast.error(t('profile.passwords_do_not_match')); return; }
    setIsChangingPassword(true);
    const { error } = await updatePassword(newPassword);
    if (!error) { setNewPassword(''); setConfirmPassword(''); setEditingPassword(false); }
    else toast.error(error);
    setIsChangingPassword(false);
  };

  const handleBack = () => { if (onBack) onBack(); else router.push(`/${language}`); };

  const usedPercent   = dailyLimit > 0 ? Math.min(100, Math.round((used / dailyLimit) * 100)) : 0;
  const isNearLimit   = remaining <= 3;
  const nameParts     = (authLoading ? '' : profile?.full_name || '').split(' ').filter(Boolean);
  const firstName     = authLoading ? '…' : (nameParts[0] || '—');
  const lastName      = authLoading ? '…' : (nameParts.slice(1).join(' ') || '—');

  const getJoinedDate = () => {
    if (!profile?.created_at) return '—';
    return new Date(profile.created_at).toLocaleDateString(
      language === 'ru' ? 'ru-RU' : language === 'kz' ? 'kk-KZ' : 'en-US',
      { month: 'long', year: 'numeric' }
    );
  };

  const getAccountId = () => profile?.id?.slice(0, 8) || '—';
  const getFullAccountId = () => profile?.id || '—';

  const isPro = profile?.subscription_status === 'pro';

  const navItems: { id: Section; icon: typeof faUser; label: string }[] = [
    { id: 'profile',  icon: faUser,         label: t('profile.my_profile') },
    { id: 'security', icon: faShieldHalved, label: t('profile.security') },
    { id: 'stats',    icon: faChartBar,     label: language === 'ru' ? 'Статистика' : language === 'kz' ? 'Статистика' : 'Usage' },
    { id: 'voice',    icon: faComments,     label: language === 'ru' ? 'Голос пользователей' : language === 'kz' ? 'Пайдаланушы дауысы' : 'User Voice' },
  ];

  return (
    <div className="pp-root">
      {/* ── HERO BANNER ── */}
      <div className="pp-hero">
        {/* Banner background image */}
        {bannerUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={bannerUrl} alt="profile banner" className="pp-hero-banner-img" />
        )}

        <div className="pp-hero-bg" aria-hidden="true">
          {!bannerUrl && (
            <>
              <div className="pp-hero-orb pp-hero-orb-1" />
              <div className="pp-hero-orb pp-hero-orb-2" />
            </>
          )}
          <div className="pp-hero-grid" />
        </div>

        <div className="pp-hero-topbar">
          <button className="pp-hero-back" onClick={handleBack} aria-label="Back">
            <FontAwesomeIcon icon={faArrowLeft} />
            <span>{t('common.back')}</span>
          </button>
          <div className="pp-hero-brand">Hiversity</div>
          <div className="pp-hero-right-actions">
            {/* Banner upload button */}
            <button
              className="pp-banner-upload-btn"
              onClick={() => bannerRef.current?.click()}
              disabled={bannerLoading}
              title={language === 'ru' ? 'Изменить фон профиля (макс. 500 КБ)' : 'Change profile banner (max 500 KB)'}
            >
              {bannerLoading
                ? <FontAwesomeIcon icon={faSpinner} spin />
                : <FontAwesomeIcon icon={faCamera} />
              }
              <span>
                {language === 'ru' ? 'Фон профиля' : language === 'kz' ? 'Профиль фоны' : 'Banner'}
              </span>
            </button>
            <input ref={bannerRef} type="file" accept="image/*" hidden onChange={handleBannerChange} />

            <button className="pp-hero-signout" onClick={() => signOut()}>
              <FontAwesomeIcon icon={faSignOutAlt} />
              <span>{t('profile.logout')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── IDENTITY ROW ── */}
      <div className="pp-identity-strip">
        <div className="pp-identity-inner">
          {/* Avatar */}
          <div className="pp-av-wrap" onClick={() => fileRef.current?.click()}>
            {avatarLoading ? (
              <div className="pp-av pp-av-placeholder">
                <FontAwesomeIcon icon={faSpinner} spin />
              </div>
            ) : profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt="avatar" className="pp-av pp-av-img" />
            ) : (
              <div className="pp-av pp-av-placeholder">{getInitials()}</div>
            )}
            <div className="pp-av-overlay">
              <FontAwesomeIcon icon={faCamera} />
              <span className="pp-av-overlay-hint">
                {language === 'ru' ? 'до 500 КБ' : 'up to 500 KB'}
              </span>
            </div>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleAvatarChange} />
          </div>

          {/* Name + meta */}
          <div className="pp-identity-info">
            <div className="pp-identity-name">
              {authLoading ? '…' : (profile?.full_name || t('profile.unnamed'))}
            </div>
            <div className="pp-identity-contacts">
              <span className="pp-contact-pill">
                <FontAwesomeIcon icon={faEnvelope} />
                {profile?.email || '—'}
              </span>
            </div>
          </div>

          {/* Plan badge */}
          <div className={`pp-plan-badge ${isPro ? 'pro' : 'free'}`}>
            <FontAwesomeIcon icon={isPro ? faCrown : faBolt} />
            {isPro ? t('profile.pro_account') : t('profile.basic_account')}
          </div>
        </div>
      </div>

      {/* ── MAIN LAYOUT ── */}
      <div className="pp-layout">

        {/* LEFT SIDEBAR */}
        <aside className="pp-sidebar">
          {/* Contact info */}
          <div className="pp-sidebar-card">
            <div className="pp-sidebar-card-title">
              {language === 'ru' ? 'Контакты' : language === 'kz' ? 'Байланыс' : 'Contacts'}
            </div>
            <ul className="pp-contact-list">
              <li className="pp-contact-item">
                <div className="pp-contact-icon-wrap"><FontAwesomeIcon icon={faEnvelope} /></div>
                <div>
                  <div className="pp-contact-label">Email</div>
                  <div className="pp-contact-value">{profile?.email || '—'}</div>
                </div>
              </li>
              <li className="pp-contact-item">
                <div className="pp-contact-icon-wrap"><FontAwesomeIcon icon={faCalendarAlt} /></div>
                <div>
                  <div className="pp-contact-label">{language === 'ru' ? 'Дата регистрации' : language === 'kz' ? 'Тіркелген күні' : 'Member since'}</div>
                  <div className="pp-contact-value">{getJoinedDate()}</div>
                </div>
              </li>
              <li className="pp-contact-item">
                <div className="pp-contact-icon-wrap"><FontAwesomeIcon icon={faIdCard} /></div>
                <div>
                  <div className="pp-contact-label">Account ID</div>
                  <div className="pp-contact-value pp-mono">{getAccountId()}…</div>
                </div>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="pp-sidebar-actions">
            <button className="pp-action-btn pp-action-primary" onClick={() => { setActiveSection('profile'); setEditingName(true); }}>
              <FontAwesomeIcon icon={faPencil} />
              {language === 'ru' ? 'Редактировать профиль' : language === 'kz' ? 'Профильді өзгерту' : 'Edit profile'}
            </button>
            <button className="pp-action-btn pp-action-secondary" onClick={() => { setActiveSection('security'); setEditingPassword(true); }}>
              <FontAwesomeIcon icon={faLock} />
              {language === 'ru' ? 'Изменить пароль' : language === 'kz' ? 'Құпия сөзді өзгерту' : 'Change password'}
            </button>
          </div>

          {/* Nav */}
          <nav className="pp-sidebar-nav">
            {navItems.map(item => (
              <button
                key={item.id}
                className={`pp-nav-item ${activeSection === item.id ? 'active' : ''}`}
                onClick={() => setActiveSection(item.id)}
              >
                <FontAwesomeIcon icon={item.icon} className="pp-nav-icon" />
                <span>{item.label}</span>
                {item.id === 'stats' && !limitLoading && (
                  <span className="pp-nav-badge">{used}/{dailyLimit}</span>
                )}
              </button>
            ))}
          </nav>

          <button className="pp-signout-btn" onClick={() => signOut()}>
            <FontAwesomeIcon icon={faSignOutAlt} />
            {t('profile.logout')}
          </button>
        </aside>

        {/* RIGHT CONTENT */}
        <main className="pp-main">

          {/* ── PROFILE SECTION ── */}
          {activeSection === 'profile' && (
            <div className="pp-section fade-in">
              <div className="pp-cards-grid">
                {/* Personal data */}
                <div className="pp-card">
                  <div className="pp-card-head">
                    <div>
                      <div className="pp-card-title">{t('profile.personal_info')}</div>
                      <div className="pp-card-sub">
                        {language === 'ru' ? 'Ваши личные данные' : language === 'kz' ? 'Жеке деректеріңіз' : 'Your personal data'}
                      </div>
                    </div>
                    <button
                      className={`pp-edit-btn ${editingName ? 'active' : ''}`}
                      onClick={() => setEditingName(!editingName)}
                    >
                      <FontAwesomeIcon icon={editingName ? faXmark : faPencil} />
                      {editingName ? t('common.cancel') : t('common.edit')}
                    </button>
                  </div>

                  {!editingName ? (
                    <div className="pp-fields">
                      <div className="pp-field">
                        <span className="pp-field-lbl">{t('profile.first_name')}</span>
                        <span className="pp-field-val">{firstName}</span>
                      </div>
                      <div className="pp-field">
                        <span className="pp-field-lbl">{t('profile.last_name')}</span>
                        <span className="pp-field-val">{lastName}</span>
                      </div>
                      <div className="pp-field pp-field-full">
                        <span className="pp-field-lbl">{t('profile.email')}</span>
                        <span className="pp-field-val">{profile?.email || '—'}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="pp-edit-form">
                      <div className="pp-form-group">
                        <label className="pp-form-label">{t('profile.display_name')}</label>
                        <input
                          className="pp-input"
                          value={fullName}
                          onChange={e => setFullName(e.target.value)}
                          placeholder={t('profile.name_placeholder')}
                        />
                      </div>
                      <button
                        className="pp-save-btn"
                        onClick={handleSaveName}
                        disabled={isSaving || !fullName.trim() || fullName === profile?.full_name}
                      >
                        {isSaving
                          ? <FontAwesomeIcon icon={faSpinner} spin />
                          : <><FontAwesomeIcon icon={faCheck} /> {t('common.save')}</>
                        }
                      </button>
                    </div>
                  )}
                </div>

                {/* Subscription card */}
                <div className="pp-card pp-card-plan">
                  <div className="pp-card-head">
                    <div>
                      <div className="pp-card-title">{language === 'ru' ? 'Подписка' : language === 'kz' ? 'Жазылым' : 'Subscription'}</div>
                      <div className="pp-card-sub">{language === 'ru' ? 'Ваш текущий тариф' : language === 'kz' ? 'Ағымдағы тарифіңіз' : 'Your current plan'}</div>
                    </div>
                  </div>
                  <div className="pp-plan-row">
                    <div className={`pp-plan-icon ${isPro ? 'pro' : ''}`}>
                      <FontAwesomeIcon icon={isPro ? faCrown : faBolt} />
                    </div>
                    <div>
                      <div className="pp-plan-name">{isPro ? t('profile.pro_account') : t('profile.basic_account')}</div>
                      <div className="pp-plan-detail">
                        {dailyLimit} {language === 'ru' ? 'документов / день' : language === 'kz' ? 'құжат / күн' : 'docs / day'}
                      </div>
                    </div>
                  </div>
                  {!isPro && (
                    <div className="pp-upgrade-banner">
                      <div className="pp-upgrade-text">
                        <strong>{language === 'ru' ? 'Upgrade до Pro' : 'Upgrade to Pro'}</strong>
                        <span>{language === 'ru' ? '100 документов в день' : language === 'kz' ? 'Күніне 100 құжат' : '100 docs/day'}</span>
                      </div>
                      <button className="pp-upgrade-btn">
                        {language === 'ru' ? 'Улучшить' : language === 'kz' ? 'Жақсарту' : 'Upgrade'}
                        <FontAwesomeIcon icon={faArrowRight} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Account details */}
                <div className="pp-card">
                  <div className="pp-card-head">
                    <div>
                      <div className="pp-card-title">{language === 'ru' ? 'Детали аккаунта' : language === 'kz' ? 'Аккаунт мәліметтері' : 'Account details'}</div>
                    </div>
                  </div>
                  <div className="pp-fields">
                    <div className="pp-field">
                      <span className="pp-field-lbl">{language === 'ru' ? 'Статус' : 'Status'}</span>
                      <span className="pp-field-val pp-status-ok">
                        <FontAwesomeIcon icon={faCheck} /> {language === 'ru' ? 'Активен' : 'Active'}
                      </span>
                    </div>
                    <div className="pp-field">
                      <span className="pp-field-lbl">Account ID</span>
                      <span className="pp-field-val pp-mono">{getFullAccountId()}</span>
                    </div>
                    <div className="pp-field pp-field-full">
                      <span className="pp-field-lbl">{language === 'ru' ? 'Зарегистрирован' : 'Member since'}</span>
                      <span className="pp-field-val">{getJoinedDate()}</span>
                    </div>
                  </div>
                </div>

                {/* Daily quota mini */}
                <div className="pp-card">
                  <div className="pp-card-head">
                    <div>
                      <div className="pp-card-title">{language === 'ru' ? 'Сегодня' : language === 'kz' ? 'Бүгін' : 'Today'}</div>
                      <div className="pp-card-sub">{language === 'ru' ? 'Использование лимита' : 'Usage'}</div>
                    </div>
                    <button className="pp-icon-btn" onClick={() => setActiveSection('stats')}>
                      <FontAwesomeIcon icon={faChartBar} />
                    </button>
                  </div>
                  {limitLoading ? (
                    <div className="pp-skel-wrap">
                      <div className="pp-skel pp-skel-num" />
                      <div className="pp-skel pp-skel-bar" />
                    </div>
                  ) : (
                    <>
                      <div className="pp-quota-big">
                        <span className="pp-quota-used">{used}</span>
                        <span className="pp-quota-sep">/</span>
                        <span className="pp-quota-total">{dailyLimit}</span>
                      </div>
                      <div className="pp-quota-bar-wrap">
                        <div
                          className="pp-quota-bar-fill"
                          style={{ width: `${usedPercent}%`, background: isNearLimit ? '#EF4444' : undefined }}
                        />
                      </div>
                      <div className="pp-quota-info">
                        <span className={isNearLimit ? 'pp-quota-warn' : 'pp-quota-ok'}>
                          {remaining} {language === 'ru' ? 'осталось' : language === 'kz' ? 'қалды' : 'remaining'}
                        </span>
                        <span className="pp-quota-pct">{usedPercent}%</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── SECURITY SECTION ── */}
          {activeSection === 'security' && (
            <div className="pp-section fade-in">
              <div className="pp-card pp-card-full">
                <div className="pp-card-head">
                  <div>
                    <div className="pp-card-title">{t('profile.security')}</div>
                    <div className="pp-card-sub">
                      {language === 'ru' ? 'Управление паролем аккаунта' : language === 'kz' ? 'Аккаунт паролін басқару' : 'Manage your password'}
                    </div>
                  </div>
                  <button
                    className={`pp-edit-btn ${editingPassword ? 'active' : ''}`}
                    onClick={() => setEditingPassword(!editingPassword)}
                  >
                    <FontAwesomeIcon icon={editingPassword ? faXmark : faPencil} />
                    {editingPassword ? t('common.cancel') : t('common.edit')}
                  </button>
                </div>

                {!editingPassword ? (
                  <div className="pp-fields">
                    <div className="pp-field">
                      <span className="pp-field-lbl">{t('profile.password')}</span>
                      <span className="pp-field-val pp-pw-dots">••••••••</span>
                    </div>
                  </div>
                ) : (
                  <div className="pp-edit-form pp-edit-form-narrow">
                    <div className="pp-form-group">
                      <label className="pp-form-label">{t('profile.new_password')}</label>
                      <div className="pp-input-wrap">
                        <input
                          className="pp-input"
                          type={showPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          placeholder={t('profile.password_placeholder')}
                        />
                        <button className="pp-eye" onClick={() => setShowPassword(v => !v)}>
                          <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                        </button>
                      </div>
                    </div>
                    <div className="pp-form-group">
                      <label className="pp-form-label">{t('profile.confirm_password')}</label>
                      <div className="pp-input-wrap">
                        <input
                          className="pp-input"
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          placeholder={t('profile.confirm_placeholder')}
                        />
                        <button className="pp-eye" onClick={() => setShowConfirmPassword(v => !v)}>
                          <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />
                        </button>
                      </div>
                    </div>
                    <button
                      className="pp-save-btn"
                      onClick={handleSavePassword}
                      disabled={isChangingPassword || !newPassword || !confirmPassword}
                    >
                      {isChangingPassword
                        ? <FontAwesomeIcon icon={faSpinner} spin />
                        : <><FontAwesomeIcon icon={faShieldHalved} /> {t('profile.update_password')}</>
                      }
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── STATS SECTION ── */}
          {activeSection === 'stats' && (
            <div className="pp-section fade-in">
              <div className="pp-card pp-card-full">
                <div className="pp-card-head">
                  <div>
                    <div className="pp-card-title">
                      {language === 'ru' ? 'Статистика использования' : language === 'kz' ? 'Пайдалану статистикасы' : 'Usage statistics'}
                    </div>
                    <div className="pp-card-sub">
                      {language === 'ru' ? 'Генерации документов сегодня' : 'Document generations today'}
                    </div>
                  </div>
                </div>

                {limitLoading ? (
                  <div className="pp-stats-skel">
                    <div className="pp-skel pp-skel-big" />
                    <div className="pp-skel pp-skel-bar" />
                    <div className="pp-stat-boxes">
                      {[0,1,2].map(i => <div key={i} className="pp-stat-box"><div className="pp-skel pp-skel-num" /></div>)}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="pp-stats-hero">
                      <div className="pp-stats-nums">
                        <span className="pp-stat-big">{used}</span>
                        <span className="pp-stat-div">/</span>
                        <span className="pp-stat-total">{dailyLimit}</span>
                      </div>
                      <div className="pp-stat-caption">
                        {language === 'ru' ? 'документов сгенерировано сегодня' : language === 'kz' ? 'бүгін жасалған құжаттар' : 'documents generated today'}
                      </div>
                    </div>

                    <div className="pp-track-wrap">
                      <div className="pp-track">
                        <div
                          className={`pp-track-fill ${isNearLimit ? 'warn' : ''}`}
                          style={{ width: `${usedPercent}%` }}
                        />
                      </div>
                      <div className="pp-track-labels">
                        <span>0</span>
                        <span>{dailyLimit}</span>
                      </div>
                    </div>

                    <div className="pp-stat-boxes">
                      <div className={`pp-stat-box ${isNearLimit ? 'warn' : 'ok'}`}>
                        <div className="pp-stat-box-num">{used}</div>
                        <div className="pp-stat-box-lbl">{language === 'ru' ? 'Использовано' : 'Used'}</div>
                      </div>
                      <div className="pp-stat-box ok">
                        <div className="pp-stat-box-num">{remaining}</div>
                        <div className="pp-stat-box-lbl">{language === 'ru' ? 'Осталось' : 'Remaining'}</div>
                      </div>
                      <div className="pp-stat-box neutral">
                        <div className="pp-stat-box-num">{dailyLimit}</div>
                        <div className="pp-stat-box-lbl">{language === 'ru' ? 'Лимит' : 'Limit'}</div>
                      </div>
                    </div>

                    {isNearLimit && (
                      <div className="pp-warn-banner">
                        <FontAwesomeIcon icon={faBolt} className="pp-warn-icon" />
                        <div className="pp-warn-text">
                          <strong>{language === 'ru' ? 'Лимит почти исчерпан!' : 'Limit almost reached!'}</strong>
                          {' '}{language === 'ru' ? `Осталось только ${remaining} генерации.` : `Only ${remaining} left.`}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── VOICE SECTION ── */}
          {activeSection === 'voice' && (
            <div className="pp-section fade-in">
              <div className="pp-card pp-card-full">
                <div className="pp-card-head">
                  <div>
                    <div className="pp-card-title">
                      {language === 'ru' ? '💬 Голос пользователей' : language === 'kz' ? '💬 Пайдаланушы дауысы' : '💬 User Voice'}
                    </div>
                    <div className="pp-card-sub">
                      {language === 'ru'
                        ? 'Ваше мнение помогает нам делать платформу лучше'
                        : language === 'kz'
                        ? 'Пікіріңіз платформаны жақсартуға көмектеседі'
                        : 'Your feedback helps us improve the platform'}
                    </div>
                  </div>
                </div>

                <div className="pp-voice-hero">
                  <div className="pp-voice-icon-wrap">
                    <FontAwesomeIcon icon={faComments} />
                  </div>
                  <div className="pp-voice-text">
                    <h3 className="pp-voice-title">
                      {language === 'ru'
                        ? 'Расскажите, что вы думаете о Hiversity'
                        : language === 'kz'
                        ? 'Hiversity туралы не ойлайтыныңызды айтыңыз'
                        : 'Tell us what you think about Hiversity'}
                    </h3>
                    <p className="pp-voice-desc">
                      {language === 'ru'
                        ? 'Пройдите короткую анкету — опишите пожелания, проблемы и идеи. Каждый ответ напрямую влияет на развитие платформы. Это займёт 3–5 минут.'
                        : language === 'kz'
                        ? 'Қысқа сауалнамадан өтіңіз — тілектеріңізді, мәселелеріңізді және идеяларыңызды сипаттаңыз. Әр жауап платформаның дамуына тікелей әсер етеді. Бұл 3–5 минут алады.'
                        : 'Complete a short survey — describe your wishes, problems and ideas. Every response directly impacts platform development. It takes 3–5 minutes.'}
                    </p>
                    <div className="pp-voice-tags">
                      <span className="pp-voice-tag">
                        {language === 'ru' ? '⚡ 3–5 минут' : language === 'kz' ? '⚡ 3–5 минут' : '⚡ 3–5 minutes'}
                      </span>
                      <span className="pp-voice-tag">
                        {language === 'ru' ? '🔒 Анонимно' : language === 'kz' ? '🔒 Анонимді' : '🔒 Anonymous'}
                      </span>
                      <span className="pp-voice-tag">
                        {language === 'ru' ? '💡 Влияет на платформу' : language === 'kz' ? '💡 Платформаға әсер етеді' : '💡 Impacts the platform'}
                      </span>
                    </div>
                  </div>
                  <button
                    className="pp-voice-cta"
                    onClick={() => router.push(`/${language}/feedback`)}
                  >
                    <FontAwesomeIcon icon={faComments} />
                    {language === 'ru' ? 'Пройти анкету' : language === 'kz' ? 'Сауалнамадан өту' : 'Take the survey'}
                    <FontAwesomeIcon icon={faArrowRight} />
                  </button>
                </div>

                <div className="pp-voice-features">
                  {[
                    {
                      title: language === 'ru' ? 'Проблемы и баги' : language === 'kz' ? 'Мәселелер мен қателер' : 'Problems & bugs',
                      desc: language === 'ru' ? 'Что не работает или работает неудобно' : language === 'kz' ? 'Не жұмыс істемейтінін айтыңыз' : 'What is broken or inconvenient',
                    },
                    {
                      title: language === 'ru' ? 'Пожелания' : language === 'kz' ? 'Тілектер' : 'Feature requests',
                      desc: language === 'ru' ? 'Функции которых вам не хватает' : language === 'kz' ? 'Сізге жетіспейтін функциялар' : 'Features you wish existed',
                    },
                    {
                      title: language === 'ru' ? 'Что нравится' : language === 'kz' ? 'Не ұнайды' : 'What you love',
                      desc: language === 'ru' ? 'Лучшее в платформе по вашему мнению' : language === 'kz' ? 'Платформадағы ең жақсы нәрсе' : 'The best parts of the platform',
                    },
                    {
                      title: language === 'ru' ? 'Идеи' : language === 'kz' ? 'Идеялар' : 'Ideas',
                      desc: language === 'ru' ? 'Любые предложения по улучшению' : language === 'kz' ? 'Жақсартуға кез келген ұсыныстар' : 'Any improvement suggestions',
                    },
                  ].map((item, i) => (
                    <div key={i} className="pp-voice-feature">
                      <div>
                        <div className="pp-voice-feature-title">{item.title}</div>
                        <div className="pp-voice-feature-desc">{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ── STYLES ── */}
      <style>{`
        /* ── Resets & base ── */
        .pp-root { min-height: 100vh; background: var(--ci-cream, #FAF8F3); font-family: 'Inter', sans-serif; }
        @keyframes pp-fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
        .fade-in { animation: pp-fadeIn .35s ease both; }

        /* ── HERO ── */
        .pp-hero {
          position: relative;
          height: 160px;
          overflow: hidden;
          background: linear-gradient(135deg, #2e3192 0%, #3730a3 35%, #6366f1 70%, #818cf8 100%);
        }
        /* Banner image fills hero */
        .pp-hero-banner-img {
          position: absolute; inset: 0;
          width: 100%; height: 100%;
          object-fit: cover; object-position: center;
          z-index: 1;
        }
        .pp-hero-bg { position: absolute; inset: 0; pointer-events: none; z-index: 2; }
        /* Overlay for readability when banner image exists */
        .pp-hero:has(.pp-hero-banner-img) .pp-hero-bg {
          background: linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.1) 100%);
        }
        .pp-hero-orb {
          position: absolute; border-radius: 50%;
          filter: blur(60px); opacity: .35;
        }
        .pp-hero-orb-1 { width: 340px; height: 340px; background: #818cf8; top: -140px; right: -80px; }
        .pp-hero-orb-2 { width: 220px; height: 220px; background: #c7d2fe; bottom: -100px; left: 10%; }
        .pp-hero-grid {
          position: absolute; inset: 0;
          background-image: radial-gradient(rgba(255,255,255,.07) 1px, transparent 1px);
          background-size: 28px 28px;
        }
        .pp-hero-topbar {
          position: relative; z-index: 10;
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 32px;
        }
        .pp-hero-back, .pp-hero-signout {
          display: flex; align-items: center; gap: 7px;
          background: rgba(255,255,255,.15); border: 1px solid rgba(255,255,255,.25);
          color: #fff; border-radius: 100px; padding: 7px 16px;
          font-size: .82rem; font-weight: 600; cursor: pointer;
          transition: background .2s;
        }
        .pp-hero-back:hover, .pp-hero-signout:hover { background: rgba(255,255,255,.25); }
        .pp-hero-brand {
          font-size: 1.25rem; font-weight: 700; color: #fff;
          letter-spacing: -.02em;
        }
        .pp-hero-right-actions {
          display: flex; align-items: center; gap: 8px;
        }
        /* Banner upload button */
        .pp-banner-upload-btn {
          display: flex; align-items: center; gap: 7px;
          background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.22);
          color: #fff; border-radius: 100px; padding: 7px 14px;
          font-size: .78rem; font-weight: 600; cursor: pointer;
          transition: background .2s; white-space: nowrap;
        }
        .pp-banner-upload-btn:hover:not(:disabled) { background: rgba(255,255,255,.22); }
        .pp-banner-upload-btn:disabled { opacity: .6; cursor: not-allowed; }

        /* ── IDENTITY STRIP ── */
        .pp-identity-strip {
          background: #fff;
          border-bottom: 1px solid #E3DDD3;
          box-shadow: 0 2px 12px rgba(55,48,163,.06);
        }
        .pp-identity-inner {
          max-width: 1200px; margin: 0 auto;
          padding: 0 32px 20px;
          display: flex; align-items: flex-end; gap: 24px;
          margin-top: -48px; position: relative; z-index: 5;
          flex-wrap: wrap;
        }

        /* Avatar */
        .pp-av-wrap {
          position: relative; width: 108px; height: 108px;
          border-radius: 50%; cursor: pointer; flex-shrink: 0;
          border: 4px solid #fff;
          box-shadow: 0 4px 20px rgba(55,48,163,.18);
        }
        .pp-av {
          width: 100%; height: 100%; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 2.2rem; font-weight: 700;
        }
        .pp-av-img { object-fit: cover; }
        .pp-av-placeholder { background: linear-gradient(135deg,#3730a3,#6366f1); color: #fff; }
        .pp-av-overlay {
          position: absolute; inset: 0; border-radius: 50%;
          background: rgba(55,48,163,.6); color: #fff;
          display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px;
          font-size: 1.2rem; opacity: 0; transition: opacity .2s;
        }
        .pp-av-overlay-hint {
          font-size: .52rem; font-weight: 600; opacity: .85;
          letter-spacing: .3px; text-align: center;
        }
        .pp-av-wrap:hover .pp-av-overlay { opacity: 1; }

        /* ── Name moves slightly lower via padding-top ── */
        .pp-identity-info { flex: 1; padding-bottom: 6px; padding-top: 52px; min-width: 0; }
        .pp-identity-name {
          font-size: 1.5rem; font-weight: 700;
          color: #1E1B4B; letter-spacing: -.02em; margin-bottom: 8px;
        }
        .pp-identity-contacts { display: flex; flex-wrap: wrap; gap: 8px; }
        .pp-contact-pill {
          display: inline-flex; align-items: center; gap: 6px;
          background: #EEF2FF; color: #3730A3;
          border: 1px solid #C7D2FE; border-radius: 100px;
          padding: 4px 12px; font-size: .8rem; font-weight: 500;
        }
        .pp-contact-pill svg { font-size: .75rem; }

        .pp-plan-badge {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 7px 16px; border-radius: 100px;
          font-size: .82rem; font-weight: 700;
          letter-spacing: .2px; margin-bottom: 6px; flex-shrink: 0;
        }
        .pp-plan-badge.free { background: #EEF2FF; color: #3730A3; border: 1px solid #C7D2FE; }
        .pp-plan-badge.pro  { background: linear-gradient(135deg,#3730A3,#6366f1); color: #fff; border: none; box-shadow: 0 4px 14px rgba(99,102,241,.35); }

        /* ── LAYOUT ── */
        .pp-layout {
          max-width: 1200px; margin: 0 auto;
          padding: 32px 32px 60px;
          display: flex; gap: 28px; align-items: flex-start;
        }

        /* ── SIDEBAR ── */
        .pp-sidebar {
          width: 252px; flex-shrink: 0;
          display: flex; flex-direction: column; gap: 12px;
          position: sticky; top: 24px;
        }

        .pp-sidebar-card {
          background: #fff; border: 1px solid #E3DDD3;
          border-radius: 18px; padding: 18px 20px;
          box-shadow: 0 1px 6px rgba(55,48,163,.05);
        }
        .pp-sidebar-card-title {
          font-size: .68rem; font-weight: 700; text-transform: uppercase;
          letter-spacing: .6px; color: #7B77A8; margin-bottom: 14px;
        }
        .pp-contact-list { list-style: none; display: flex; flex-direction: column; gap: 12px; }
        .pp-contact-item { display: flex; align-items: flex-start; gap: 10px; }
        .pp-contact-icon-wrap {
          width: 30px; height: 30px; flex-shrink: 0;
          background: #EEF2FF; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          color: #6366f1; font-size: .75rem; margin-top: 1px;
        }
        .pp-contact-label { font-size: .68rem; color: #7B77A8; text-transform: uppercase; letter-spacing: .4px; font-weight: 600; }
        .pp-contact-value { font-size: .82rem; color: #1E1B4B; font-weight: 500; margin-top: 1px; word-break: break-all; }
        .pp-mono { font-family: 'SF Mono', 'Fira Code', monospace !important; font-size: .78rem !important; color: #4A4580 !important; }

        .pp-sidebar-actions { display: flex; flex-direction: column; gap: 7px; }
        .pp-action-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 16px; border-radius: 12px;
          font-size: .85rem; font-weight: 600; cursor: pointer;
          transition: all .18s; border: none; width: 100%;
        }
        .pp-action-primary {
          background: linear-gradient(135deg, #3730A3, #6366f1);
          color: #fff; box-shadow: 0 3px 12px rgba(99,102,241,.3);
        }
        .pp-action-primary:hover { opacity: .9; transform: translateY(-1px); box-shadow: 0 6px 18px rgba(99,102,241,.4); }
        .pp-action-secondary {
          background: #EEF2FF; color: #3730A3;
          border: 1px solid #C7D2FE;
        }
        .pp-action-secondary:hover { background: #E0E7FF; }

        .pp-sidebar-nav {
          background: #fff; border: 1px solid #E3DDD3;
          border-radius: 18px; padding: 8px;
          box-shadow: 0 1px 6px rgba(55,48,163,.05);
          display: flex; flex-direction: column; gap: 2px;
        }
        .pp-nav-item {
          display: flex; align-items: center; gap: 9px;
          padding: 9px 12px; border-radius: 10px;
          font-size: .88rem; color: #4A4580; font-weight: 500;
          cursor: pointer; background: none; border: none;
          transition: all .15s; text-align: left; width: 100%;
        }
        .pp-nav-item:hover { background: #F0EBE0; color: #1E1B4B; }
        .pp-nav-item.active { background: #EEF2FF; color: #3730A3; font-weight: 600; }
        .pp-nav-icon { width: 14px; height: 14px; flex-shrink: 0; }
        .pp-nav-badge {
          margin-left: auto; font-size: .7rem; font-weight: 700;
          background: #EEF2FF; color: #3730A3;
          border-radius: 100px; padding: 1px 7px;
        }

        .pp-signout-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 9px 14px; border-radius: 10px;
          font-size: .84rem; color: #EF4444; font-weight: 500;
          background: none; border: 1px solid #FECACA; cursor: pointer;
          transition: all .15s; width: 100%;
        }
        .pp-signout-btn:hover { background: #FEF2F2; }

        /* ── MAIN ── */
        .pp-main { flex: 1; min-width: 0; }
        .pp-section { display: flex; flex-direction: column; gap: 16px; }

        /* Cards */
        .pp-cards-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .pp-card {
          background: #fff; border: 1px solid #E3DDD3;
          border-radius: 18px; overflow: hidden;
          box-shadow: 0 1px 6px rgba(55,48,163,.05);
          transition: box-shadow .2s, border-color .2s;
        }
        .pp-card:hover { box-shadow: 0 4px 20px rgba(55,48,163,.09); border-color: #C7D2FE; }
        .pp-card-full { grid-column: 1 / -1; }
        .pp-card-head {
          display: flex; align-items: flex-start; justify-content: space-between;
          padding: 16px 20px 12px; border-bottom: 1px solid #EAE3D6;
        }
        .pp-card-title { font-size: .92rem; font-weight: 700; color: #1E1B4B; }
        .pp-card-sub { font-size: .75rem; color: #7B77A8; margin-top: 2px; }

        .pp-edit-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 6px 13px; border-radius: 100px;
          font-size: .78rem; font-weight: 600; cursor: pointer;
          background: #EEF2FF; color: #3730A3;
          border: 1px solid #C7D2FE; transition: all .15s;
          flex-shrink: 0;
        }
        .pp-edit-btn:hover { background: #E0E7FF; }
        .pp-edit-btn.active { background: #FEF2F2; color: #EF4444; border-color: #FECACA; }

        .pp-icon-btn {
          width: 32px; height: 32px; border-radius: 8px;
          background: #EEF2FF; color: #6366f1;
          border: 1px solid #C7D2FE; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: .8rem; transition: all .15s;
        }
        .pp-icon-btn:hover { background: #E0E7FF; }

        /* Fields */
        .pp-fields {
          padding: 16px 20px;
          display: grid; grid-template-columns: 1fr 1fr; gap: 0;
        }
        .pp-field {
          padding: 10px 0;
          border-bottom: 1px solid #EAE3D6;
          display: flex; flex-direction: column; gap: 3px;
        }
        .pp-field:nth-child(odd) { padding-right: 20px; border-right: 1px solid #EAE3D6; }
        .pp-field:nth-child(even) { padding-left: 20px; }
        .pp-field:nth-last-child(-n+2) { border-bottom: none; }
        .pp-field-full { grid-column: span 2; border-right: none !important; padding-right: 0 !important; }
        .pp-field-lbl { font-size: .68rem; text-transform: uppercase; letter-spacing: .5px; font-weight: 600; color: #7B77A8; }
        .pp-field-val { font-size: .9rem; color: #1E1B4B; font-weight: 500; }
        .pp-pw-dots { letter-spacing: 4px; font-size: 1.1rem; color: #7B77A8; }
        .pp-status-ok { color: #10B981 !important; font-weight: 600 !important; }

        /* Edit form */
        .pp-edit-form { padding: 16px 20px; display: flex; flex-direction: column; gap: 14px; }
        .pp-edit-form-narrow { max-width: 400px; }
        .pp-form-group { display: flex; flex-direction: column; gap: 5px; }
        .pp-form-label { font-size: .8rem; font-weight: 600; color: #4A4580; }
        .pp-input-wrap { position: relative; }
        .pp-input {
          width: 100%; padding: 11px 14px;
          background: #FAF8F3; border: 1.5px solid #D9D1C0;
          border-radius: 10px; font-size: .9rem; color: #1E1B4B;
          font-family: inherit; transition: all .2s; outline: none;
          box-sizing: border-box;
        }
        .pp-input:focus { border-color: #6366f1; background: #fff; box-shadow: 0 0 0 3px rgba(99,102,241,.12); }
        .pp-input::placeholder { color: #B4B2A9; }
        .pp-eye {
          position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
          background: none; border: none; color: #7B77A8; cursor: pointer;
          padding: 4px; transition: color .15s;
        }
        .pp-eye:hover { color: #1E1B4B; }

        .pp-save-btn {
          display: inline-flex; align-items: center; gap: 8px;
          align-self: flex-start;
          padding: 10px 22px; border-radius: 10px;
          background: linear-gradient(135deg, #3730A3, #6366f1);
          color: #fff; border: none; font-size: .88rem; font-weight: 600;
          cursor: pointer; transition: all .2s;
          box-shadow: 0 3px 12px rgba(99,102,241,.3);
        }
        .pp-save-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(99,102,241,.4); }
        .pp-save-btn:disabled { opacity: .5; cursor: not-allowed; box-shadow: none; }

        /* Plan card */
        .pp-card-plan .pp-plan-row {
          display: flex; align-items: center; gap: 14px;
          padding: 16px 20px;
        }
        .pp-plan-icon {
          width: 42px; height: 42px; border-radius: 12px;
          background: #EEF2FF; color: #6366f1;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.1rem; flex-shrink: 0;
        }
        .pp-plan-icon.pro { background: linear-gradient(135deg,#3730A3,#6366f1); color: #fff; }
        .pp-plan-name { font-size: .92rem; font-weight: 700; color: #1E1B4B; }
        .pp-plan-detail { font-size: .75rem; color: #7B77A8; margin-top: 2px; }

        .pp-upgrade-banner {
          display: flex; align-items: center; justify-content: space-between;
          gap: 12px;
          margin: 0 16px 16px; padding: 12px 14px;
          background: linear-gradient(135deg, #EEF2FF, #E0E7FF);
          border: 1px solid #C7D2FE; border-radius: 12px;
        }
        .pp-upgrade-text { display: flex; flex-direction: column; gap: 1px; }
        .pp-upgrade-text strong { font-size: .85rem; color: #3730A3; font-weight: 700; }
        .pp-upgrade-text span { font-size: .75rem; color: #6366f1; }
        .pp-upgrade-btn {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 8px 14px; border-radius: 100px;
          background: linear-gradient(135deg,#3730A3,#6366f1);
          color: #fff; border: none; font-size: .8rem; font-weight: 700;
          cursor: pointer; white-space: nowrap; flex-shrink: 0;
          transition: opacity .15s;
        }
        .pp-upgrade-btn:hover { opacity: .9; }

        /* Quota mini */
        .pp-skel-wrap { padding: 16px 20px; display: flex; flex-direction: column; gap: 10px; }
        .pp-quota-big { display: flex; align-items: baseline; gap: 6px; padding: 16px 20px 4px; }
        .pp-quota-used { font-size: 2.4rem; font-weight: 800; color: #3730A3; line-height: 1; }
        .pp-quota-sep { font-size: 1.4rem; color: #B4B2A9; }
        .pp-quota-total { font-size: 1.4rem; color: #7B77A8; font-weight: 600; }
        .pp-quota-bar-wrap {
          height: 5px; background: #EAE3D6; border-radius: 3px;
          overflow: hidden; margin: 4px 20px;
        }
        .pp-quota-bar-fill {
          height: 100%; border-radius: 3px;
          background: linear-gradient(90deg, #3730A3, #6366f1);
          transition: width .8s cubic-bezier(.22,1,.36,1);
        }
        .pp-quota-info {
          display: flex; justify-content: space-between;
          padding: 4px 20px 16px; font-size: .78rem;
        }
        .pp-quota-ok { color: #10B981; font-weight: 600; }
        .pp-quota-warn { color: #EF4444; font-weight: 600; }
        .pp-quota-pct { color: #7B77A8; }

        /* Stats section */
        .pp-stats-hero { padding: 20px 20px 8px; }
        .pp-stats-nums { display: flex; align-items: baseline; gap: 8px; margin-bottom: 4px; }
        .pp-stat-big { font-size: 3.5rem; font-weight: 800; color: #3730A3; line-height: 1; letter-spacing: -.03em; }
        .pp-stat-div { font-size: 2rem; color: #C7D2FE; font-weight: 300; }
        .pp-stat-total { font-size: 2rem; color: #7B77A8; font-weight: 600; }
        .pp-stat-caption { font-size: .88rem; color: #7B77A8; }
        .pp-track-wrap { padding: 8px 20px 20px; }
        .pp-track {
          height: 7px; background: #EAE3D6; border-radius: 4px;
          overflow: hidden; margin-bottom: 8px;
        }
        .pp-track-fill {
          height: 100%; border-radius: 4px;
          background: linear-gradient(90deg, #3730A3, #6366f1);
          transition: width .8s cubic-bezier(.22,1,.36,1);
        }
        .pp-track-fill.warn { background: linear-gradient(90deg, #F59E0B, #EF4444); }
        .pp-track-labels { display: flex; justify-content: space-between; font-size: .72rem; color: #B4B2A9; font-weight: 600; }

        .pp-stat-boxes {
          display: grid; grid-template-columns: repeat(3,1fr);
          gap: 1px; background: #EAE3D6;
          border-top: 1px solid #EAE3D6;
          border-bottom-left-radius: 18px; border-bottom-right-radius: 18px;
          overflow: hidden;
        }
        .pp-stat-box {
          background: #fff; padding: 16px 20px;
          display: flex; flex-direction: column; gap: 4px;
        }
        .pp-stat-box-num { font-size: 1.6rem; font-weight: 800; color: #1E1B4B; line-height: 1; }
        .pp-stat-box-lbl { font-size: .7rem; text-transform: uppercase; letter-spacing: .4px; font-weight: 600; color: #7B77A8; }
        .pp-stat-box.ok .pp-stat-box-num { color: #10B981; }
        .pp-stat-box.warn .pp-stat-box-num { color: #EF4444; }
        .pp-stat-box.neutral .pp-stat-box-num { color: #3730A3; }

        .pp-warn-banner {
          display: flex; align-items: flex-start; gap: 12px;
          margin: 0 20px 20px; padding: 14px 16px;
          background: #FEF2F2; border: 1px solid #FECACA;
          border-radius: 12px;
        }
        .pp-warn-icon { color: #EF4444; margin-top: 2px; }
        .pp-warn-text { font-size: .84rem; color: #7F1D1D; line-height: 1.5; }

        /* Skeletons */
        @keyframes pp-shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
        .pp-skel {
          background: linear-gradient(90deg, #EAE3D6 25%, #F0EBE0 50%, #EAE3D6 75%);
          background-size: 400px 100%; animation: pp-shimmer 1.4s ease-in-out infinite;
          border-radius: 6px;
        }
        .pp-skel-big { height: 52px; width: 140px; margin-bottom: 8px; }
        .pp-skel-bar { height: 7px; width: 100%; margin-bottom: 16px; }
        .pp-skel-num { height: 28px; width: 54px; }
        .pp-stats-skel { padding: 20px; display: flex; flex-direction: column; gap: 8px; }

        /* ── Responsive ── */
        @media (max-width: 960px) {
          .pp-layout { padding: 24px 20px 48px; gap: 20px; }
          .pp-sidebar { width: 220px; }
        }
        @media (max-width: 768px) {
          .pp-hero { height: 130px; }
          .pp-hero-topbar { padding: 12px 20px; }
          .pp-hero-brand { display: none; }
          .pp-banner-upload-btn span { display: none; }
          .pp-identity-inner { padding: 0 20px 16px; gap: 14px; margin-top: -36px; }
          .pp-av-wrap { width: 82px; height: 82px; }
          .pp-identity-info { padding-top: 38px; }
          .pp-identity-name { font-size: 1.2rem; }
          .pp-layout { flex-direction: column; padding: 16px 16px 40px; }
          .pp-sidebar { width: 100%; position: static; }
          .pp-cards-grid { grid-template-columns: 1fr; }
          .pp-fields { grid-template-columns: 1fr; }
          .pp-field:nth-child(odd) { padding-right: 0; border-right: none; }
          .pp-field:nth-child(even) { padding-left: 0; }
          .pp-stat-boxes { grid-template-columns: 1fr; }
          .pp-voice-features { grid-template-columns: 1fr; }
          .pp-voice-hero { flex-direction: column; }
          .pp-voice-cta { width: 100%; justify-content: center; }
        }

        /* ── Voice section ── */
        .pp-voice-hero {
          display: flex; align-items: flex-start; gap: 20px;
          padding: 24px 24px 20px; flex-wrap: wrap;
        }
        .pp-voice-icon-wrap {
          width: 56px; height: 56px; flex-shrink: 0;
          background: linear-gradient(135deg, #3730A3, #6366f1);
          border-radius: 16px; display: flex; align-items: center; justify-content: center;
          color: #fff; font-size: 1.5rem;
          box-shadow: 0 4px 14px rgba(99,102,241,.35);
        }
        .pp-voice-text { flex: 1; min-width: 200px; }
        .pp-voice-title {
          font-size: 1.05rem; font-weight: 700; color: #1E1B4B;
          margin: 0 0 8px;
        }
        .pp-voice-desc {
          font-size: .88rem; color: #4A4580; line-height: 1.6;
          margin: 0 0 14px;
        }
        .pp-voice-tags { display: flex; flex-wrap: wrap; gap: 8px; }
        .pp-voice-tag {
          display: inline-flex; align-items: center;
          background: #EEF2FF; color: #3730A3;
          border: 1px solid #C7D2FE; border-radius: 100px;
          padding: 4px 12px; font-size: .78rem; font-weight: 600;
        }
        .pp-voice-cta {
          display: inline-flex; align-items: center; gap: 10px;
          padding: 13px 24px; border-radius: 12px;
          background: linear-gradient(135deg, #3730A3, #6366f1);
          color: #fff; border: none; font-size: .92rem; font-weight: 700;
          cursor: pointer; white-space: nowrap; flex-shrink: 0; align-self: center;
          box-shadow: 0 4px 16px rgba(99,102,241,.35);
          transition: all .2s;
        }
        .pp-voice-cta:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(99,102,241,.45); }
        .pp-voice-features {
          display: grid; grid-template-columns: repeat(2, 1fr);
          gap: 1px; background: #EAE3D6;
          border-top: 1px solid #EAE3D6;
          border-bottom-left-radius: 18px; border-bottom-right-radius: 18px;
          overflow: hidden;
        }
        .pp-voice-feature {
          background: #fff; padding: 16px 20px;
          display: flex; align-items: flex-start; gap: 12px;
        }
        .pp-voice-feature-emoji { font-size: 1.4rem; line-height: 1; flex-shrink: 0; margin-top: 1px; }
        .pp-voice-feature-title { font-size: .88rem; font-weight: 700; color: #1E1B4B; margin-bottom: 3px; }
        .pp-voice-feature-desc { font-size: .78rem; color: #7B77A8; line-height: 1.5; }
      `}</style>
    </div>
  );
}