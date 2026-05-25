const { createDocumentWithTitle, resolveTopics } = require('./generator-utils');

async function generateLectures(data) {
  const discipline = data.discipline || 'Дисциплина';
  const { topics } = resolveTopics(data, 'lectures');
  const content = topics && topics.length > 0 ? topics.join('\n') : 'Темы не найдены.';
  return createDocumentWithTitle(discipline, content, 'lectures', {});
}

module.exports = { generateLectures };
