import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBook, 
  faCalendar,
  faLightbulb,
  faChevronDown,
  faChevronUp,
  faClock,
  faFileWord,
  faPen,
  faStar,
  faBolt,
  faRocket,
  faMagic,
  faWandMagicSparkles,
  faArrowRight
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/hooks/useTranslation';

interface PromptFormProps {
  onSubmit: (prompt: string) => Promise<void>;
  isLoading: boolean;
  type: 'rup' | 'calendar';
}

const PromptForm: React.FC<PromptFormProps> = ({ onSubmit, isLoading, type }) => {
  const { t } = useTranslation();
  const [prompt, setPrompt] = useState('');
  const [showExamples, setShowExamples] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [hoveredExample, setHoveredExample] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      toast.error(t('errors.fill_required'));
      return;
    }
    if (prompt.trim().length < 3) {
      toast.error(t('prompt_form.too_short'));
      return;
    }
    try {
      await onSubmit(prompt.trim());
    } catch (error) {
      console.error(error);
    }
  };

  // Примеры запросов на русском (для всех языков)
  const examples = {
    rup: [
      {
        title: '⚡ Только название (рус.)',
        prompt: 'История Казахстана',
        icon: faStar,
        color: '#6366f1',
        description: 'Достаточно одного слова. ИИ сам придумает все темы лекций, лабораторных, практических, цели, задачи и характеристику дисциплины.'
      },
      {
        title: '⚡ Тек атау (каз.)',
        prompt: 'Қазақстан тарихы',
        icon: faStar,
        color: '#0ea5e9',
        description: 'Тек атауы жеткілікті. ИИ барлық тақырыптарды, мақсаттар мен міндеттерді қазақша толтырады. Оқытушы, ОБ, модуль — бос қалады.'
      },
      {
        title: '📋 Свободное описание (рус.)',
        prompt: 'Хочу РУП по экономике. Нужны только лекции и практические, без лабораторных. Курсового проекта не будет.',
        icon: faBook,
        color: '#8b5cf6',
        description: 'Можно писать свободным текстом — ИИ поймёт что нужно. Укажите что есть и чего нет.'
      },
      {
        title: '📋 Еркін сипаттама (каз.)',
        prompt: 'Бағдарламалық жасақтама инженериясы пәні керек. Дәріс 7, зертхана 7, практика жоқ, КЖ бар. Оқытушы А.С. Сарсенбаева.',
        icon: faBook,
        color: '#06b6d4',
        description: 'Еркін мәтінмен жазуға болады. ИИ не керек екенін түсінеді. Дәріс, зертхана санын белгілеңіз — қалғанын ИИ толтырады.'
      },
      {
        title: '🎯 С деталями (рус.)',
        prompt: 'Разработка мобильных приложений, 3 курс, 5 семестр, преподаватель Иванов А.А., лекции 8, лабораторных 8, без практических, КП 10 вариантов, пререквизиты: Основы программирования, Алгоритмы',
        icon: faMagic,
        color: '#ec4899',
        description: 'Чем больше деталей — тем точнее документ. Можно указать кол-во тем, преподавателя, пре/постреквизиты. Что не указано — ИИ заполнит по умолчанию.'
      },
      {
        title: '🎯 Толық мәліметтер (каз.)',
        prompt: 'Қазақстан тарихы, 2 курс, 4 семестр, оқытушы Нұрланов А.Б., дәріс 8, зертхана жоқ, практика 8, КЖ жоқ, пререквизиттер: Философия, Саясаттану',
        icon: faRocket,
        color: '#f59e0b',
        description: 'Неғұрлым көп мәлімет берсеңіз — соғұрлым дәл нәтиже шығады. Силлабус толықтай қазақша жасалады.'
      }
    ],
    calendar: [
      {
        title: '⚡ Только название — ИИ сделает всё',
        prompt: 'Базы данных, сгенерируй с темами',
        icon: faStar,
        color: '#6366f1',
        description: '✅ ИИ сам придумает темы лекций, лабораторных и практических занятий, расставит даты по семестру. Вам остаётся только скачать файл.'
      },
      {
        title: '📋 Название + детали — точный результат',
        prompt: 'Математика, группа ИС-24-1, 150 часов, 15 недель, экзамен, преподаватель Алиева Г.С., сгенерируй с темами',
        icon: faCalendar,
        color: '#8b5cf6',
        description: '✅ Группа, преподаватель, форма контроля — вставятся точно как написано. Темы занятий и даты — сгенерирует ИИ автоматически.'
      },
      {
        title: '🗓️ С чётностью недель',
        prompt: 'История Казахстана, группа ХТ-23-1, 150 часов, 15 недель, экзамен, лекции по числителям (нечётные недели), лабораторные по знаменателям (чётные недели), сгенерируй с темами',
        icon: faMagic,
        color: '#ec4899',
        description: '✅ ИИ учтёт расписание: лекции — нечётные недели, лабораторные — чётные. Темы придумает сам, даты расставит правильно.'
      },
      {
        title: '⚡ Тек атауы — ИИ барлығын жасайды (қаз.)',
        prompt: 'Деректер қоры, тақырыптарды генерацияла, қазақша',
        icon: faStar,
        color: '#0ea5e9',
        description: '✅ ИИ дәрістер, зертханалық жұмыстар тақырыптарын өзі жасайды, күндерді толтырады. КТЖ толығымен қазақша шығады.'
      },
      {
        title: '📋 Негізгі деректер (қаз.)',
        prompt: 'Физика, қазақша, ФИЗ-23-2 тобы, 120 сағат, 15 апта, емтихан, оқытушы Бекова С.Н., тақырыптарды генерацияла',
        icon: faCalendar,
        color: '#06b6d4',
        description: '✅ Топ, оқытушы, бақылау түрі дәл енгізіледі. Сабақ тақырыптары мен күндерін ИИ өзі генерациялайды.'
      }
    ]
  };

  const applyExample = (examplePrompt: string) => {
    setPrompt(examplePrompt);
    toast.success(t('prompt_form.example_applied'));
  };

  // Советы на разных языках из JSON
  const tips = type === 'rup'
    ? [
        t('prompt_form.tip_1') || 'Название дисциплины',
        t('prompt_form.tip_2') || 'Код дисциплины (напр. VBD 3213)',
        t('prompt_form.tip_3') || 'Курс, семестр, часы, кредиты',
        t('prompt_form.tip_4') || 'ФИО преподавателя',
        t('prompt_form.tip_5') || 'Образовательная программа (ОП)',
        t('prompt_form.tip_6') || 'Пререквизиты и постреквизиты',
        t('prompt_form.tip_7') || 'Наличие КП или "без КП"',
      ]
    : [
        t('prompt_form.cal_tip_1') || 'Название дисциплины — обязательно',
        t('prompt_form.cal_tip_2') || 'Группа и преподаватель (опционально)',
        t('prompt_form.cal_tip_4') || 'ИИ сам придумает темы занятий',
        t('prompt_form.cal_tip_5') || 'Чётность: «по числителям / знаменателям»',
      ];

  return (
    <div className="prompt-form-modern">
      <form onSubmit={handleSubmit}>
        {/* Поле ввода с улучшенными эффектами */}
        <div className={`prompt-input-wrapper ${isFocused ? 'focused' : ''} ${prompt ? 'has-content' : ''}`}>
          {/* Фоновый градиент, который двигается при фокусе */}
          <div className="prompt-input-glow"></div>
          
          <div className="prompt-header">
            <div className="prompt-header-left">
              <div className="prompt-icon-wrapper">
                <FontAwesomeIcon icon={faWandMagicSparkles} className="prompt-icon" />
              </div>
              <span className="prompt-title">{t('prompt_form.describe_document')}</span>
            </div>
            <div className={`prompt-char-count ${prompt.length > 0 ? 'has-text' : ''}`}>
              <span className="prompt-char-number">{prompt.length}</span>
              <span className="prompt-char-max">/5000</span>
            </div>
          </div>
          
          <div className="prompt-textarea-container">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={
                type === 'rup' 
                  ? t('prompt_form.placeholder_rup')
                  : t('prompt_form.placeholder_calendar')
              }
              rows={3}
              maxLength={5000}
              className="prompt-textarea-modern"
            />
            
            {/* Анимированная линия под текстовым полем */}
            <div className="prompt-textarea-underline"></div>
          </div>
          
          <div className="prompt-footer">
            <button
              type="button"
              className={`prompt-examples-toggle ${showExamples ? 'active' : ''}`}
              onClick={() => setShowExamples(!showExamples)}
            >
              <FontAwesomeIcon icon={showExamples ? faChevronUp : faChevronDown} />
              <span>{showExamples ? t('prompt_form.hide_examples') : t('prompt_form.show_examples')}</span>
              <span className="prompt-examples-count">{examples[type].length}</span>
            </button>
            
            <button
              type="submit"
              className={`prompt-submit-btn ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="prompt-spinner"></span>
                  <span>{t('prompt_form.generating')}</span>
                </>
              ) : (
                <>
                  <span>{t('prompt_form.generate')}</span>
                  <FontAwesomeIcon icon={faArrowRight} className="prompt-submit-icon" />
                  <div className="prompt-submit-glow"></div>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Советы с улучшенным дизайном */}
        <div className="prompt-tips-modern">
          <div className="prompt-tips-header">
            <div className="prompt-tips-icon">
              <FontAwesomeIcon icon={faLightbulb} />
            </div>
            <span>{t('prompt_form.quick_tips')}</span>
          </div>
          <div className="prompt-tips-grid">
            {tips.map((tip, index) => (
              <div key={index} className="prompt-tip-item" style={{ '--delay': `${index * 0.1}s` } as React.CSSProperties}>
                <span className="prompt-tip-dot" />
                <span>{tip}</span>
                <div className="prompt-tip-glow"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Примеры с улучшенными карточками */}
        <div className={`prompt-examples-modern ${showExamples ? 'visible' : ''}`}>
          <div className="prompt-examples-header">
            <div className="prompt-examples-header-left">
              <FontAwesomeIcon icon={faMagic} />
              <span>{t('prompt_form.ready_examples')}</span>
            </div>
            <div className="prompt-examples-header-badge">
              <FontAwesomeIcon icon={faBolt} />
              <span>{t('prompt_form.click_to_autofill')}</span>
            </div>
          </div>
          
          <div className="prompt-examples-grid">
            {examples[type].map((example, index) => (
              <div
                key={index}
                className={`prompt-example-card ${hoveredExample === index ? 'hovered' : ''}`}
                onMouseEnter={() => setHoveredExample(index)}
                onMouseLeave={() => setHoveredExample(null)}
                style={{ '--card-color': example.color } as React.CSSProperties}
              >
                <div className="prompt-example-card-glow"></div>
                <div className="prompt-example-card-content">
                  <div className="prompt-example-header">
                    <div className="prompt-example-icon-wrapper" style={{ background: `${example.color}20` }}>
                      <FontAwesomeIcon icon={example.icon} style={{ color: example.color }} />
                    </div>
                    <div className="prompt-example-title">{example.title}</div>
                  </div>
                  
                  <div className="prompt-example-preview">
                    {example.prompt.length > 100
                      ? example.prompt.substring(0, 100) + '...'
                      : example.prompt}
                  </div>

                  <div className="prompt-example-description" style={{
                    fontSize: '11px',
                    color: 'rgba(148, 163, 184, 0.85)',
                    lineHeight: '1.5',
                    marginTop: '6px',
                    marginBottom: '10px',
                    fontStyle: 'italic',
                    borderLeft: `2px solid ${example.color}40`,
                    paddingLeft: '8px',
                  }}>
                    {example.description}
                  </div>
                  
                  <button
                    type="button"
                    className="prompt-example-use"
                    onClick={() => applyExample(example.prompt)}
                    style={{ '--hover-color': example.color } as React.CSSProperties}
                  >
                    <FontAwesomeIcon icon={faPen} />
                    <span>{t('prompt_form.use')}</span>
                    <FontAwesomeIcon icon={faArrowRight} className="prompt-example-use-arrow" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Хинты с анимацией */}
        <div className="prompt-hints-modern">
          <div className="prompt-hint-item">
            <div className="prompt-hint-icon">
              <FontAwesomeIcon icon={faClock} />
            </div>
            <span>30–90 {t('prompt_form.seconds')}</span>
          </div>
          <div className="prompt-hint-divider" />
          <div className="prompt-hint-item">
            <div className="prompt-hint-icon">
              <FontAwesomeIcon icon={faFileWord} />
            </div>
            <span>.doc {t('prompt_form.file')}</span>
          </div>
          <div className="prompt-hint-divider" />
          <div className="prompt-hint-item">
            <div className="prompt-hint-icon">
              <FontAwesomeIcon icon={faStar} />
            </div>
            <span>{t('prompt_form.ai_generation')}</span>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PromptForm;