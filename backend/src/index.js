require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const os = require('os');
const path = require('path');
const fs = require('fs');
const mammoth = require('mammoth');

const { generateRUP } = require('./rupGenerator');
const { createWordDocument } = require('./wordGenerator');
const { generateCalendar } = require('./calendargenerator');
const { createCalendarDocument } = require('./calendarwordgenerator');
const { generateBoundaryControl } = require('./boundaryControlGenerator');
const { generateFinalControl } = require('./finalControlGenerator');
const { generateLectures } = require('./lecturesGenerator');
const { generateLabs } = require('./labsGenerator');
const { generatePracticals } = require('./practicalsGenerator');
const { generateSRO } = require('./sroGenerator');
const { generateSROP } = require('./sropGenerator');
const { generateKP } = require('./kpGenerator');
const { generateSROFull } = require('./srofullGenerator');
const { createSROFullDocument } = require('./srofullwordgenerator');
const docEditorRoutes = require('./docEditorRoutes');
const { requireGenerationLimit } = require('./generationLimit');
const { buildExcelFromSchema } = require('./excelGenerator');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? [process.env.FRONTEND_URL || 'https://hiversity.kstu.kz']
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id'],
  exposedHeaders: ['X-Generated-Topics'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, message: { error: 'Слишком много запросов.' } });
app.use('/api/', limiter);

const upload = multer({
  storage: multer.diskStorage({
    destination: os.tmpdir(),
    filename: (req, file, cb) => { const ext = path.extname(file.originalname) || '.docx'; cb(null, `syllabus_${Date.now()}${ext}`); }
  }),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.docx', '.doc', '.txt', '.pdf'].includes(ext)) cb(null, true);
    else cb(new Error('Неподдерживаемый формат файла'));
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString(), service: 'RUP Generator API' });
});

app.use('/api/doc-editor', docEditorRoutes);

function createSafeFilename(subject, prefix = 'RUP') {
  const translitMap = { 'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'h','ц':'ts','ч':'ch','ш':'sh','щ':'sch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya','А':'A','Б':'B','В':'V','Г':'G','Д':'D','Е':'E','Ё':'Yo','Ж':'Zh','З':'Z','И':'I','Й':'Y','К':'K','Л':'L','М':'M','Н':'N','О':'O','П':'P','Р':'R','С':'S','Т':'T','У':'U','Ф':'F','Х':'H','Ц':'Ts','Ч':'Ch','Ш':'Sh','Щ':'Sch','Ъ':'','Ы':'Y','Ь':'','Э':'E','Ю':'Yu','Я':'Ya' };
  let t = String(subject || '').split('').map(ch => translitMap[ch] || ch).join('');
  t = t.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
  const d = new Date();
  const ds = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  let safePrefix = String(prefix || 'Doc').split('').map(ch => translitMap[ch] || ch).join('').replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_') || 'Doc';
  return `${safePrefix}_${t || 'Document'}_${ds}`;
}

app.post('/api/generate', requireGenerationLimit('rup'), async (req, res) => {
  try {
    const data = req.body;
    if (!data.subject || !data.subject.trim()) return res.status(400).json({ error: 'Название дисциплины обязательно' });
    const rupData = await generateRUP(data);
    const documentBuffer = await createWordDocument(rupData);
    const safeFilename = createSafeFilename(rupData.subject, 'Syllabus');
    res.setHeader('Content-Type', 'application/msword');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}.doc"`);
    res.setHeader('Content-Length', documentBuffer.length);
    res.send(documentBuffer);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка генерации РУП', message: error.message });
  }
});

app.post('/api/generate-from-prompt', requireGenerationLimit('rup'), async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || prompt.trim().length < 3) return res.status(400).json({ error: 'Промпт слишком короткий' });
    const data = { originalPrompt: prompt, language: 'russian' };
    const rupData = await generateRUP(data);
    const documentBuffer = await createWordDocument(rupData);
    const safeFilename = createSafeFilename(rupData.subject, 'Syllabus');
    res.setHeader('Content-Type', 'application/msword');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}.doc"`);
    res.send(documentBuffer);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка генерации', message: error.message });
  }
});

app.post('/api/generate-calendar', requireGenerationLimit('calendar'), async (req, res) => {
  try {
    const data = req.body;
    if (!data.subject || !data.subject.trim()) return res.status(400).json({ error: 'Название дисциплины обязательно' });
    const calendarData = await generateCalendar({ ...data, isDetailedMode: true });
    const documentBuffer = await createCalendarDocument(calendarData);
    const safeFilename = createSafeFilename(data.subject, 'Calendar');
    res.setHeader('Content-Type', 'application/msword');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}.doc"`);
    res.send(documentBuffer);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка генерации', message: error.message });
  }
});

app.post('/api/generate-calendar-from-prompt', requireGenerationLimit('calendar'), async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || prompt.trim().length < 3) return res.status(400).json({ error: 'Промпт слишком короткий' });
    const data = { _rawPrompt: prompt.trim() };
    const calendarData = await generateCalendar(data);
    const documentBuffer = await createCalendarDocument(calendarData);
    const safeFilename = createSafeFilename(calendarData.subject, 'Calendar');
    res.setHeader('Content-Type', 'application/msword');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}.doc"`);
    res.send(documentBuffer);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка генерации', message: error.message });
  }
});

app.post('/api/parse-syllabus', upload.single('file'), async (req, res) => {
  const tmpFile = req.file?.path;
  try {
    if (!req.file) return res.status(400).json({ error: 'Файл не передан' });
    const rawBuffer = fs.readFileSync(tmpFile);
    let fullText = '';
    const isPKZip = rawBuffer[0] === 0x50 && rawBuffer[1] === 0x4B;
    if (isPKZip) {
      let docxParsed = null;
      try { const { parseDocxSyllabus } = require('./docxParser'); docxParsed = parseDocxSyllabus(rawBuffer); if (docxParsed.rawText) fullText = docxParsed.rawText; } catch (e) {}
      if (!fullText || fullText.length < 100) {
        try { const r = await mammoth.extractRawText({ buffer: rawBuffer }); fullText = r.value; } catch (e) {}
      }
      const parsed = { discipline: req.file.originalname.replace(/\.[^.]+$/, ''), rawText: fullText.slice(0, 20000), thematicPlanRows: docxParsed?.thematicPlanRows || [], lectureTopics: docxParsed?.lectureTopics || [], labTopics: docxParsed?.labTopics || [], practicalTopics: docxParsed?.practicalTopics || [], sropTable: docxParsed?.sropTable || [], sroTasks: docxParsed?.sroTasks || [], kpTopics: [], hasLectures: false, hasLabs: false, hasPracticals: false, hasSRO: false, hasSROP: false, hasKP: false };
      return res.json(parsed);
    }
    res.json({ discipline: req.file.originalname.replace(/\.[^.]+$/, ''), rawText: '', thematicPlanRows: [], lectureTopics: [], labTopics: [], practicalTopics: [], sropTable: [], sroTasks: [], kpTopics: [], hasLectures: false, hasLabs: false, hasPracticals: false, hasSRO: false, hasSROP: false, hasKP: false });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка парсинга', message: error.message });
  } finally {
    if (tmpFile) fs.unlink(tmpFile, () => {});
  }
});

app.post('/api/analyze-syllabus', upload.single('file'), async (req, res) => {
  const tmpFile = req.file?.path;
  try {
    if (!req.file) return res.status(400).json({ error: 'Файл не передан' });
    const rawBuffer = fs.readFileSync(tmpFile);
    let fullText = '';
    let docxParsed = null;
    const isPKZip = rawBuffer[0] === 0x50 && rawBuffer[1] === 0x4B;
    if (isPKZip) {
      try { const { parseDocxSyllabus } = require('./docxParser'); docxParsed = parseDocxSyllabus(rawBuffer); if (docxParsed.rawText) fullText = docxParsed.rawText; } catch (e) {}
      if (!fullText || fullText.length < 100) {
        try { const r = await mammoth.extractRawText({ buffer: rawBuffer }); fullText = r.value || ''; } catch (e) {}
      }
    }
    return res.json({
      discipline: req.file.originalname.replace(/\.[^.]+$/, ''),
      rawText: fullText.slice(0, 20000),
      thematicPlanRows: docxParsed?.thematicPlanRows || [],
      lectureTopics: docxParsed?.lectureTopics || [],
      labTopics: docxParsed?.labTopics || [],
      practicalTopics: docxParsed?.practicalTopics || [],
      sropTable: docxParsed?.sropTable || [],
      sropTopics: docxParsed?.sropTopics || [],
      sroTasks: docxParsed?.sroTasks || [],
      kpTopics: [],
      hasLectures: (docxParsed?.lectureTopics?.length || 0) > 0,
      hasLabs: (docxParsed?.labTopics?.length || 0) > 0,
      hasPracticals: (docxParsed?.practicalTopics?.length || 0) > 0,
      hasSRO: (docxParsed?.sroTasks?.length || 0) > 0,
      hasSROP: (docxParsed?.sropTable?.length || 0) > 0,
      hasKP: false,
    });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка анализа', message: error.message });
  } finally {
    if (tmpFile) { try { fs.unlinkSync(tmpFile); } catch {} }
  }
});

app.post('/api/generate-boundary-control', requireGenerationLimit('boundary_control'), async (req, res) => {
  try {
    const { discipline } = req.body;
    if (!discipline || !discipline.trim()) return res.status(400).json({ error: 'Название дисциплины обязательно' });
    const documentBuffer = await generateBoundaryControl(req.body);
    const safeFilename = createSafeFilename(discipline, 'RK');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}_RK.docx"`);
    res.send(documentBuffer);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка генерации', message: error.message });
  }
});

app.post('/api/generate-final-control', requireGenerationLimit('final_control'), async (req, res) => {
  try {
    const { discipline } = req.body;
    if (!discipline || !discipline.trim()) return res.status(400).json({ error: 'Название дисциплины обязательно' });
    const documentBuffer = await generateFinalControl(req.body);
    const safeFilename = createSafeFilename(discipline, 'Final');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}_Final.docx"`);
    res.send(documentBuffer);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка генерации', message: error.message });
  }
});

app.post('/api/generate-sro-full', requireGenerationLimit('sro_full'), async (req, res) => {
  try {
    const data = req.body;
    if (!data.subject || !data.subject.trim()) return res.status(400).json({ error: 'Название дисциплины обязательно' });
    const sroData = await generateSROFull(data);
    const documentBuffer = await createSROFullDocument(sroData);
    const safeFilename = createSafeFilename(data.subject, 'SRO_Full');
    res.setHeader('Content-Type', 'application/msword');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}.doc"`);
    res.send(documentBuffer);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка генерации', message: error.message });
  }
});

app.post('/api/ai-proxy', async (req, res) => {
  res.json({ content: '' });
});

app.post('/api/parse-node-file', upload.single('file'), async (req, res) => {
  const tmpFile = req.file?.path;
  try {
    if (!req.file) return res.status(400).json({ error: 'Файл не передан' });
    const rawBuffer = fs.readFileSync(tmpFile);
    let docxParsed = null;
    const isPKZip = rawBuffer[0] === 0x50 && rawBuffer[1] === 0x4B;
    if (isPKZip) {
      try { const { parseDocxSyllabus } = require('./docxParser'); docxParsed = parseDocxSyllabus(rawBuffer); } catch (e) {}
    }
    return res.json({
      discipline: req.file.originalname.replace(/\.[^.]+$/, ''),
      teacher: '',
      rawText: docxParsed?.rawText?.slice(0, 10000) || '',
      lectureTopics: docxParsed?.lectureTopics || [],
      labTopics: docxParsed?.labTopics || [],
      practicalTopics: docxParsed?.practicalTopics || [],
      sroTasks: docxParsed?.sroTasks || [],
      sropTopics: docxParsed?.sropTopics || [],
      kpTopics: [],
      allTopics: [],
    });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка обработки файла', message: error.message });
  } finally {
    if (tmpFile) { try { fs.unlinkSync(tmpFile); } catch {} }
  }
});

app.post('/api/generate-component', requireGenerationLimit('component'), async (req, res) => {
  try {
    const { type, discipline } = req.body;
    if (!type || !discipline) return res.status(400).json({ error: 'type и discipline обязательны' });

    const componentGenerators = { lectures: generateLectures, labs: generateLabs, practicals: generatePracticals, sro: generateSRO, srop: generateSROP, kp: generateKP };

    if (type === 'boundary_control') {
      const buf = await generateBoundaryControl(req.body);
      const safeFilename = createSafeFilename(discipline, 'RK');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}_RK.docx"`);
      return res.send(buf);
    }
    if (type === 'final_control') {
      const buf = await generateFinalControl(req.body);
      const safeFilename = createSafeFilename(discipline, 'Final');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}_Final.docx"`);
      return res.send(buf);
    }

    if (!componentGenerators[type]) return res.status(400).json({ error: `Неверный тип` });

    const documentBuffer = await componentGenerators[type](req.body);
    const safeFilename = createSafeFilename(discipline, type);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}.docx"`);
    res.setHeader('Content-Length', documentBuffer.length);
    res.send(documentBuffer);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка генерации компонента', message: error.message });
  }
});

app.post('/api/generate-excel', requireGenerationLimit('excel'), async (req, res) => {
  try {
    const schema = req.body;
    const buffer = await buildExcelFromSchema(schema);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="document.xlsx"`);
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка генерации Excel', message: error.message });
  }
});

const server = app.listen(PORT, () => {
  server.timeout = 180_000;
  console.log(`Server running on port ${PORT}`);
});

process.on('SIGTERM', () => { server.close(() => process.exit(0)); });

module.exports = app;
