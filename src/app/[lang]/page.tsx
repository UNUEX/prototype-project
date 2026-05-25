// app/[lang]/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import RupForm from '@/components/RupForm';
import CalendarForm from '@/components/calendarform';
import PromptForm from '@/components/PromptForm';
import ScrollAnimation from '@/components/ScrollAnimation';

import { CalendarFormData } from '@/components/calendarform';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBolt, faGear, faBook, faCalendar,
  faFileWord, faWandMagicSparkles,
  faGraduationCap,
  faCircleInfo, faPause, faPlay,
  faArrowRight, faCheckCircle, faStar,
  faLayerGroup, faDiagramProject, faBookOpen,
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/hooks/useTranslation';
import { useLanguage } from '@/contexts/LanguageContext';
import { RupFormData } from './types/types';

type GenerationMode = 'quick' | 'detailed';
type GenerationType = 'rup' | 'calendar';

export default function Home() {
  const router = useRouter();
  const { t } = useTranslation();
  const { language } = useLanguage();

  const [isAppLoaded, setIsAppLoaded] = useState(false);
  const [generationMode, setGenerationMode] = useState<GenerationMode>('quick');
  const [generationType, setGenerationType] = useState<GenerationType>('rup');
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [activeDemo, setActiveDemo] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const toggleVideoPlay = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsVideoPlaying(!isVideoPlaying);
    }
  };

  useEffect(() => {
    const container = document.getElementById('particles-container');
    if (!container) return;
    const particleCount = 30;
    const particles: HTMLDivElement[] = [];
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'hero-particle';
      const size = Math.random() * 3 + 1;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${Math.random() * 100}%`;
      const hue = 240 + Math.random() * 40;
      particle.style.backgroundColor = `hsla(${hue}, 60%, 40%, ${Math.random() * 0.18 + 0.04})`;
      particle.style.boxShadow = `0 0 ${size * 2}px hsla(${hue}, 60%, 40%, 0.15)`;
      const duration = 6 + Math.random() * 10;
      const delay = Math.random() * 5;
      particle.style.animation = `floatParticle ${duration}s ${delay}s infinite ease-in-out`;
      container.appendChild(particle);
      particles.push(particle);
    }
    return () => { particles.forEach(p => p.remove()); };
  }, []);


  const handleGenerateRup = async (formData: RupFormData) => {
    const encodedData = encodeURIComponent(JSON.stringify(formData));
    router.push(`/${language}/canvas/sbs?generationMode=detailed&docType=rup&formData=${encodedData}`);
  };

  const handleGenerateCalendar = async (formData: CalendarFormData) => {
    const encodedData = encodeURIComponent(JSON.stringify(formData));
    router.push(`/${language}/canvas/sbs?generationMode=detailed&docType=calendar&formData=${encodedData}`);
  };

  const handleGenerateFromPrompt = async (prompt: string, type: GenerationType) => {
    const encodedPrompt = encodeURIComponent(prompt);
    const docType = type === 'rup' ? 'rup' : 'calendar';
    router.push(`/${language}/canvas/sbs?generationMode=quick&docType=${docType}&prompt=${encodedPrompt}`);
  };

  const scrollToPrompt = () =>
    document.getElementById('form-section')?.scrollIntoView({ behavior: 'smooth' });

  const demoScreens = [
    {
      label: t('home.demo_tab_rup') || 'РУП документ',
      icon: faBook,
      image: '/img/bg11.png',
      description: t('home.demo_rup_desc') || 'Автоматическая генерация рабочей учебной программы',
    },
    {
      label: t('home.demo_tab_calendar') || 'Календарь',
      icon: faCalendar,
      image: '/img/bg22.png',
      description: t('home.demo_calendar_desc') || 'Тематический план с распределением часов',
    },
    {
      label: t('home.demo_tab_export') || 'Экспорт',
      icon: faFileWord,
      description: t('home.demo_export_desc') || 'Готовый .docx файл за 2 минуты',
    },
  ];

  return (
    <div className="App">

      <Header variant="light" />

      <main className="app-main">

        {/* ===== HERO ===== */}
        <ScrollAnimation animation="fadeInUp">
          <section className="hero-section-enhanced" style={{ position: 'relative' }}>

            <div className="hero-video-background">
              <video ref={videoRef} autoPlay muted loop playsInline className="hero-video">
                <source src="/img/haluo.mp4" type="video/mp4" />
              </video>
              <div className="hero-overlay-dark" style={{ background: 'linear-gradient(to bottom, rgba(250,248,243,0.62) 0%, rgba(240,235,224,0.80) 100%)' }} />
            </div>

            <div className="hero-noise" />
            <div className="hero-holographic" />
            <div className="hero-particles" id="particles-container" />
            <div className="hero-dot-grid" />

            <button
              className="hero-video-pause-btn"
              onClick={toggleVideoPlay}
              aria-label={isVideoPlaying ? 'Pause video' : 'Play video'}
            >
              <FontAwesomeIcon icon={isVideoPlaying ? faPause : faPlay} />
            </button>

            <div className="hero-content-enhanced hero-content-v2">

              <div className="hero-pill">
                <span className="hero-pill-dot" />
                <span>{t('home.hero_badge') || 'AI-платформа для преподавателей'}</span>
              </div>

              <h1 className="hero-title hero-title-v2">
                {t('home.hero_title')}
                <br />
                <span className="gradient-text">{t('home.hero_title_gradient')}</span>
              </h1>

              <p className="hero-desc-v2">{t('home.hero_description')}</p>

              <div className="hero-actions-v2">
                <button className="hero-cta-v2 hero-cta-primary" onClick={scrollToPrompt}>
                  <span>{t('home.start_free') || 'Начать бесплатно'}</span>
                  <FontAwesomeIcon icon={faArrowRight} />
                </button>
                <button
                  className="hero-cta-v2 hero-cta-secondary"
                  onClick={() => document.getElementById('demo-section')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <span>{t('home.watch_demo') || 'Смотреть демо'}</span>
                </button>
              </div>

              <div className="hero-stats-v2">
                <div className="hero-stat-v2">
                  <span className="hero-stat-num">500+</span>
                  <span className="hero-stat-label">{t('home.documents_created') || 'документов'}</span>
                </div>
                <div className="hero-stat-sep" />
                <div className="hero-stat-v2">
                  <span className="hero-stat-num">2 {t('home.min') || 'мин'}</span>
                  <span className="hero-stat-label">{t('home.avg_time') || 'среднее время'}</span>
                </div>
                <div className="hero-stat-sep" />
                <div className="hero-stat-v2">
                  <div className="hero-stars">
                    {[...Array(5)].map((_, i) => (
                      <FontAwesomeIcon key={i} icon={faStar} style={{ color: '#FBBF24', fontSize: '0.7rem' }} />
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </section>
        </ScrollAnimation>

        {/* ===== DEMO ===== */}
        <ScrollAnimation animation="fadeInUp" delay={0.1}>
          <section id="demo-section" className="demo-section">
            <div className="demo-inner">

              <ScrollAnimation animation="fadeInUp" delay={0.1}>
                <div className="demo-header">
                  <div className="hero-badge" style={{ margin: '0 auto 1.5rem' }}>
                    <span>{t('home.demo_badge') || 'Продукт в действии'}</span>
                  </div>
                  <h2 className="demo-title">
                    {t('home.demo_title') || 'Посмотрите как '}
                    <span className="gradient-text">
                      {t('home.demo_title_gradient') || 'это работает'}
                    </span>
                  </h2>
                  <p className="demo-subtitle">
                    {t('home.demo_subtitle') || 'От простого запроса до готового документа — всего за пару минут'}
                  </p>
                </div>
              </ScrollAnimation>

              <div className="demo-layout">
                <div className="demo-tabs-panel">
                  {demoScreens.map((screen, i) => (
                    <button
                      key={i}
                      className={`demo-tab-item ${activeDemo === i ? 'active' : ''}`}
                      onClick={() => setActiveDemo(i)}
                    >
                      <div className="demo-tab-icon">
                        <FontAwesomeIcon icon={screen.icon} />
                      </div>
                      <div className="demo-tab-content">
                        <span className="demo-tab-label">{screen.label}</span>
                        <span className="demo-tab-desc">{screen.description}</span>
                      </div>
                      <FontAwesomeIcon
                        icon={faCheckCircle}
                        className={`demo-tab-check ${activeDemo === i ? 'visible' : ''}`}
                      />
                    </button>
                  ))}

                  <div className="demo-benefits">
                    {[
                      t('home.demo_benefit_1') || 'Соответствует ГОСО требованиям',
                      t('home.demo_benefit_2') || 'Готов к подаче в деканат',
                      t('home.demo_benefit_3') || 'Редактируется в Word',
                    ].map((benefit, i) => (
                      <div key={i} className="demo-benefit-item">
                        <FontAwesomeIcon icon={faCheckCircle} className="demo-benefit-check" />
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="demo-screen-panel">
                  <div className="demo-browser-frame">
                    <div className="demo-browser-bar">
                      <div className="demo-browser-dots">
                        <span className="dot dot-red" />
                        <span className="dot dot-yellow" />
                        <span className="dot dot-green" />
                      </div>
                      <div className="demo-browser-url">
                        <span>hiversity.ai/canvas</span>
                      </div>
                    </div>
                    <div className="demo-browser-content">
                      {demoScreens[activeDemo].image ? (
                        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                          <Image
                            src={demoScreens[activeDemo].image}
                            alt={demoScreens[activeDemo].label}
                            width={800}
                            height={500}
                            style={{ width: '100%', height: 'auto', objectFit: 'contain' }}
                            className="demo-screenshot"
                          />
                        </div>
                      ) : (
                        <div className="demo-placeholder">
                          <div className="demo-placeholder-inner">
                            <div className="demo-placeholder-icon">
                              <FontAwesomeIcon icon={demoScreens[activeDemo].icon} />
                            </div>
                            <div className="demo-placeholder-lines">
                              <div className="demo-line demo-line-long" />
                              <div className="demo-line demo-line-medium" />
                              <div className="demo-line demo-line-short" />
                            </div>
                            <div className="demo-generating-badge">
                              <div className="demo-generating-dot" />
                              <span>{t('home.demo_generating') || 'Генерируется...'}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="demo-quick-facts">
                    <div className="demo-fact">
                      <span className="demo-fact-num">~2 {t('home.min') || 'мин'}</span>
                      <span className="demo-fact-label">{t('home.demo_fact_time') || 'на документ'}</span>
                    </div>
                    <div className="demo-fact-divider" />
                    <div className="demo-fact">
                      <span className="demo-fact-num">100%</span>
                      <span className="demo-fact-label">{t('home.demo_fact_format') || 'формат .docx'}</span>
                    </div>
                    <div className="demo-fact-divider" />
                    <div className="demo-fact">
                      <span className="demo-fact-num">AI</span>
                      <span className="demo-fact-label">{t('home.demo_fact_ai') || 'на базе GPT-4'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <ScrollAnimation animation="scaleIn" delay={0.3}>
                <div className="demo-cta-wrap">
                  <button className="hero-cta" onClick={scrollToPrompt}>
                    <span>{t('home.start_free') || 'Попробовать бесплатно'}</span>
                    <FontAwesomeIcon icon={faBolt} />
                  </button>
                </div>
              </ScrollAnimation>

            </div>
          </section>
        </ScrollAnimation>

        {/* ===== ФОРМА ===== */}
        <ScrollAnimation animation="fadeInUp" delay={0.3}>
          <section id="form-section" className="form-section-wrapper">
            <div className="form-gradient-bg">
              <div className="gradient-sphere sphere-1" />
              <div className="gradient-sphere sphere-2" />
              <div className="gradient-sphere sphere-3" />
            </div>

            <div className="mode-selector">
              <div className="mode-title">
                <FontAwesomeIcon icon={faWandMagicSparkles} />
                {t('home.mode_selector')}
              </div>
              <div className="mode-tabs">
                <button
                  className={`mode-tab ${generationMode === 'quick' ? 'active' : ''}`}
                  onClick={() => setGenerationMode('quick')}
                >
                  <FontAwesomeIcon icon={faBolt} /> {t('home.quick_mode')}
                </button>
                <button
                  className={`mode-tab ${generationMode === 'detailed' ? 'active' : ''}`}
                  onClick={() => setGenerationMode('detailed')}
                >
                  <FontAwesomeIcon icon={faGear} /> {t('home.detailed_mode')}
                </button>
              </div>
              <p className="mode-description">
                {generationMode === 'quick' ? t('home.quick_desc') : t('home.detailed_desc')}
              </p>
            </div>

            {generationMode === 'quick' ? (
              <div className="quick-generation">
                <div className="type-selector">
                  <h3>{t('home.document_type')}</h3>
                  <div className="type-buttons">
                    <button
                      className={`type-button ${generationType === 'rup' ? 'active' : ''}`}
                      onClick={() => setGenerationType('rup')}
                    >
                      <FontAwesomeIcon icon={faBook} /> {t('home.rup')}
                    </button>
                    <button
                      className={`type-button ${generationType === 'calendar' ? 'active' : ''}`}
                      onClick={() => setGenerationType('calendar')}
                    >
                      <FontAwesomeIcon icon={faCalendar} /> {t('home.calendar')}
                    </button>
                  </div>
                </div>
                <PromptForm
                  onSubmit={(prompt) => handleGenerateFromPrompt(prompt, generationType)}
                  isLoading={false}
                  type={generationType === 'rup' ? 'rup' : 'calendar'}
                />
              </div>
            ) : (
              <div className="detailed-generation">
                <div className="type-buttons" style={{ marginBottom: '2rem' }}>
                  <button
                    className={`type-button ${generationType === 'rup' ? 'active' : ''}`}
                    onClick={() => setGenerationType('rup')}
                  >
                    <FontAwesomeIcon icon={faBook} /> {t('home.rup')}
                  </button>
                  <button
                    className={`type-button ${generationType === 'calendar' ? 'active' : ''}`}
                    onClick={() => setGenerationType('calendar')}
                  >
                    <FontAwesomeIcon icon={faCalendar} /> {t('home.calendar')}
                  </button>
                </div>
                {generationType === 'rup'
                  ? <RupForm onSubmit={handleGenerateRup} isLoading={false} />
                  : <CalendarForm onSubmit={handleGenerateCalendar} isLoading={false} />}
              </div>
            )}
          </section>
        </ScrollAnimation>

        {/* ===== ГАЙД ===== */}
        <ScrollAnimation animation="fadeInUp" delay={0.4}>
          <section id="guide-section" className="guide-section">
            <div className="guide-inner">
              <ScrollAnimation animation="fadeInUp" delay={0.1}>
                <div className="guide-header">
                  <div className="hero-badge" style={{ margin: '0 auto 1rem' }}>
                    <FontAwesomeIcon icon={faCircleInfo} />
                    <span>{t('guide.title')}</span>
                  </div>
                  <h2 className="guide-title">{t('guide.title')}</h2>
                  <p className="guide-subtitle">{t('guide.subtitle')}</p>
                </div>
              </ScrollAnimation>

              <div className="guide-steps">
                {[
                  { num: '01', title: 'step_1_title', desc: 'step_1_desc', tip: 'step_1_tip' },
                  { num: '02', title: 'step_2_title', desc: 'step_2_desc', tip: 'step_2_tip' },
                  { num: '03', title: 'step_3_title', desc: 'step_3_desc', tip: 'step_3_tip' },
                  { num: '04', title: 'step_4_title', desc: 'step_4_desc', tip: 'step_4_tip' },
                ].map((step, i) => (
                  <ScrollAnimation key={i} animation="fadeInLeft" delay={0.1 + i * 0.1}>
                    <div className="guide-step">
                      <div className="guide-step-num">{step.num}</div>
                      <div className="guide-step-content">
                        <h3>{t(`guide.${step.title}`)}</h3>
                        <p>{t(`guide.${step.desc}`)}</p>
                        <div className="guide-step-tip">
                          <FontAwesomeIcon icon={faBolt} />
                          <span>{t(`guide.${step.tip}`)}</span>
                        </div>
                      </div>
                    </div>
                  </ScrollAnimation>
                ))}
              </div>

              <ScrollAnimation animation="scaleIn" delay={0.4}>
                <div className="guide-faq">
                  <h3 className="guide-block-title">
                    <FontAwesomeIcon icon={faGraduationCap} />
                    {t('guide.faq')}
                  </h3>
                  <div className="guide-faq-grid">
                    {[
                      { q: 'faq_1_q', a: 'faq_1_a' },
                      { q: 'faq_2_q', a: 'faq_2_a' },
                      { q: 'faq_3_q', a: 'faq_3_a' },
                      { q: 'faq_4_q', a: 'faq_4_a' },
                      { q: 'faq_5_q', a: 'faq_5_a' },
                      { q: 'faq_6_q', a: 'faq_6_a' },
                    ].map((item, i) => (
                      <div key={i} className="guide-faq-item">
                        <h4>{t(`guide.${item.q}`)}</h4>
                        <p>{t(`guide.${item.a}`)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollAnimation>

              <ScrollAnimation animation="fadeInUp" delay={0.5}>
                <div className="guide-cta">
                  <p>{t('guide.cta_text')}</p>
                  <button
                    className="hero-cta"
                    onClick={() => document.getElementById('form-section')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    <span>{t('guide.cta_button')}</span>
                    <FontAwesomeIcon icon={faBolt} />
                  </button>
                </div>
              </ScrollAnimation>
            </div>
          </section>
        </ScrollAnimation>

      </main>

      <Footer variant="light" />

      <style jsx global>{`
        .demo-screenshot {
          transition: all 0.3s ease !important;
          cursor: pointer !important;
          border-radius: 12px !important;
        }
        .demo-screenshot:hover {
          transform: scale(1.05) !important;
          box-shadow:
            0 40px 60px -10px rgba(0,0,0,0.9),
            0 20px 30px -5px rgba(0,0,0,0.8),
            0 0 0 3px rgba(55,48,163,0.8),
            0 0 20px 5px rgba(0,0,0,0.5) !important;
        }
      `}</style>

    </div>
  );
}