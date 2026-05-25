import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBook, 
  faClock, 
  faBullseye, 
  faDownload, 
  faGear, 
  faUserGraduate,
  faHashtag,
  faChalkboardUser,
  faGraduationCap,
  faBolt,
  faWandMagicSparkles,
  faCheck
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/hooks/useTranslation';
import { RupFormData } from '@/app/[lang]/types/types';

interface RupFormProps {
  onSubmit: (data: RupFormData) => Promise<void>;
  isLoading: boolean;
  initialData?: Partial<RupFormData>;
}

const RupForm: React.FC<RupFormProps> = ({ onSubmit, isLoading, initialData }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<RupFormData>({
    subject: '',
    grade: '',
    goals: '',
    learningOutcomes: '',
    hours: '150',
    language: 'russian',
    template: 'standard',
    semester: '2',
    code: '',
    cycle: '',
    program: '',
    credits: '',
    prerequisites: '',
    postrequisites: '',
    teacher: '',
    lectureTopics: [],
    labTopics: [],
    practicalTopics: [],
    sropTopics: [],
    ...initialData,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: RupFormData) => ({ ...prev, [name]: value }));
  };

  const handleHoursPreset = (hours: number) => {
    setFormData((prev: RupFormData) => ({ ...prev, hours: hours.toString() }));
  };

  // Парсим textarea в массив тем (каждая строка = одна тема)
  const handleTopicsChange = (field: 'lectureTopics' | 'labTopics' | 'practicalTopics' | 'sropTopics', value: string) => {
    const topics = value.split('\n').map(s => s.trim()).filter(Boolean);
    setFormData(prev => ({ ...prev, [field]: topics }));
  };

  const getTopicsText = (field: 'lectureTopics' | 'labTopics' | 'practicalTopics' | 'sropTopics'): string => {
    return (formData[field] || []).join('\n');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject.trim()) return toast.error(t('errors.fill_required'));
    
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="rup-form-modern">
      <form onSubmit={handleSubmit}>
        <div className="form-grid-modern">
          {/* ОСНОВНАЯ ИНФОРМАЦИЯ */}
          <div className="form-card-modern">
            <div className="form-card-header">
              <div className="form-card-icon">
                <FontAwesomeIcon icon={faBook} />
              </div>
              <div className="form-card-title">
                <h3>{t('rup_form.discipline')}</h3>
                <span className="form-card-subtitle">{t('rup_form.basic_info')}</span>
              </div>
            </div>
            
            <div className="form-card-content">
              <div className="form-group-modern">
                <label>{t('rup_form.discipline_name')} <span className="required-star">*</span></label>
                <div className="input-wrapper-modern">
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder={t('rup_form.discipline_placeholder')}
                    className="form-input-modern"
                    required
                  />
                  <div className="input-glow"></div>
                </div>
              </div>

              <div className="form-row-modern">
                <div className="form-group-modern">
                  <label>{t('rup_form.discipline_code')}</label>
                  <div className="input-wrapper-modern with-icon">
                    <FontAwesomeIcon icon={faHashtag} className="input-icon" />
                    <input
                      type="text"
                      name="code"
                      value={formData.code}
                      onChange={handleChange}
                      placeholder={t('rup_form.code_placeholder')}
                      className="form-input-modern with-icon"
                    />
                    <div className="input-glow"></div>
                  </div>
                </div>
                
                <div className="form-group-modern">
                  <label>{t('rup_form.credits')}</label>
                  <div className="input-wrapper-modern">
                    <input
                      type="number"
                      name="credits"
                      value={formData.credits}
                      onChange={handleChange}
                      placeholder="5"
                      min="1"
                      max="15"
                      className="form-input-modern"
                    />
                    <div className="input-glow"></div>
                  </div>
                </div>
              </div>

              <div className="form-group-modern">
                <label>{t('rup_form.cycle')}</label>
                <div className="select-wrapper-modern">
                  <select name="cycle" value={formData.cycle} onChange={handleChange} className="form-select-modern">
                    <option value="">{t('rup_form.select_cycle')}</option>
                    <option value="Общеобразовательные дисциплины">{t('rup_form.general')}</option>
                    <option value="Базовые дисциплины">{t('rup_form.basic')}</option>
                    <option value="Профилирующие дисциплины">{t('rup_form.major')}</option>
                  </select>
                  <div className="select-glow"></div>
                </div>
              </div>

              <div className="form-group-modern">
                <label>{t('rup_form.course_semester')}</label>
                <div className="input-wrapper-modern">
                  <input
                    type="text"
                    name="grade"
                    value={formData.grade}
                    onChange={handleChange}
                    placeholder={t('rup_form.course_placeholder')}
                    className="form-input-modern"
                  />
                  <div className="input-glow"></div>
                </div>
              </div>

              <div className="form-row-modern">
                <div className="form-group-modern">
                  <label>{t('rup_form.total_hours')}</label>
                  <div className="input-wrapper-modern with-icon">
                    <FontAwesomeIcon icon={faClock} className="input-icon" />
                    <input
                      type="number"
                      name="hours"
                      value={formData.hours}
                      onChange={handleChange}
                      min="30"
                      max="300"
                      className="form-input-modern with-icon"
                    />
                    <div className="input-glow"></div>
                  </div>
                </div>
                
                <div className="form-group-modern">
                  <label>{t('rup_form.semester')}</label>
                  <div className="select-wrapper-modern">
                    <select name="semester" value={formData.semester} onChange={handleChange} className="form-select-modern">
                      <option value="1">{t('rup_form.semester_1')}</option>
                      <option value="2">{t('rup_form.semester_2')}</option>
                      <option value="3">{t('rup_form.semester_3')}</option>
                      <option value="4">{t('rup_form.semester_4')}</option>
                      <option value="5">{t('rup_form.semester_5')}</option>
                      <option value="6">{t('rup_form.semester_6')}</option>
                    </select>
                    <div className="select-glow"></div>
                  </div>
                </div>
              </div>

              <div className="presets-modern">
                <label className="presets-label">{t('rup_form.quick_hours')}</label>
                <div className="presets-buttons-modern">
                  {[90, 120, 150, 180, 210].map(hours => (
                    <button
                      key={hours}
                      type="button"
                      className={`preset-btn-modern ${formData.hours === hours.toString() ? 'active' : ''}`}
                      onClick={() => handleHoursPreset(hours)}
                    >
                      <span className="preset-value">{hours}</span>
                      <span className="preset-unit">{t('rup_form.hours_short')}</span>
                      {formData.hours === hours.toString() && (
                        <span className="preset-check">
                          <FontAwesomeIcon icon={faCheck} />
                        </span>
                      )}
                      <div className="preset-glow"></div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ПРЕПОДАВАТЕЛЬ И КАФЕДРА */}
          <div className="form-card-modern">
            <div className="form-card-header">
              <div className="form-card-icon">
                <FontAwesomeIcon icon={faUserGraduate} />
              </div>
              <div className="form-card-title">
                <h3>{t('rup_form.teacher_department')}</h3>
                <span className="form-card-subtitle">{t('rup_form.who_teaches')}</span>
              </div>
            </div>
            
            <div className="form-card-content">
              <div className="form-group-modern">
                <label>{t('rup_form.teacher_name')}</label>
                <div className="input-wrapper-modern with-icon">
                  <FontAwesomeIcon icon={faChalkboardUser} className="input-icon" />
                  <input
                    type="text"
                    name="teacher"
                    value={formData.teacher}
                    onChange={handleChange}
                    placeholder={t('rup_form.teacher_placeholder')}
                    className="form-input-modern with-icon"
                  />
                  <div className="input-glow"></div>
                </div>
              </div>

              <div className="form-group-modern">
                <label>{t('rup_form.educational_program')}</label>
                <div className="input-wrapper-modern">
                  <input
                    type="text"
                    name="program"
                    value={formData.program}
                    onChange={handleChange}
                    placeholder={t('rup_form.program_placeholder')}
                    className="form-input-modern"
                  />
                  <div className="input-glow"></div>
                </div>
              </div>

              <div className="form-group-modern">
                <label>{t('rup_form.prerequisites')}</label>
                <div className="textarea-wrapper-modern">
                  <textarea
                    name="prerequisites"
                    value={formData.prerequisites}
                    onChange={handleChange}
                    rows={2}
                    placeholder={t('rup_form.prereq_placeholder')}
                    className="form-textarea-modern"
                  />
                  <div className="textarea-glow"></div>
                </div>
                <small className="form-hint-modern">{t('rup_form.prereq_hint')}</small>
              </div>

              <div className="form-group-modern">
                <label>{t('rup_form.postrequisites')}</label>
                <div className="textarea-wrapper-modern">
                  <textarea
                    name="postrequisites"
                    value={formData.postrequisites}
                    onChange={handleChange}
                    rows={2}
                    placeholder={t('rup_form.postreq_placeholder')}
                    className="form-textarea-modern"
                  />
                  <div className="textarea-glow"></div>
                </div>
                <small className="form-hint-modern">{t('rup_form.postreq_hint')}</small>
              </div>
            </div>
          </div>

          {/* ЦЕЛИ И РЕЗУЛЬТАТЫ */}
          <div className="form-card-modern">
            <div className="form-card-header">
              <div className="form-card-icon">
                <FontAwesomeIcon icon={faBullseye} />
              </div>
              <div className="form-card-title">
                <h3>{t('rup_form.goals_results')}</h3>
                <span className="form-card-subtitle">{t('rup_form.what_students_learn')}</span>
              </div>
            </div>
            
            <div className="form-card-content">
              <div className="form-group-modern">
                <label>{t('rup_form.course_goal')}</label>
                <div className="textarea-wrapper-modern">
                  <textarea
                    name="goals"
                    value={formData.goals}
                    onChange={handleChange}
                    rows={4}
                    placeholder={t('rup_form.goal_placeholder')}
                    className="form-textarea-modern"
                  />
                  <div className="textarea-glow"></div>
                </div>
                <small className="form-hint-modern">{t('rup_form.goal_hint')}</small>
              </div>

              <div className="form-group-modern">
                <label>{t('rup_form.learning_outcomes')}</label>
                <div className="textarea-wrapper-modern">
                  <textarea
                    name="learningOutcomes"
                    value={formData.learningOutcomes}
                    onChange={handleChange}
                    rows={5}
                    placeholder={t('rup_form.outcomes_placeholder')}
                    className="form-textarea-modern"
                  />
                  <div className="textarea-glow"></div>
                </div>
                <small className="form-hint-modern">{t('rup_form.outcomes_hint')}</small>
              </div>
            </div>
          </div>

          {/* НАСТРОЙКИ */}
          <div className="form-card-modern">
            <div className="form-card-header">
              <div className="form-card-icon">
                <FontAwesomeIcon icon={faGear} />
              </div>
              <div className="form-card-title">
                <h3>{t('rup_form.additional')}</h3>
                <span className="form-card-subtitle">{t('rup_form.settings_subtitle')}</span>
              </div>
            </div>
            
            <div className="form-card-content">
              <div className="form-row-modern">
                <div className="form-group-modern">
                  <label>{t('rup_form.document_language')}</label>
                  <div className="select-wrapper-modern">
                    <select name="language" value={formData.language} onChange={handleChange} className="form-select-modern">
                      <option value="russian">{t('rup_form.russian')}</option>
                      <option value="kazakh">{t('rup_form.kazakh')}</option>
                      <option value="english">{t('rup_form.english')}</option>
                    </select>
                    <div className="select-glow"></div>
                  </div>
                </div>
                
                <div className="form-group-modern">
                  <label>{t('rup_form.template')}</label>
                  <div className="select-wrapper-modern">
                    <select name="template" value={formData.template} onChange={handleChange} className="form-select-modern">
                      <option value="standard">{t('rup_form.standard')}</option>
                      <option value="university">{t('rup_form.university')}</option>
                      <option value="simple">{t('rup_form.simple')}</option>
                    </select>
                    <div className="select-glow"></div>
                  </div>
                </div>
              </div>

              <div className="info-card-modern">
                <div className="info-card-header">
                  <FontAwesomeIcon icon={faGraduationCap} />
                  <h4>{t('rup_form.generation_info')}</h4>
                </div>
                <div className="info-card-content">
                  <div className="info-row">
                    <span className="info-label">{t('rup_form.mode')}:</span>
                    <span className="info-value">{t('rup_form.detailed_form')}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">{t('rup_form.ai_generation')}:</span>
                    <span className="info-value">{t('rup_form.ai_based')}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">{t('rup_form.format')}:</span>
                    <span className="info-value">Word .doc</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">{t('rup_form.time')}:</span>
                    <span className="info-value">30-90 {t('rup_form.seconds')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ТЕМЫ ЗАНЯТИЙ */}
          <div className="form-card-modern">
            <div className="form-card-header">
              <div className="form-card-icon">
                <FontAwesomeIcon icon={faChalkboardUser} />
              </div>
              <div className="form-card-title">
                <h3>{t('rup_form.topics_title') || 'Темы занятий'}</h3>
                <span className="form-card-subtitle">
                  {t('rup_form.topics_subtitle') || 'Необязательно — что не заполните, сгенерирует ИИ'}
                </span>
              </div>
            </div>
            <div className="form-card-content">
              <div className="form-group-modern">
                <label>{t('rup_form.lecture_topics') || 'Темы лекций'}</label>
                <small className="form-hint-modern">
                  {t('rup_form.topics_hint') || 'По одной теме на строку. Пустые строки игнорируются.'}
                </small>
                <div className="textarea-wrapper-modern">
                  <textarea
                    value={getTopicsText('lectureTopics')}
                    onChange={e => handleTopicsChange('lectureTopics', e.target.value)}
                    rows={5}
                    placeholder={'1. Введение в дисциплину\n2. Основные понятия\n...'}
                    className="form-textarea-modern"
                  />
                  <div className="textarea-glow"></div>
                </div>
              </div>
              <div className="form-group-modern">
                <label>{t('rup_form.lab_topics') || 'Темы лабораторных работ'}</label>
                <div className="textarea-wrapper-modern">
                  <textarea
                    value={getTopicsText('labTopics')}
                    onChange={e => handleTopicsChange('labTopics', e.target.value)}
                    rows={5}
                    placeholder={'Лабораторная работа №1. Тема\nЛабораторная работа №2. Тема\n...'}
                    className="form-textarea-modern"
                  />
                  <div className="textarea-glow"></div>
                </div>
              </div>
              <div className="form-group-modern">
                <label>{t('rup_form.practical_topics') || 'Темы практических занятий'}</label>
                <div className="textarea-wrapper-modern">
                  <textarea
                    value={getTopicsText('practicalTopics')}
                    onChange={e => handleTopicsChange('practicalTopics', e.target.value)}
                    rows={4}
                    placeholder={'Практика №1. Тема\nПрактика №2. Тема\n...'}
                    className="form-textarea-modern"
                  />
                  <div className="textarea-glow"></div>
                </div>
              </div>
              <div className="form-group-modern">
                <label>{t('rup_form.srop_topics') || 'Темы СРОП'}</label>
                <div className="textarea-wrapper-modern">
                  <textarea
                    value={getTopicsText('sropTopics')}
                    onChange={e => handleTopicsChange('sropTopics', e.target.value)}
                    rows={4}
                    placeholder={'1. Тема СРОП\n2. Тема СРОП\n...'}
                    className="form-textarea-modern"
                  />
                  <div className="textarea-glow"></div>
                </div>
              </div>
            </div>
          </div>

        </div>

        <div className="form-actions-modern">
          <button
            type="submit"
            className={`submit-btn-modern ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="submit-spinner"></span>
                <span className="submit-text">{t('rup_form.ai_generating')}</span>
              </>
            ) : (
              <>
                <span className="submit-text">{t('rup_form.generate_syllabus')}</span>
                <div className="submit-icon-wrapper">
                  <FontAwesomeIcon icon={faDownload} className="submit-icon" />
                  <FontAwesomeIcon icon={faBolt} className="submit-icon-secondary" />
                </div>
                <div className="submit-glow"></div>
                <div className="submit-particles">
                  <span></span><span></span><span></span>
                </div>
              </>
            )}
          </button>
          
          <div className="submit-hints">
            <div className="submit-hint">
              <FontAwesomeIcon icon={faClock} />
              <span>{t('rup_form.time_estimate')}</span>
            </div>
            <div className="submit-hint">
              <FontAwesomeIcon icon={faWandMagicSparkles} />
              <span>{t('rup_form.ai_generation_short')}</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default RupForm;