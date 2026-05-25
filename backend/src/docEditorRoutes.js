const express = require('express');
const multer = require('multer');
const mammoth = require('mammoth');
const os = require('os');
const path = require('path');
const fs = require('fs');
const docx = require('docx');
const PizZip = require('pizzip');

const { Document, Paragraph, TextRun, Packer, AlignmentType } = docx;

const router = express.Router();

const upload = multer({
  storage: multer.diskStorage({
    destination: os.tmpdir(),
    filename: (_, file, cb) => cb(null, `doc_edit_${Date.now()}${path.extname(file.originalname)}`),
  }),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.docx', '.doc', '.txt'].includes(ext)) cb(null, true);
    else cb(new Error('Только .docx/.doc/.txt'), false);
  },
});

const uploadDocx = multer({
  storage: multer.diskStorage({
    destination: os.tmpdir(),
    filename: (_, file, cb) => cb(null, `doc_patch_${Date.now()}${path.extname(file.originalname)}`),
  }),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.docx') cb(null, true);
    else cb(new Error('Только .docx'), false);
  },
});

// Парсинг загруженного документа
router.post('/parse', upload.single('file'), async (req, res) => {
  const tmpFile = req.file?.path;
  try {
    if (!req.file) return res.status(400).json({ error: 'Файл не передан' });
    const ext = path.extname(req.file.originalname).toLowerCase();
    const buf = fs.readFileSync(tmpFile);
    let text = '';
    if (ext === '.txt') {
      text = buf.toString('utf-8');
    } else {
      const result = await mammoth.extractRawText({ buffer: buf });
      text = result.value || '';
    }
    if (!text || text.trim().length < 10) {
      return res.status(422).json({ error: 'Не удалось извлечь текст из файла' });
    }
    return res.json({ text: text.trim(), originalName: req.file.originalname, charCount: text.length });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  } finally {
    if (tmpFile) fs.unlink(tmpFile, () => {});
  }
});

router.post('/rewrite', async (req, res) => {
  return res.status(503).json({ error: 'Сервис временно недоступен' });
});

// Точечная замена текста в .docx через прямой патч document.xml
router.post('/export-patch', uploadDocx.single('file'), (req, res) => {
  const tmpFile = req.file?.path;
  try {
    if (!req.file) return res.status(400).json({ error: 'Файл не передан' });
    let replacements = [];
    try { replacements = JSON.parse(req.body.replacements || '[]'); } catch { return res.status(400).json({ error: 'Некорректный формат replacements' }); }
    const buf = fs.readFileSync(tmpFile);
    if (replacements.length === 0) {
      const safeName = path.basename(req.file.originalname, path.extname(req.file.originalname));
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${safeName}.docx"`);
      return res.send(buf);
    }
    const zip = new PizZip(buf);
    const docXmlFile = zip.file('word/document.xml');
    if (!docXmlFile) return res.status(422).json({ error: 'Не удалось найти document.xml' });
    let xml = docXmlFile.asText();
    for (const { oldText, newText } of replacements) {
      if (!oldText || newText === undefined) continue;
      xml = xml.split(oldText).join(newText);
    }
    zip.file('word/document.xml', xml);
    const patchedBuf = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
    const safeName = path.basename(req.file.originalname, path.extname(req.file.originalname));
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}.docx"`);
    res.send(patchedBuf);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (tmpFile) fs.unlink(tmpFile, () => {});
  }
});

// Экспорт обычного текста в .doc
router.post('/export', (req, res) => {
  const { text, filename } = req.body;
  if (!text || text.trim().length < 1) return res.status(400).json({ error: 'text обязателен' });
  try {
    const paragraphs = text.split(/\n/).map(line =>
      new Paragraph({ alignment: AlignmentType.LEFT, spacing: { before: 0, after: 80 }, children: [new TextRun({ text: line, font: 'Times New Roman', size: 28 })] })
    );
    const doc = new Document({ sections: [{ children: paragraphs }] });
    Packer.toBuffer(doc).then(buffer => {
      const safeName = (filename || 'document').replace(/[^a-zA-Zа-яёА-ЯЁ0-9_\-\.]/g, '_');
      res.setHeader('Content-Type', 'application/msword');
      res.setHeader('Content-Disposition', `attachment; filename="${safeName}.doc"`);
      res.send(buffer);
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;