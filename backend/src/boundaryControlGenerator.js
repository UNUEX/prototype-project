const { createDocumentWithTitle } = require('./generator-utils');

async function generateBoundaryControl(data) {
  const discipline = data.discipline || 'Дисциплина';
  return createDocumentWithTitle(discipline, '', 'boundary', {});
}

module.exports = { generateBoundaryControl };
