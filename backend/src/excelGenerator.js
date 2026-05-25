const ExcelJS = require('exceljs');

async function buildExcelFromSchema(schema) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'HiVersity Canvas';
  workbook.created = new Date();

  const sheets = schema.sheets || [];
  if (sheets.length === 0) {
    const ws = workbook.addWorksheet('Лист 1');
    ws.addRow(['Данные не переданы']);
  }

  for (const sheetDef of sheets) {
    const wsName = (sheetDef.name || 'Лист').slice(0, 31);
    const ws = workbook.addWorksheet(wsName);

    // Ширины колонок
    if (sheetDef.colWidths && Array.isArray(sheetDef.colWidths)) {
      sheetDef.colWidths.forEach((w, i) => {
        ws.getColumn(i + 1).width = Number(w) || 15;
      });
    }

    // Заголовочные строки
    const headerRows = sheetDef.headers || [];
    for (const hRow of headerRows) {
      ws.addRow(hRow);
    }

    // Строки данных
    const dataRows = sheetDef.rows || [];
    for (const row of dataRows) {
      ws.addRow(row);
    }

    // Merge ячеек
    const merges = sheetDef.merges || [];
    for (const m of merges) {
      try { ws.mergeCells(m); } catch {}
    }

    // Стили шапки
    const stylesDef = sheetDef.styles || {};
    const headerStyle = stylesDef.header || {};
    const headerRowNum = stylesDef.headerRow || headerRows.length;

    if (headerRowNum > 0) {
      const row = ws.getRow(headerRowNum);
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.font = {
          bold: headerStyle.bold !== false,
          color: { argb: 'FF' + (headerStyle.color || 'FFFFFF') },
          size: headerStyle.fontSize || 11,
          name: headerStyle.fontName || 'Calibri',
        };
        if (headerStyle.fill) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF' + headerStyle.fill },
          };
        }
        cell.alignment = {
          horizontal: headerStyle.align || 'center',
          vertical: 'middle',
          wrapText: true,
        };
        cell.border = {
          top:    { style: 'thin', color: { argb: 'FF000000' } },
          left:   { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          right:  { style: 'thin', color: { argb: 'FF000000' } },
        };
      });
      row.height = headerStyle.height || 22;
    }

    for (let ri = 1; ri < headerRows.length; ri++) {
      const row = ws.getRow(ri);
      row.eachCell({ includeEmpty: true }, cell => {
        if (!cell.font?.bold) {
          cell.font = { bold: true, size: 10 };
        }
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.border = {
          top:    { style: 'thin' },
          left:   { style: 'thin' },
          bottom: { style: 'thin' },
          right:  { style: 'thin' },
        };
      });
    }

    // Рамка для строк данных
    const totalRows = headerRows.length + dataRows.length;
    for (let ri = headerRows.length + 1; ri <= totalRows; ri++) {
      ws.getRow(ri).eachCell({ includeEmpty: true }, cell => {
        cell.border = {
          top:    { style: 'thin', color: { argb: 'FFCCCCCC' } },
          left:   { style: 'thin', color: { argb: 'FFCCCCCC' } },
          bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          right:  { style: 'thin', color: { argb: 'FFCCCCCC' } },
        };
      });
    }

    // Заморозка строк
    if (stylesDef.freezeRows || headerRows.length > 0) {
      const freezeAt = stylesDef.freezeRows || headerRows.length;
      ws.views = [{ state: 'frozen', ySplit: freezeAt }];
    }

    // График
    const chartDef = sheetDef.chart;
    if (chartDef && chartDef.dataRange) {
      try {
        const chartTypeMap = {
          bar:  'bar',
          line: 'line',
          pie:  'pie',
          area: 'area',
        };
        const chartType = chartTypeMap[chartDef.type] || 'bar';

        const chart = workbook.addChart(chartType, {
          title: { name: chartDef.title || 'График' },
          series: [{
            name: chartDef.title || 'Данные',
            xValues: chartDef.categoriesRange
              ? `'${wsName}'!${chartDef.categoriesRange}`
              : undefined,
            yValues: `'${wsName}'!${chartDef.dataRange}`,
          }],
          plotArea: { bar: { grouping: 'clustered', dir: 'col' } },
        });

        const anchorRow = totalRows + 2;
        ws.addChart(chart, `A${anchorRow}:H${anchorRow + 15}`);
      } catch (chartErr) {
        console.warn('Ошибка добавления графика:', chartErr.message);
      }
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

module.exports = { buildExcelFromSchema };