async function callAI(messages, maxTokens = 4000, temperature = 0.7) {
  return null;
}

function safeParseJSON(text) {
  if (!text) return null;
  try { return JSON.parse(text); } catch (e) {}
  return null;
}

async function createDocumentWithTitle(discipline, content, type, meta = {}) {
  try {
    const { Document, Packer, Paragraph, TextRun } = require('docx');
    const doc = new Document({
      sections: [{ children: [new Paragraph({ children: [new TextRun({ text: discipline || '' })] })] }]
    });
    return await Packer.toBuffer(doc);
  } catch (err) {
    return Buffer.from('');
  }
}

async function createSimpleDocument(title, content, type) {
  return await createDocumentWithTitle(title, content, type);
}

function parseTopicsFromSyllabus(context, type) {
  return null;
}

function filterTopicsFromPlan(planRows, targetKind) {
  return null;
}

function resolveTopics(data, kind) {
  return { topics: null, source: 'none' };
}

function extractTopicsFromRawFile(rawText, kind) {
  return [];
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

module.exports = {
  callAI,
  safeParseJSON,
  createSimpleDocument,
  createDocumentWithTitle,
  parseTopicsFromSyllabus,
  filterTopicsFromPlan,
  resolveTopics,
  extractTopicsFromRawFile,
  escapeHtml
};