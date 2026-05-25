const { createDocumentWithTitle, resolveTopics } = require('./generator-utils');

async function generatePracticals(data) {
  const discipline = data.discipline || 'Дисциплина';
  const { topics } = resolveTopics(data, 'practicals');
  const content = topics && topics.length > 0 ? topics.join('\n') : 'Темы не найдены.';
  return createDocumentWithTitle(discipline, content, 'practicals', {});
}

module.exports = { generatePracticals };
