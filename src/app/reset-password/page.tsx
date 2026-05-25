//app/reset-password/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { AuthProvider } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabaseClient';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEye, faEyeSlash, faSpinner, faArrowLeft,
  faCheckCircle, faShieldHalved,
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-hot-toast';

// Компонент с формой сброса пароля
function ResetPasswordForm() {
  const router = useRouter();
  const { updatePassword } = useAuth();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidLink, setIsValidLink] = useState(false);
  const [language, setLanguage] = useState<'ru' | 'kz' | 'en'>('ru');

  const getText = () => {
    const texts = {
      ru: {
        title: 'Создание нового пароля',
        subtitle: 'Введите новый пароль для вашей учётной записи',
        password: 'Новый пароль',
        confirm: 'Подтвердите пароль',
        passwordPlaceholder: 'Минимум 6 символов',
        confirmPlaceholder: 'Повторите пароль',
        save: 'Сохранить пароль',
        back: 'Назад',
        success: 'Пароль изменён!',
        successMessage: 'Ваш пароль был успешно изменён. Сейчас вы будете перенаправлены на главную страницу.',
        goHome: 'Перейти на главную',
        invalidLink: 'Недействительная ссылка',
        invalidMessage: 'Ссылка для сброса пароля недействительна или истекла. Запросите новую ссылку для сброса пароля.',
        passwordMinLength: 'Пароль должен содержать минимум 6 символов',
        passwordsDoNotMatch: 'Пароли не совпадают',
        passwordChanged: 'Пароль успешно изменён',
        errorOccurred: 'Произошла ошибка'
      },
      kz: {
        title: 'Жаңа құпия сөз жасау',
        subtitle: 'Аккаунтыңыз үшін жаңа құпия сөз енгізіңіз',
        password: 'Жаңа құпия сөз',
        confirm: 'Құпия сөзді растаңыз',
        passwordPlaceholder: 'Кемінде 6 таңба',
        confirmPlaceholder: 'Құпия сөзді қайталаңыз',
        save: 'Құпия сөзді сақтау',
        back: 'Артқа',
        success: 'Құпия сөз өзгертілді!',
        successMessage: 'Құпия сөзіңіз сәтті өзгертілді. Қазір сіз басты бетке ауысасыз.',
        goHome: 'Басты бетке өту',
        invalidLink: 'Жарамсыз сілтеме',
        invalidMessage: 'Құпия сөзді қалпына келтіру сілтемесі жарамсыз немесе мерзімі өткен. Жаңа сілтеме сұраңыз.',
        passwordMinLength: 'Құпия сөз кемінде 6 таңбадан тұруы керек',
        passwordsDoNotMatch: 'Құпия сөздер сәйкес келмейді',
        passwordChanged: 'Құпия сөз сәтті өзгертілді',
        errorOccurred: 'Қате орын алды'
      },
      en: {
        title: 'Create new password',
        subtitle: 'Enter a new password for your account',
        password: 'New password',
        confirm: 'Confirm password',
        passwordPlaceholder: 'Minimum 6 characters',
        confirmPlaceholder: 'Repeat password',
        save: 'Save password',
        back: 'Back',
        success: 'Password changed!',
        successMessage: 'Your password has been successfully changed. You will be redirected to the home page.',
        goHome: 'Go to home',
        invalidLink: 'Invalid link',
        invalidMessage: 'The password reset link is invalid or has expired. Please request a new one.',
        passwordMinLength: 'Password must be at least 6 characters',
        passwordsDoNotMatch: 'Passwords do not match',
        passwordChanged: 'Password successfully changed',
        errorOccurred: 'An error occurred'
      }
    };
    return texts[language];
  };

  useEffect(() => {
    // Определяем язык
    const savedLang = localStorage.getItem('hiversity-language') as 'ru' | 'kz' | 'en';
    if (savedLang) {
      setLanguage(savedLang);
    }
    
    // Проверяем сессию
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
          setIsValidLink(false);
          return;
        }
        
        if (session) {
          setIsValidLink(true);
          console.log('Session found, link is valid');
        } else {
          setIsValidLink(false);
          console.log('No session found');
          toast.error(getText().invalidMessage);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setIsValidLink(false);
      }
    };
    
    checkSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 6) {
      toast.error(getText().passwordMinLength);
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error(getText().passwordsDoNotMatch);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { error } = await updatePassword(password);
      
      if (error) {
        toast.error(error);
      } else {
        setIsSuccess(true);
        toast.success(getText().passwordChanged);
        
        setTimeout(() => {
          router.push(`/${language}`);
        }, 3000);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : getText().errorOccurred);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.push(`/${language}`);
  };

  const text = getText();

  if (!isValidLink && !isSuccess) {
    return (
      <div className="reset-root">
        <div className="reset-card">
          <button className="reset-back" onClick={handleBack}>
            <FontAwesomeIcon icon={faArrowLeft} />
            <span>{text.back}</span>
          </button>
          <div className="reset-error">
            <div className="reset-error-icon">⚠️</div>
            <h2>{text.invalidLink}</h2>
            <p>{text.invalidMessage}</p>
            <button className="reset-btn" onClick={handleBack}>
              {text.goHome}
            </button>
          </div>
        </div>
        
        <style jsx>{`
          .reset-root {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
            padding: 20px;
          }
          .reset-card {
            background: #fff;
            border-radius: 24px;
            padding: 40px;
            max-width: 480px;
            width: 100%;
            box-shadow: 0 20px 40px rgba(0,0,0,0.2);
          }
          .reset-back {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: none;
            border: none;
            color: #666;
            cursor: pointer;
            padding: 0;
            margin-bottom: 24px;
            font-size: 0.9rem;
          }
          .reset-back:hover { color: #3730a3; }
          .reset-error { text-align: center; }
          .reset-error-icon { font-size: 4rem; margin-bottom: 16px; }
          .reset-error h2 { margin: 0 0 12px; color: #1e1b4b; }
          .reset-error p { color: #666; margin-bottom: 24px; line-height: 1.6; }
          .reset-btn {
            background: linear-gradient(135deg, #3730a3, #6366f1);
            color: #fff;
            border: none;
            padding: 12px 24px;
            border-radius: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s;
          }
          .reset-btn:hover { transform: translateY(-2px); }
        `}</style>
      </div>
    );
  }

  return (
    <div className="reset-root">
      <div className="reset-card">
        <button className="reset-back" onClick={handleBack}>
          <FontAwesomeIcon icon={faArrowLeft} />
          <span>{text.back}</span>
        </button>

        {isSuccess ? (
          <div className="reset-success">
            <div className="reset-success-icon">
              <FontAwesomeIcon icon={faCheckCircle} />
            </div>
            <h2>{text.success}</h2>
            <p>{text.successMessage}</p>
            <button className="reset-btn" onClick={() => router.push(`/${language}`)}>
              {text.goHome}
            </button>
          </div>
        ) : (
          <>
            <div className="reset-header">
              <div className="reset-icon">
                <FontAwesomeIcon icon={faShieldHalved} />
              </div>
              <h1>{text.title}</h1>
              <p>{text.subtitle}</p>
            </div>

            <form onSubmit={handleSubmit} className="reset-form">
              <div className="reset-field">
                <label>{text.password}</label>
                <div className="reset-pass-wrap">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={text.passwordPlaceholder}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="reset-pass-toggle"
                    onClick={() => setShowPassword(v => !v)}
                  >
                    <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                  </button>
                </div>
              </div>

              <div className="reset-field">
                <label>{text.confirm}</label>
                <div className="reset-pass-wrap">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder={text.confirmPlaceholder}
                    required
                  />
                  <button
                    type="button"
                    className="reset-pass-toggle"
                    onClick={() => setShowConfirmPassword(v => !v)}
                  >
                    <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="reset-submit"
                disabled={isLoading || !password || !confirmPassword}
              >
                {isLoading
                  ? <FontAwesomeIcon icon={faSpinner} spin />
                  : text.save}
              </button>
            </form>
          </>
        )}
      </div>

      <style jsx>{`
        .reset-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
          padding: 20px;
        }
        .reset-card {
          background: #fff;
          border-radius: 24px;
          padding: 40px;
          max-width: 480px;
          width: 100%;
          box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        }
        .reset-back {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: none;
          border: none;
          color: #666;
          cursor: pointer;
          padding: 0;
          margin-bottom: 24px;
          font-size: 0.9rem;
        }
        .reset-back:hover { color: #3730a3; }
        .reset-header { text-align: center; margin-bottom: 32px; }
        .reset-icon {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          background: linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15));
          border: 1px solid rgba(99,102,241,0.25);
          color: #6366f1;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.4rem;
          margin: 0 auto 20px;
        }
        .reset-header h1 {
          margin: 0 0 8px;
          font-size: 1.75rem;
          font-weight: 700;
          color: #1e1b4b;
        }
        .reset-header p {
          margin: 0;
          color: #666;
          font-size: 0.9rem;
        }
        .reset-form { display: flex; flex-direction: column; gap: 20px; }
        .reset-field { display: flex; flex-direction: column; gap: 6px; }
        .reset-field label {
          font-size: 0.8rem;
          font-weight: 600;
          color: #4a4580;
        }
        .reset-pass-wrap {
          position: relative;
        }
        .reset-pass-wrap input {
          width: 100%;
          padding: 12px 14px;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          font-size: 0.95rem;
          outline: none;
          transition: all 0.2s;
          box-sizing: border-box;
        }
        .reset-pass-wrap input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
        }
        .reset-pass-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 4px;
        }
        .reset-pass-toggle:hover { color: #6366f1; }
        .reset-submit {
          width: 100%;
          background: linear-gradient(135deg, #3730a3, #6366f1);
          color: #fff;
          border: none;
          padding: 14px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 8px;
        }
        .reset-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(99,102,241,0.3);
        }
        .reset-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .reset-success {
          text-align: center;
        }
        .reset-success-icon {
          font-size: 4rem;
          color: #10b981;
          margin-bottom: 20px;
        }
        .reset-success h2 {
          margin: 0 0 12px;
          color: #1e1b4b;
        }
        .reset-success p {
          color: #666;
          margin-bottom: 24px;
          line-height: 1.6;
        }
        .reset-btn {
          background: linear-gradient(135deg, #3730a3, #6366f1);
          color: #fff;
          border: none;
          padding: 12px 24px;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .reset-btn:hover { transform: translateY(-2px); }
      `}</style>
    </div>
  );
}

// Основной компонент страницы с оберткой AuthProvider
export default function ResetPasswordPage() {
  return (
    <AuthProvider>
      <ResetPasswordForm />
    </AuthProvider>
  );
}