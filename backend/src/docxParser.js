
'use strict';

const zlib = require('zlib');


function extractFromZip(buf, filename) {
  let pos = 0;
  while (pos < buf.length - 30) {
    // Ищем сигнатуру локального файлового заголовка: PK\x03\x04
    if (buf[pos] !== 0x50 || buf[pos+1] !== 0x4B ||
        buf[pos+2] !== 0x03 || buf[pos+3] !== 0x04) {
      pos++;
      continue;
    }
    const method        = buf.readUInt16LE(pos + 8);
    const compressedSz  = buf.readUInt32LE(pos + 18);
    const filenameLen   = buf.readUInt16LE(pos + 26);
    const extraLen      = buf.readUInt16LE(pos + 28);
    const fname         = buf.slice(pos + 30, pos + 30 + filenameLen).toString('utf8');
    const dataStart     = pos + 30 + filenameLen + extraLen;
    const dataEnd       = dataStart + compressedSz;

    if (fname === filename) {
      const data = buf.slice(dataStart, dataEnd);
      try {
        return method === 8 ? zlib.inflateRawSync(data) : data;
      } catch (e) {
        return null;
      }
    }
    pos = dataEnd > pos + 30 ? dataEnd : pos + 1;
  }
  return null;
}

// ─── XML-утилиты ──────────────────────────────────────────────────────────

/**
 * Извлекает все текстовые ноды из XML-фрагмента ячейки таблицы.
 * Обрабатывает <w:t> элементы, включая xml:space="preserve".
 * Параграфы (<w:p>) разделяет пробелом (для многострочных ячеек).
 */
function getCellText(cellXml) {
  const paragraphs = [];
  let pPos = 0;

  while (true) {
    const pStart = cellXml.indexOf('<w:p', pPos);
    if (pStart === -1) break;
    const pEnd = cellXml.indexOf('</w:p>', pStart);
    if (pEnd === -1) break;
    const pXml = cellXml.slice(pStart, pEnd + 6);

    const runs = [];
    let tPos = 0;
    while (true) {
      const tStart = pXml.indexOf('<w:t', tPos);
      if (tStart === -1) break;
      const tagClose = pXml.indexOf('>', tStart);
      if (tagClose === -1) break;
      const tEnd = pXml.indexOf('</w:t>', tagClose);
      if (tEnd === -1) break;
      runs.push(pXml.slice(tagClose + 1, tEnd));
      tPos = tEnd + 6;
    }
    if (runs.length > 0) paragraphs.push(runs.join(''));
    pPos = pEnd + 6;
  }

  return paragraphs.join(' ').trim();
}

/**
 * Парсит все таблицы из word/document.xml.
 * Возвращает массив таблиц, каждая — массив строк, каждая строка — массив строк ячеек.
 * Объединённые ячейки (vMerge без restart) заполняются пустой строкой.
 */
function parseTablesFromXml(xml) {
  const tables = [];

  // Разбиваем XML на таблицы
  let tPos = 0;
  while (true) {
    const tStart = xml.indexOf('<w:tbl>', tPos);
    if (tStart === -1) break;
    const tEnd = xml.indexOf('</w:tbl>', tStart);
    if (tEnd === -1) break;
    const tblXml = xml.slice(tStart, tEnd + 8);
    tables.push(parseTableXml(tblXml));
    tPos = tEnd + 8;
  }

  return tables;
}

function parseTableXml(tblXml) {
  const rows = [];
  let rPos = 0;

  while (true) {
    // Ищем <w:tr> или <w:tr (с атрибутами)
    const trStart1 = tblXml.indexOf('<w:tr>', rPos);
    const trStart2 = tblXml.indexOf('<w:tr ', rPos);
    let trStart = -1;
    if (trStart1 !== -1 && trStart2 !== -1) trStart = Math.min(trStart1, trStart2);
    else if (trStart1 !== -1) trStart = trStart1;
    else if (trStart2 !== -1) trStart = trStart2;
    if (trStart === -1) break;

    const trEnd = tblXml.indexOf('</w:tr>', trStart);
    if (trEnd === -1) break;
    const trXml = tblXml.slice(trStart, trEnd + 7);

    const cells = [];
    let cPos = 0;
    while (true) {
      const tcStart = trXml.indexOf('<w:tc>', cPos);
      if (tcStart === -1) break;
      const tcEnd = trXml.indexOf('</w:tc>', tcStart);
      if (tcEnd === -1) break;
      const tcXml = trXml.slice(tcStart, tcEnd + 7);
      cells.push(getCellText(tcXml));
      cPos = tcEnd + 7;
    }

    if (cells.length > 0) rows.push(cells);
    rPos = trEnd + 7;
  }

  return rows;
}

// ─── Определение тематического плана ──────────────────────────────────────

/**
 * Проверяет, является ли таблица тематическим планом раздела 9.
 * Критерии (все три):
 *   1. Заголовок содержит «Наименование» или «темы занятий»
 *   2. В заголовке есть типы занятий (лекции / лаборатор / СРОП / СРО)
 *   3. Есть нумерованные строки тем («1. Лекция», «ЛР №1», «Практика №1» и т.д.)
 */
function isThematicPlanTable(rows) {
  if (!rows || rows.length < 3) return false;

  // 1 + 2: заголовок
  const headerText = rows.slice(0, 2).map(r => r.join(' ')).join(' ').toLowerCase();
  const hasNameHeader = /наименование|темы занятий|тақырып/.test(headerText);
  if (!hasNameHeader) return false;

  const hasHourCols = /лекци|лаборатор|сроп|сро\b|срс\b|практи|семинар|зертхан|соөж|оөж/.test(headerText);
  if (!hasHourCols) return false;

  // 3: нумерованные темы в данных
  const topicPattern = /^(\d+\.\s+\S|(?:ЛР|ЗЖ)\s+[№#]?\d+|Практика\s+[№#]?\d+|Семинар\s+[№#]?\d+|Лабораторная\s+работа\s+[№#]?\d+)/i;
  for (let i = 1; i < Math.min(rows.length, 12); i++) {
    if (rows[i][0] && topicPattern.test(rows[i][0].trim())) return true;
  }
  return false;
}

/**
 * Парсит тематический план из массива строк таблицы.
 * Возвращает [ metaRow, ...dataRows ] — формат идентичный python-парсеру.
 */
function parseThematicPlanTable(rows) {
  if (!rows || rows.length < 2) return null;

  // Строим маппинг колонок из заголовочных строк
  const colMap = {};
  const colHeaders = {};
  let dataStart = 0;

  for (let ri = 0; ri < Math.min(rows.length, 4); ri++) {
    const cells = rows[ri];
    const rowText = cells.join(' ').toLowerCase();
    const isHeaderRow =
      /наименование/.test(rowText) ||
      (/лекци/.test(rowText) && (/практи/.test(rowText) || /лаборатор/.test(rowText) || /сроп/.test(rowText)));

    if (!isHeaderRow) {
      if (Object.keys(colMap).length > 0) { dataStart = ri; break; }
      continue;
    }

    for (let ci = 0; ci < cells.length; ci++) {
      const ct = cells[ci].toLowerCase().trim();
      if (!ct) continue;
      if (/трудоем|трудём/.test(ct)) continue; // надзаголовок «Трудоёмкость по видам»

      colHeaders[ci] = cells[ci].trim();

      if (/наименование|темы?\s+занят|раздел|тақырып/.test(ct)) {
        if (!('topic' in colMap)) colMap.topic = ci;
      } else if (/^лекци|^дәріс/.test(ct)) {
        if (!('lectures' in colMap)) colMap.lectures = ci;
      } else if (/лабор|зертхан/.test(ct)) {
        if (!('labs' in colMap)) colMap.labs = ci;
      } else if (/семинар|практи|тәжірибел|практикал/.test(ct)) {
        if (!('practicals' in colMap)) colMap.practicals = ci;
      } else if (/^сроп$|^срсп$|^соөж$/.test(ct)) {
        colMap.srop = ci;
      } else if (/^сро$|^срс$|^өож$|^оөж$/.test(ct)) {
        colMap.sro = ci;
      } else if (/^кп$|^кж$/.test(ct)) {
        colMap.kp = ci;
      }
    }
    dataStart = ri + 1;
  }

  // Если колонки не найдены (таблица без стандартных заголовков) — fallback позиционный
  const usedPositional = Object.keys(colMap).length <= 1;
  if (usedPositional) {
    colMap.topic = 0;
    colMap.lectures = 1;
    colMap.practicals = 2;
    colMap.labs = 3;
    colMap.srop = 4;
    colMap.sro = 5;
  }

  const orderedFields = ['lectures', 'practicals', 'labs', 'srop', 'sro', 'kp'];
  const presentFields = orderedFields.filter(f => f in colMap);

  const defaultLabels = {
    lectures:   'лекции',
    practicals: 'семинар /практи-ческие работы',
    labs:       'лабора-торные работы',
    srop:       'СРОП',
    sro:        'СРО',
    kp:         'КП',
  };
  const columnHeaders = {};
  for (const f of presentFields) {
    const ci = colMap[f];
    columnHeaders[f] = colHeaders[ci] || defaultLabels[f];
  }

  function getVal(row, field, posIdx) {
    if (!usedPositional && field in colMap) {
      const ci = colMap[field];
      return ci < row.length ? row[ci].trim() : '';
    } else if (usedPositional && posIdx < row.length) {
      return row[posIdx].trim();
    }
    return '';
  }

  const dataRows = [];

  for (let ri = dataStart; ri < rows.length; ri++) {
    const row = rows[ri];
    if (!row || row.every(c => !c.trim())) continue;

    const topicCi = colMap.topic !== undefined ? colMap.topic : 0;
    let topicText = (topicCi < row.length ? row[topicCi] : '').trim();

    if (!topicText || topicText.length < 2) continue;
    if (/^наименование\s+раздела|^наименование\s+тем/i.test(topicText)) continue;

    // Убираем двойной префикс «ЛР №N. ЛР №N.»
    topicText = topicText
      .replace(/^((?:ЛР|ЗЖ|Лабораторная\s+работа|Зертханалық\s+жұмыс)\s+[№#]?\d+\.)\s+\1\s*/i, '$1 ')
      .replace(/^((?:ЛР|ЗЖ)\s+[№#]?\d+[\.\s]+)((?:ЛР|ЗЖ)\s+[№#]?\d+[\.\s]+)/i, '$1')
      .trim();

    // ИТОГО
    if (/^итого|^всего/i.test(topicText)) {
      dataRows.push({
        isHeader: false, isTotals: true,
        topic: topicText,
        lectures:   getVal(row, 'lectures',   1),
        practicals: getVal(row, 'practicals', 2),
        labs:       getVal(row, 'labs',       3),
        srop:       getVal(row, 'srop',       4),
        sro:        getVal(row, 'sro',        5),
        kp:         getVal(row, 'kp',         6),
      });
      continue;
    }

    // Строка-подзаголовок
    const isSubheader = /^(лекции|лабораторные\s+работ|практические\s+занят|семинарские\s+занят|дәрістер|зертханалық\s+жұмыс|тәжірибелік\s+сабақ|практикалық\s+сабақ)$/i.test(topicText.trim());
    if (isSubheader) {
      dataRows.push({
        isHeader: true,
        topic: topicText.trim(),
        lectures: '', practicals: '', labs: '', srop: '', sro: '', kp: '',
      });
      continue;
    }

    dataRows.push({
      isHeader: false,
      topic: topicText,
      lectures:   getVal(row, 'lectures',   1),
      practicals: getVal(row, 'practicals', 2),
      labs:       getVal(row, 'labs',       3),
      srop:       getVal(row, 'srop',       4),
      sro:        getVal(row, 'sro',        5),
      kp:         getVal(row, 'kp',         6),
    });
  }

  if (dataRows.length === 0) return null;

  const metaRow = { _meta: true, columnHeaders, presentFields };
  return [metaRow, ...dataRows];
}

// ─── Парсинг СРОП таблицы (раздел 12) ─────────────────────────────────────

function parseSropTable(rows) {
  if (!rows || rows.length < 2) return [];
  // Формат: Тема | Цель | Содержание
  const header = rows[0].join(' ').toLowerCase();
  if (!(/наименование\s+темы\s+сроп|тема\s+сроп|тақырып.*срсп/i.test(header) || /цель\s+занятия/i.test(header))) {
    return [];
  }
  const result = [];
  for (let ri = 1; ri < rows.length; ri++) {
    const theme = rows[ri][0]?.trim();
    const goal = rows[ri][1]?.trim();
    const content = rows[ri][2]?.trim();
    if (theme && theme.length > 3) {
      result.push({ theme, goal: goal || '', content: content || '' });
    }
  }
  return result;
}

// ─── Извлечение текстовых разделов из XML ─────────────────────────────────

/**
 * Извлекает весь текст из document.xml в виде строк параграфов.
 * Сохраняет порядок следования параграфов и таблиц.
 */
function extractFullText(xml) {
  const lines = [];
  let pos = 0;

  while (true) {
    // Следующий параграф или таблица
    const pNext = xml.indexOf('<w:p', pos);
    const tNext = xml.indexOf('<w:tbl>', pos);

    if (pNext === -1 && tNext === -1) break;

    // Берём что идёт раньше
    const isP = pNext !== -1 && (tNext === -1 || pNext < tNext);

    if (isP) {
      const pEnd = xml.indexOf('</w:p>', pNext);
      if (pEnd === -1) break;
      const pXml = xml.slice(pNext, pEnd + 6);
      const text = getParagraphText(pXml);
      if (text) lines.push(text);
      pos = pEnd + 6;
    } else {
      // Таблица — добавляем строки ячеек
      const tEnd = xml.indexOf('</w:tbl>', tNext);
      if (tEnd === -1) break;
      const tblRows = parseTableXml(xml.slice(tNext, tEnd + 8));
      for (const row of tblRows) {
        for (const cell of row) {
          if (cell.trim()) lines.push(cell.trim());
        }
      }
      pos = tEnd + 8;
    }
  }

  return lines.join('\n');
}

function getParagraphText(pXml) {
  const runs = [];
  let pos = 0;
  while (true) {
    const tStart = pXml.indexOf('<w:t', pos);
    if (tStart === -1) break;
    const tagClose = pXml.indexOf('>', tStart);
    if (tagClose === -1) break;
    const tEnd = pXml.indexOf('</w:t>', tagClose);
    if (tEnd === -1) break;
    runs.push(pXml.slice(tagClose + 1, tEnd));
    pos = tEnd + 6;
  }
  return runs.join('').trim();
}

// ─── Основная функция ──────────────────────────────────────────────────────

/**
 * Парсит DOCX-буфер силлабуса.
 * Возвращает объект с полями идентичными python-парсеру.
 *
 * @param {Buffer} buffer
 * @returns {object}
 */
function parseDocxSyllabus(buffer) {
  const result = {
    thematicPlanRows: [],
    sropTable: [],
    rawText: '',
    introduction: '',
    goal: '',
    tasks: '',
    learningResults: '',
    lectureTopics: [],
    labTopics: [],
    practicalTopics: [],
    kpTopics: [],
    sroTasks: [],
  };

  try {
    // 1. Извлекаем word/document.xml из ZIP
    const xmlBuf = extractFromZip(buffer, 'word/document.xml');
    if (!xmlBuf) return result;
    const xml = xmlBuf.toString('utf8');

    // 2. Парсим все таблицы
    const allTables = parseTablesFromXml(xml);

    // 3. Находим тематический план (Стратегия А: по позиции в XML)
    let thematicFound = false;

    // Стратегия А: ищем таблицу, которая идёт ПОСЛЕ заголовка раздела «9. Тематический план»
    // Для этого парсим XML документа последовательно
    const bodyXml = (() => {
      const bodyStart = xml.indexOf('<w:body>');
      const bodyEnd = xml.indexOf('</w:body>');
      return bodyStart !== -1 ? xml.slice(bodyStart + 8, bodyEnd !== -1 ? bodyEnd : undefined) : xml;
    })();

    let scanPos = 0;
    let inSection9 = false;

    while (!thematicFound && scanPos < bodyXml.length) {
      const pNext = bodyXml.indexOf('<w:p', scanPos);
      const tNext = bodyXml.indexOf('<w:tbl>', scanPos);
      if (pNext === -1 && tNext === -1) break;

      const isP = pNext !== -1 && (tNext === -1 || pNext < tNext);

      if (isP) {
        const pEnd = bodyXml.indexOf('</w:p>', pNext);
        if (pEnd === -1) break;
        const paraText = getParagraphText(bodyXml.slice(pNext, pEnd + 6));

        if (!inSection9 && /^9[\s.]+[Тт]ематический\s+план/i.test(paraText)) {
          inSection9 = true;
        } else if (inSection9 && /^10[\s.]/i.test(paraText)) {
          inSection9 = false;
        }
        scanPos = pEnd + 6;
      } else {
        const tEnd = bodyXml.indexOf('</w:tbl>', tNext);
        if (tEnd === -1) break;

        if (inSection9) {
          const tblRows = parseTableXml(bodyXml.slice(tNext, tEnd + 8));
          if (isThematicPlanTable(tblRows)) {
            const parsed = parseThematicPlanTable(tblRows);
            if (parsed && parsed.length >= 2) {
              result.thematicPlanRows = parsed;
              thematicFound = true;
            }
          }
        }
        scanPos = tEnd + 8;
      }
    }

    // Стратегия Б: перебор всех таблиц если А не сработала
    if (!thematicFound) {
      for (const tblRows of allTables) {
        if (isThematicPlanTable(tblRows)) {
          const parsed = parseThematicPlanTable(tblRows);
          if (parsed && parsed.length >= 2) {
            result.thematicPlanRows = parsed;
            thematicFound = true;
            break;
          }
        }
      }
    }

    // 4. Находим СРОП таблицу (раздел 12)
    for (const tblRows of allTables) {
      const header = (tblRows[0] || []).join(' ');
      if (/наименование\s+темы\s+сроп|тема\s+сроп|цель\s+занятия/i.test(header)) {
        const parsed = parseSropTable(tblRows);
        if (parsed.length > 0) {
          result.sropTable = parsed;
          break;
        }
      }
    }

    // 5. Извлекаем сырой текст для parseSyllabusText в index.js
    result.rawText = extractFullText(xml);

    // 6а. Извлекаем sroTasks из раздела 11 rawText
    // Раздел 11 содержит задания СРО — нумерованные строки вида "N. Задание"
    (function extractSroTasks() {
      const lines = result.rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      let sec11Start = -1, sec11End = lines.length;
      for (let i = 0; i < lines.length; i++) {
        if (sec11Start === -1 && /^11[\s.]+/i.test(lines[i])) { sec11Start = i; continue; }
        if (sec11Start !== -1 && /^12[\s.]/i.test(lines[i])) { sec11End = i; break; }
      }
      if (sec11Start === -1) return;
      for (let i = sec11Start + 1; i < sec11End; i++) {
        const line = lines[i];
        if (!line) continue;
        // Пропускаем подзаголовки 11.1, 11.2 и вопросы (содержат "?")
        if (/^11\.\d/i.test(line)) continue;
        if (/^(Творческие|Исследовательские|Контрольные\s+вопросы|Зерттеу|Бақылау)/i.test(line)) continue;
        if (line.includes('?')) continue;
        const m = line.match(/^(\d+)[.)]\s+(.{4,})/);
        if (m && !/^(итого|всего)/i.test(m[2])) {
          result.sroTasks.push(`${m[1]}. ${m[2].trim()}`);
        }
      }
    })();

    // 6б. Извлекаем sropTopics из sropTable (темы СРОП уже в sropTable[i].theme)
    if (result.sropTable && result.sropTable.length > 0) {
      result.sropTopics = result.sropTable
        .map((row, i) => {
          const theme = (row.theme || '').trim();
          if (!theme || theme.length < 3) return null;
          // Если уже есть номер — оставляем, если нет — добавляем
          if (/^\d+[.)]\s/.test(theme)) return theme;
          return `${i + 1}. ${theme}`;
        })
        .filter(Boolean);
    } else {
      result.sropTopics = [];
    }

    // 6. Извлекаем темы из thematicPlanRows
    if (result.thematicPlanRows.length > 0) {
      const dataRows = result.thematicPlanRows.filter(r => !r._meta && !r.isHeader && !r.isTotals);

      // Вспомогательная: фильтрует строки-итоги и шумовые строки
      const isValidTopic = (topic) => {
        if (!topic || topic.trim().length < 3) return false;
        if (/^(БАРЛЫҒЫ|ИТОГО|ВСЕГО|БАРЛЫГЫ)/i.test(topic.trim())) return false;
        return true;
      };

      // Вспомогательная: проверяет что значение часов > 0 (не прочерк, не 0)
      const hasPositiveHours = (val) => {
        const v = (val || '').trim();
        if (!v || v === '-' || v === '—' || v === '–' || v === '0') return false;
        const n = parseInt(v, 10);
        return !isNaN(n) && n > 0;
      };

      result.lectureTopics = dataRows
        .filter(r => {
          if (!isValidTopic(r.topic)) return false;
          const hasHours = hasPositiveHours(r.lectures);
          const byName = /^лекция\s+\d+|^\d+\.\s*лекция|\bлекц[ия]|^\d+\.\s*дәріс|^дәріс/i.test(r.topic);
          return hasHours || byName;
        })
        .map(r => r.topic);

      result.labTopics = dataRows
        .filter(r => {
          if (!isValidTopic(r.topic)) return false;
          const hasHours = hasPositiveHours(r.labs);
          const byName = /^(?:ЛР|ЗЖ)\s+[№#]?\d+|^лабораторная\s+работ|^зертханалық/i.test(r.topic);
          return hasHours || byName;
        })
        .map(r => r.topic);

      result.practicalTopics = dataRows
        .filter(r => {
          if (!isValidTopic(r.topic)) return false;
          const hasHours = hasPositiveHours(r.practicals);
          const byName = /^практика\s+[№#]?\d+|^практическое\s+занятие|^семинар\s+[№#]?\d+|^тәжірибелік/i.test(r.topic);
          return hasHours || byName;
        })
        .map(r => r.topic);
    }

    return result;

  } catch (err) {
    console.warn('⚠️ docxParser: ошибка парсинга:', err.message);
    return result;
  }
}

module.exports = { parseDocxSyllabus };