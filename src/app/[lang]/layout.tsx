// app/[lang]/layout.tsx
import { Toaster } from 'react-hot-toast';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { AuthProvider } from '@/hooks/useAuth';
import { GlobalModals } from './GlobalModals';

export default function LangLayout({
  children,
}: {
  children: React.ReactNode;
  params: { lang: string };
}) {
  return (
    <AuthProvider>
      <LanguageProvider>
        <Toaster
          position="bottom-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1a1a2e',
              color: '#fff',
              borderRadius: '40px',
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: '500',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
        <GlobalModals />
        {children}
      </LanguageProvider>
    </AuthProvider>
  );
}