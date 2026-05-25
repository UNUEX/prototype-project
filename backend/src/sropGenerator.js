const { createDocumentWithTitle, resolveTopics } = require('./generator-utils');

async function generateSROP(data) {
  const discipline = data.discipline || 'Дисциплина';
  const { topics } = resolveTopics(data, 'srop');
  const content = topics && topics.length > 0 ? topics.join('\n') : 'Темы не найдены.';
  return createDocumentWithTitle(discipline, content, 'srop', {});
}

module.exports = { generateSROP };
