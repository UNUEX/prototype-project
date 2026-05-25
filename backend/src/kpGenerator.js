const { createDocumentWithTitle } = require('./generator-utils');

async function generateKP(data) {
  const discipline = data.discipline || 'Дисциплина';
  return createDocumentWithTitle(discipline, '', 'kp', {});
}

module.exports = { generateKP };
