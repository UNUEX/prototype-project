// app/layout.tsx — корневой layout, ТОЛЬКО HTML скелет без провайдеров
import type { Metadata } from 'next';
import { Inter, Manrope } from 'next/font/google';
import './global.css';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});
const manrope = Manrope({
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  variable: '--font-manrope',
});

export const metadata: Metadata = {
  title: 'HIVersity',
  description: 'Создавайте учебные программы и календарные планы за минуты',
  keywords: 'РУП, силлабус, календарный план, генератор, AI',
  authors: [{ name: 'RUP Generator Team' }],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${inter.className} ${manrope.variable}`}>
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}