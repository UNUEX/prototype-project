const { createDocumentWithTitle } = require('./generator-utils');

async function generateFinalControl(data) {
  const discipline = data.discipline || 'Дисциплина';
  return createDocumentWithTitle(discipline, '', 'final', {});
}

module.exports = { generateFinalControl };
