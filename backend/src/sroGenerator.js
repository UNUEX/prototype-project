const { createDocumentWithTitle, resolveTopics } = require('./generator-utils');

async function generateSRO(data) {
  const discipline = data.discipline || 'Дисциплина';
  const { topics } = resolveTopics(data, 'sro');
  const content = topics && topics.length > 0 ? topics.join('\n') : 'Темы не найдены.';
  return createDocumentWithTitle(discipline, content, 'sro', {});
}

module.exports = { generateSRO };
