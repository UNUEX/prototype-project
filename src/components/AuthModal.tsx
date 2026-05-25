// components/AuthModal.tsx
'use client';

import React, { useState, useCallback, memo } from 'react';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTimes, faEye, faEyeSlash, faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/hooks/useTranslation';
import { toast } from 'react-hot-toast';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegisterClick: () => void;
}

const AuthModal = memo(function AuthModal({ isOpen, onClose, onRegisterClick }: AuthModalProps) {
  const { signIn } = useAuth();
  const { t } = useTranslation();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const resetForm = useCallback(() => {
    setEmail('');
    setPassword('');
    setShowPass(false);
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error(error);
      } else {
        onClose();
        resetForm();
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error?.message || t('errors.general_error') || 'Произошла ошибка');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  }, []);

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  }, []);

  const toggleShowPass = useCallback(() => {
    setShowPass(prev => !prev);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-split" onClick={e => e.stopPropagation()}>
        <div className="split-left">
          <div className="split-left-top">
            <div className="split-logo">
              <Image src="/img/gen4.png" alt="Hiversity" width={32} height={32} style={{ borderRadius: '50%', objectFit: 'cover' }} />
              <span className="split-logo-name">hiversity</span>
            </div>
            <p className="split-desc">{t('auth.modal_desc') || 'Генерируйте учебные планы, документы и расписания — в несколько кликов.'}</p>
          </div>
        </div>

        <div className="split-right">
          <button className="split-close" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>

          <h2 className="split-title">{t('common.welcome_back')}</h2>
          <p className="split-sub">{t('auth.login_prompt')}</p>

          <form onSubmit={handleAuth} className="split-form">
            <div className="split-field">
              <label>{t('auth.email')}</label>
              <input
                type="email"
                placeholder={t('auth.email_placeholder')}
                value={email}
                onChange={handleEmailChange}
                required
                autoComplete="email"
              />
            </div>
            <div className="split-field">
              <label>{t('auth.password')}</label>
              <div className="pass-wrap">
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder={t('auth.password_placeholder')}
                  value={password}
                  onChange={handlePasswordChange}
                  required
                  minLength={6}
                  autoComplete="current-password"
                />
                <button type="button" className="split-pass-toggle" onClick={toggleShowPass}>
                  <FontAwesomeIcon icon={showPass ? faEyeSlash : faEye} />
                </button>
              </div>
            </div>

            <div className="split-row">
              <label className="split-remember">
                <input type="checkbox" />
                {t('auth.remember_me') || 'Запомнить меня'}
              </label>
            </div>

            <div className="split-row split-row-between">
</div>

            <button type="submit" className="split-submit" disabled={isAuthLoading}>
              {isAuthLoading
                ? <FontAwesomeIcon icon={faSpinner} spin />
                : t('auth.login')}
            </button>
          </form>

          <p className="split-footer-text">
            {t('auth.no_account') || 'Нет аккаунта?'}{' '}
            <button
              type="button"
              className="split-link"
              onClick={() => {
                onClose();
                onRegisterClick();
              }}
            >
              {t('auth.register') || 'Зарегистрироваться'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
});

export default AuthModal;