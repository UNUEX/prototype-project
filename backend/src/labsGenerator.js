const { createDocumentWithTitle, resolveTopics } = require('./generator-utils');

async function generateLabs(data) {
  const discipline = data.discipline || 'Дисциплина';
  const { topics } = resolveTopics(data, 'labs');
  const content = topics && topics.length > 0 ? topics.join('\n') : 'Темы не найдены.';
  return createDocumentWithTitle(discipline, content, 'labs', {});
}

module.exports = { generateLabs };
