
const docx = require('docx');
const {
  Document, Paragraph, Table, TableRow, TableCell,
  WidthType, AlignmentType, BorderStyle, TextRun, VerticalAlign,
  UnderlineType
} = docx;

// ─── КОНСТАНТЫ ───────────────────────────────────────────────────────────────

const FONT = 'Times New Roman';
const SZ   = 24; // 12pt в half-points

const W_NUM   = 540;
const W_DATE  = 1260;
const W_TOPIC = 3800;
const W_HRS   = 780;
const W_NOTE  = 900;


const WL_NUM   = 540;
const WL_DATE1 = 820;
const WL_DATE2 = 820;
const WL_TOPIC = 3150;
const WL_HRS   = 780;
const WL_NOTE  = 900;

// ─── УТИЛИТЫ ─────────────────────────────────────────────────────────────────

function fmtDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return String(dateStr);
  return [String(d.getDate()).padStart(2,'0'),
          String(d.getMonth()+1).padStart(2,'0'),
          d.getFullYear()].join('.');
}

function brd() {
  const s = { style: BorderStyle.SINGLE, size: 4, color: '000000' };
  return { borders: { top: s, bottom: s, left: s, right: s } };
}

// Параграф для обычного текста документа
function p(runs, { align = AlignmentType.LEFT, spaceBefore = 0, spaceAfter = 0, indent = null } = {}) {
  const children = Array.isArray(runs) ? runs : [runs];
  const opts = { alignment: align, spacing: { before: spaceBefore, after: spaceAfter }, children };
  if (indent !== null) opts.indent = { left: indent };
  return new Paragraph(opts);
}

// TextRun с параметрами
function tr(text, { bold = false, italic = false, underline = false, size = SZ } = {}) {
  const o = { text, font: FONT, size, bold, italics: italic };
  if (underline) o.underline = { type: UnderlineType.SINGLE };
  return new TextRun(o);
}

// Параграф для ячейки таблицы
function cp(text, { align = AlignmentType.CENTER, bold = false, italic = false, size = SZ } = {}) {
  return new Paragraph({
    alignment: align,
    spacing: { before: 0, after: 0 },
    children: [new TextRun({ text, font: FONT, size, bold, italics: italic })]
  });
}

// Ячейка таблицы
function tc(children, width, { vAlign = VerticalAlign.CENTER, colSpan, rowSpan } = {}) {
  const opts = { width: { size: width, type: WidthType.DXA }, verticalAlign: vAlign, children, ...brd() };
  if (colSpan) opts.columnSpan = colSpan;
  if (rowSpan) opts.rowSpan = rowSpan;
  return new TableCell(opts);
}

function parseMd(md) {
  if (!md) return [];
  return md.split('\n')
    .filter(l => l.trim().startsWith('|') && !l.includes('---'))
    .slice(1)
    .map(l => l.split('|').map(c => c.trim()).filter((_, i, a) => i > 0 && i < a.length - 1));
}


function dateCells(dateStr) {
  const lines = (dateStr || '').split(/\n/).map(s => s.trim()).filter(Boolean);
  if (!lines.length) return [cp('')];
  return lines.map(d => new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 0 },
    children: [new TextRun({ text: d, font: FONT, size: SZ })]
  }));
}


function buildMainTable(data) {
  const rows = [];

  // Заголовок
  rows.push(new TableRow({ tableHeader: true, children: [
    tc([cp('№', { bold: true })], W_NUM),
    tc([cp('Күні\n(Дата)', { bold: true })], W_DATE),
    tc([cp('Сабақтың түрі мен тақырыбы\n(Вид и темы занятий)', { bold: true })], W_TOPIC),
    tc([cp('Сағат саны\n(Кол-во часов)', { bold: true })], W_HRS),
    tc([cp('Ескерту\n(Приме-чание)', { bold: true })], W_NOTE),
  ]}));

  const addSection = (label, rows_data) => {
    rows.push(new TableRow({ children: [
      tc([cp('')], W_NUM),
      tc([cp('')], W_DATE),
      tc([cp(label, { bold: true, italic: true })], W_TOPIC),
      tc([cp('')], W_HRS),
      tc([cp('')], W_NOTE),
    ]}));
    rows_data.forEach(cols => {
      rows.push(new TableRow({ children: [
        tc([cp(cols[0] || '')], W_NUM),
        tc(dateCells(cols[1] || ''), W_DATE),
        tc([cp(cols[2] || '', { align: AlignmentType.JUSTIFY })], W_TOPIC, { vAlign: VerticalAlign.TOP }),
        tc([cp(cols[3] || '')], W_HRS),
        tc([cp(cols[4] || '', { align: AlignmentType.LEFT })], W_NOTE),
      ]}));
    });
  };

  const lectRows  = parseMd(data.lecturesTable);
  const practRows = parseMd(data.practiceTable);
  const sropRows  = parseMd(data.sroTable);

  if (lectRows.length > 0)  addSection('Лекции', lectRows);
  if (practRows.length > 0) addSection('Практические (семинарские) занятия', practRows);
  if (sropRows.length > 0)  addSection('СРОП', sropRows);

  // ИТОГО
  rows.push(new TableRow({ children: [
    tc([cp('')], W_NUM),
    tc([cp('')], W_DATE),
    tc([cp('ИТОГО', { bold: true })], W_TOPIC),
    tc([cp(String(data.hours || ''), { bold: true })], W_HRS),
    tc([cp('')], W_NOTE),
  ]}));

  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows });
}

function buildLabTable(data) {
  const labRows = parseMd(data.labsTable);
  if (!labRows.length) return null;

  const hasSubgroups = data.hasSubgroups === true;
  const rows = [];

  if (hasSubgroups) {
    // С подгруппами — двойной заголовок (rowSpan работает корректно)
    rows.push(new TableRow({ tableHeader: true, children: [
      tc([cp('№', { bold: true })], WL_NUM, { rowSpan: 2 }),
      tc([cp('1 подгр.', { bold: true })], WL_DATE1),
      tc([cp('2 подгр.', { bold: true })], WL_DATE2),
      tc([cp('Лабораторные занятия', { bold: true, italic: true })], WL_TOPIC, { rowSpan: 2 }),
      tc([cp('Сағат саны\n(Кол-во часов)', { bold: true })], WL_HRS, { rowSpan: 2 }),
      tc([cp('Ескерту\n(Приме-чание)', { bold: true })], WL_NOTE, { rowSpan: 2 }),
    ]}));
    // Вторая строка заголовка — только ячейки дат
    rows.push(new TableRow({ children: [
      tc([cp('')], WL_DATE1),
      tc([cp('')], WL_DATE2),
    ]}));
  } else {
    // БЕЗ подгрупп — простой одинарный заголовок, без rowSpan
    rows.push(new TableRow({ tableHeader: true, children: [
      tc([cp('№', { bold: true })], WL_NUM),
      tc([cp('Дата', { bold: true })], WL_DATE1),
      tc([cp('Лабораторные занятия', { bold: true, italic: true })], WL_TOPIC),
      tc([cp('Сағат саны\n(Кол-во часов)', { bold: true })], WL_HRS),
      tc([cp('Ескерту\n(Приме-чание)', { bold: true })], WL_NOTE),
    ]}));
  }


  labRows.forEach(cols => {
    let num, d1, d2, topic, hrs, note;
    if (cols.length >= 6) {
      [num, d1, d2, topic, hrs, note] = cols;
    } else if (cols.length >= 5) {
      [num, d1, topic, hrs, note] = cols; d2 = d1;
    } else {
      [num, d1, topic, hrs] = cols; d2 = d1; note = '';
    }

    rows.push(new TableRow({ children: [
      tc([cp(num || '')], WL_NUM),
      tc(dateCells(d1), WL_DATE1),
      ...(hasSubgroups ? [tc(dateCells(d2), WL_DATE2)] : []),
      tc([cp(topic || '', { align: AlignmentType.JUSTIFY })], WL_TOPIC, { vAlign: VerticalAlign.TOP }),
      tc([cp(hrs || '')], WL_HRS),
      tc([cp(note || '', { align: AlignmentType.LEFT })], WL_NOTE),
    ]}));
  });

  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows });
}

// ─── ГЛАВНАЯ ФУНКЦИЯ ──────────────────────────────────────────────────────────

async function createCalendarDocument(data) {
  console.log('📄 Генерация ФАСА-стиль:', data.subject);

  const endYear = data.endDate ? new Date(data.endDate).getFullYear() : new Date().getFullYear();
  const teacher = data.teacher || '';
  const headOfDepartment = data.headOfDepartment || '';

  const mainTable = buildMainTable(data);
  const labTable  = buildLabTable(data);

  const doc = new Document({
    styles: {
      default: {
        document: {
          run:       { font: FONT, size: SZ },
          paragraph: { spacing: { line: 276, before: 0, after: 0 } }
        }
      }
    },
    sections: [{
      properties: {
        page: {
          margin: { top: 709, bottom: 568, left: 1134, right: 566 }
          // 1.25cm / 1.00cm / 2.00cm / 1.00cm
        }
      },
      children: [
        // ── ШАПКА ────────────────────────────────────────────────────────────
        p([tr('КеАҚ «ӘБІЛҚАС САҒЫНОВ АТЫНДАҒЫ ҚАРАҒАНДЫ ТЕХНИКАЛЫҚ УНИВЕРСИТЕТІ»')]),
        p([tr('НАО «КАРАГАНДИНСКИЙ ТЕХНИЧЕСКИЙ УНИВЕРСИТЕТ')]),
        p([tr('ИМЕНИ АБЫЛКАСА САГИНОВА»')], { align: AlignmentType.CENTER }),
        p([tr('')]),

        // "Утверждаю" — отступ как в ФАСА (li≈3870)
        p([tr('Бекітемін')],                                           { indent: 3870 }),
        p([tr('Утверждаю')],                                           { indent: 3870 }),
        p([tr('Каф. меңгерушісі (Зав. кафедрой)')],                   { indent: 3870 }),
        p([tr(headOfDepartment || '____________________________')],    { indent: 3870 }),
        p([tr(`_____   ______________  ${endYear} ж.(г.)`)],           { indent: 3870 }),
        p([tr('')]),

        // ── ЗАГОЛОВОК ─────────────────────────────────────────────────────────
        p([tr('КҮНТIЗБЕЛIК ЖОСПАР',     { bold: true })], { align: AlignmentType.CENTER }),
        p([tr('(КАЛЕНДАРНЫЙ ПЛАН)',       { bold: true })], { align: AlignmentType.CENTER }),
        p([tr('')]),

        // ── ИНФО-БЛОК ─────────────────────────────────────────────────────────
        new Paragraph({
          alignment: AlignmentType.JUSTIFY,
          spacing: { before: 0, after: 0 },
          children: [
            tr('      '),
            tr(data.subject || '', { underline: true }),
            tr(' пәні бойынша оқу сабақтарының'),
          ]
        }),
        p([tr('     (Учебных занятий по дисциплине)')], { align: AlignmentType.JUSTIFY }),

        new Paragraph({
          alignment: AlignmentType.JUSTIFY,
          spacing: { before: 0, after: 0 },
          children: [
            tr('     тобы (ағымы) (в группах (потоке))  '),
            tr(data.group || '', { underline: true }),
          ]
        }),

        ...(data.startDate && data.endDate ? [
          p([tr(`     Оқу кезеңі (Период обучения)  ${fmtDate(data.startDate)} – ${fmtDate(data.endDate)}`)],
            { align: AlignmentType.JUSTIFY })
        ] : []),

        p([tr(`          ${data.semester || 'весенний'}\tсеместр`)],        { align: AlignmentType.JUSTIFY }),
        p([tr(`     ${data.academicYear || '2025 – 2026'} оқу жылы (учебный год)`)], { align: AlignmentType.JUSTIFY }),
        p([tr(`     Сабақ саны (сағатына) (количество занятий (в час)         ${data.hours || ''}`)],  { align: AlignmentType.JUSTIFY }),
        p([tr(`     Студенттердің есебі (Отчетность студентов)         ${data.controlType || ''}`)],   { align: AlignmentType.JUSTIFY }),
        p([tr('            (емтихан, сынақ)')],   { align: AlignmentType.JUSTIFY, indent: 2697 }),
        p([tr('           (экзамены, зачеты)')],  { align: AlignmentType.JUSTIFY, indent: 2697, spaceAfter: 120 }),

        // ── ТАБЛИЦЫ ───────────────────────────────────────────────────────────
        mainTable,
        ...(labTable ? [p([tr('')]), labTable] : []),

        // ── ПОДВАЛ ────────────────────────────────────────────────────────────
        p([tr('')]),
        p([tr('    Күнтізбелік жоспарды кұрастардым (Составил календарный план)')], { align: AlignmentType.JUSTIFY }),
        p([tr(`    ${teacher}`)], { align: AlignmentType.JUSTIFY }),
        p([tr('')]),
        p([tr('    Курс лекторымен келісілді (Согласовано с лектором курса)')], { align: AlignmentType.JUSTIFY }),
        // ▶ Требование 5: всегда ФИО преподавателя вместо "Ст.преп. Винтерголлер И.Г."
        p([tr(`     ${teacher}`)], { align: AlignmentType.JUSTIFY }),
        p([tr(`     «        »             ${endYear}   ж.(г.)`)], { align: AlignmentType.JUSTIFY }),
      ]
    }]
  });

  return await docx.Packer.toBuffer(doc);
}

module.exports = { createCalendarDocument };