// components/Footer.tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/hooks/useTranslation';
import './Footer.css';

type FooterVariant = 'light' | 'dark';

export default function Footer({
  variant = 'light',
}: {
  variant?: FooterVariant;
}) {
  const router = useRouter();
  const { language } = useLanguage();
  const { t } = useTranslation();

  const columns = [
    {
      title: t('footer.product') || 'Инструменты',
      links: [
        { label: t('header.canvas_editor') || 'Canvas', path: `/${language}/canvas` },
        { label: t('header.step_by_step') || 'SBS', path: `/${language}/canvas/sbs` },
        { label: t('header.master') || 'Мастер', path: `/${language}/canvas/master` },
      ],
    },
    {
      title: t('footer.resources') || 'Ресурсы',
      links: [
        { label: t('header.documentation') || 'Документация', path: `/${language}/docs` },
      ],
    },
    {
      title: t('footer.company') || 'Аккаунт',
      links: [
        { label: t('profile.my_profile') || 'Профиль', path: `/${language}/profile` },
        { label: t('auth.register') || 'Регистрация', path: `/${language}/register` },
      ],
    },
  ];

  const currentYear = new Date().getFullYear();

  return (
    <footer className={`ftr ftr--${variant}`}>
      <div className="ftr-container">

        <div className="ftr-top">
          <div className="ftr-brand">
            <div className="ftr-logo">
              <Image
                src="/img/gen4.png"
                alt="Hiversity"
                width={32}
                height={32}
                className="ftr-logo-img"
              />
              <span className="ftr-logo-text">hiversity.ai</span>
            </div>
            <p className="ftr-description">
              AI-платформа для создания учебной документации казахстанских преподавателей.
            </p>

            <div className="ftr-social">
              <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="ftr-icon-link" aria-label="X">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a href="https://www.instagram.com/hiversity.ai/" target="_blank" rel="noopener noreferrer" className="ftr-icon-link" aria-label="Instagram">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <circle cx="12" cy="12" r="4"/>
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
                </svg>
              </a>
              <a href="https://www.threads.com/@hiversity.ai" target="_blank" rel="noopener noreferrer" className="ftr-icon-link" aria-label="Threads">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M6.321 6.016c-.27-.18-1.166-.802-1.166-.802.756-1.081 1.753-1.502 3.132-1.502.975 0 1.803.327 2.394.948s.928 1.509 1.005 2.644q.492.207.905.484c1.109.745 1.719 1.86 1.719 3.137 0 2.716-2.226 5.075-6.256 5.075C4.594 16 1 13.987 1 7.994 1 2.034 4.482 0 8.044 0 9.69 0 13.55.243 15 5.036l-1.36.353C12.516 1.974 10.163 1.43 8.006 1.43c-3.565 0-5.582 2.171-5.582 6.79 0 4.143 2.254 6.343 5.63 6.343 2.777 0 4.847-1.443 4.847-3.556 0-1.438-1.208-2.127-1.27-2.127-.236 1.234-.868 3.31-3.644 3.31-1.618 0-3.013-1.118-3.013-2.582 0-2.09 1.984-2.847 3.55-2.847.586 0 1.294.04 1.663.114 0-.637-.54-1.728-1.9-1.728-1.25 0-1.566.405-1.967.868ZM8.716 8.19c-2.04 0-2.304.87-2.304 1.416 0 .878 1.043 1.168 1.6 1.168 1.02 0 2.067-.282 2.232-2.423a6.2 6.2 0 0 0-1.528-.161"/>
                </svg>
              </a>
              <a href="https://github.com/UNUEX" target="_blank" rel="noopener noreferrer" className="ftr-icon-link" aria-label="GitHub">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.268 2.75 1.026A9.578 9.578 0 0 1 12 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.026 2.747-1.026.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
                </svg>
              </a>
            </div>
          </div>

          <div className="ftr-grid">
            {columns.map((column) => (
              <div key={column.title} className="ftr-column">
                <h4 className="ftr-column-title">{column.title}</h4>
                <ul className="ftr-column-list">
                  {column.links.map((link) => (
                    <li key={link.path}>
                      <button className="ftr-link" onClick={() => router.push(link.path)}>
                        {link.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="ftr-bottom">
          <span className="ftr-copyright">
            © {currentYear} Hiversity. All rights reserved.
          </span>
          <div className="ftr-legal">
            <a href={`/${language}/privacy`}>Privacy Policy</a>
            <a href={`/${language}/terms`}>Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}