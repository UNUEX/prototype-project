async function generateSROFull(data) {
  return {
    subject: data.subject || 'Дисциплина',
    code: data.code || '',
    teacher: '',
    department: '',
    year: data.year || new Date().getFullYear(),
    program: data.program || '',
    sropPlan: [],
    creativeTasks: [],
    controlQuestions: [],
    mainLiterature: [],
    additionalLiterature: [],
  };
}

module.exports = { generateSROFull };
