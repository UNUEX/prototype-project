// app/[lang]/register/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import RegisterPage from '@/components/RegisterPage';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

export default function RegisterRoute() {
  const { user, loading } = useAuth();
  const { language } = useLanguage();
  const router = useRouter();

  // Если пользователь уже залогинен — редиректим на профиль
  useEffect(() => {
    if (!loading && user) {
      router.replace(`/${language}/profile`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, language]);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: '#08080d',
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', color: '#818cf8', fontSize: '2rem',
      }}>
        <FontAwesomeIcon icon={faSpinner} spin />
      </div>
    );
  }

  // Пока грузится или юзер уже есть — не рендерим форму
  if (user) return null;

  return <RegisterPage />;
}