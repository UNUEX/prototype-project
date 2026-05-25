async function generateCalendar(data) {
  const subject = data.subject || data._rawPrompt || 'Дисциплина';
  return {
    subject,
    group: data.group || '',
    teacher: data.teacher || '',
    academicYear: data.academicYear || '2025 – 2026',
    semester: data.semester || 'весенний',
    hours: data.hours || '150',
    controlType: data.controlType || 'экзамен',
    startDate: data.startDate || '2026-01-26',
    endDate: data.endDate || '2026-05-10',
    hasSubgroups: data.hasSubgroups || false,
    lecturesTable: null,
    practiceTable: null,
    labsTable: null,
    sroTable: null,
  };
}

module.exports = { generateCalendar };
