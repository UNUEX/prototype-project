/**
 * ИСПРАВЛЕНО: Явно задан черный цвет (#000000) для всего текста
 */

const docx = require('docx');
const {
  Document, Paragraph, Table, TableRow, TableCell,
  WidthType, AlignmentType, BorderStyle, TextRun, VerticalAlign, PageBreak
} = docx;

async function createSROFullDocument(data) {
  console.log('📄 sroFullWordGenerator — Создание документа СРО для:', data.subject);

  const year = data.year || new Date().getFullYear();
  const teacher = 'ФИО'; 
  const department = 'Указать'; 
  const program = data.program || '6В06301 – «Системы информационной безопасности»';
  const subject = data.subject || 'Дисциплина';
  const code = data.code || 'VBD 3213';

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Times New Roman',
            size: 28, // 14pt в docx = 28 half-points
            color: '000000', 
          },
          paragraph: {
            spacing: { line: 360, before: 0, after: 0 }
          }
        }
      }
    },
    sections: [{
      properties: {
        page: {
          margin: {
            top: 1440,   // 2.5 см
            right: 1134,  // 2 см
            bottom: 1440,
            left: 1701    
          }
        }
      },
      children: [
       
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 0, before: 0 },
          children: [
            new TextRun({
              text: 'НАО «КАРАГАНДИНСКИЙ ТЕХНИЧЕСКИЙ УНИВЕРСИТЕТ',
              bold: true,
              size: 32,
              color: '000000' // ЯВНО ЧЕРНЫЙ
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 480, before: 0 },
          children: [
            new TextRun({
              text: 'ИМЕНИ АБЫЛКАСА САГИНОВА»',
              bold: true,
              size: 32,
              color: '000000' // ЯВНО ЧЕРНЫЙ
            })
          ]
        }),

        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 240, before: 0 },
          children: [
            new TextRun({
              text: `Кафедра «${department}»`,
              bold: true,
              size: 28,
              color: '000000' // ЯВНО ЧЕРНЫЙ
            })
          ]
        }),

        new Paragraph({ spacing: { after: 720 } }),

        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 0, before: 0 },
          children: [
            new TextRun({
              text: teacher,
              bold: true,
              size: 32,
              color: '000000' // ЯВНО ЧЕРНЫЙ
            })
          ]
        }),

        new Paragraph({ spacing: { after: 480 } }),

        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 0, before: 0 },
          children: [
            new TextRun({
              text: 'МЕТОДИЧЕСКИЕ УКАЗАНИЯ',
              bold: true,
              size: 36,
              color: '000000' // ЯВНО ЧЕРНЫЙ
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 0, before: 0 },
          children: [
            new TextRun({
              text: 'для проведения самостоятельной работы студента/',
              bold: true,
              size: 28,
              color: '000000' // ЯВНО ЧЕРНЫЙ
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 0, before: 0 },
          children: [
            new TextRun({
              text: 'самостоятельной работы студента с преподавателем',
              bold: true,
              size: 28,
              color: '000000' // ЯВНО ЧЕРНЫЙ
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 240, before: 0 },
          children: [
            new TextRun({
              text: `по дисциплине ${code} «${subject}»`,
              bold: true,
              size: 28,
              color: '000000' // ЯВНО ЧЕРНЫЙ
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 240, before: 0 },
          children: [
            new TextRun({
              text: `для студентов образовательной программы ${program}`,
              size: 28,
              color: '000000' // ЯВНО ЧЕРНЫЙ
            })
          ]
        }),

        new Paragraph({ spacing: { after: 720 } }),

        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 0, before: 0 },
          children: [
            new TextRun({
              text: `Караганда ${year}`,
              size: 28,
              color: '000000' // ЯВНО ЧЕРНЫЙ
            })
          ]
        }),

        
        new Paragraph({ pageBreakBefore: true }),

        
        new Paragraph({ spacing: { after: 480 } }),
        new Paragraph({
          children: [
            new TextRun({
              text: 'Рассмотрена на заседании кафедры «Название»',
              size: 24,
              color: '000000' // ЯВНО ЧЕРНЫЙ
            })
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: 'Протокол №      от «   »         .  2025 г.',
              size: 24,
              color: '000000' // ЯВНО ЧЕРНЫЙ
            })
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: 'Зав. кафедрой _________  ФИО   «____»________2025г.',
              size: 24,
              color: '000000' // ЯВНО ЧЕРНЫЙ
            })
          ]
        }),
        new Paragraph({ spacing: { after: 240 } }),
        new Paragraph({
          children: [
            new TextRun({
              text: 'Одобрена (Указать)',
              size: 24,
              color: '000000' // ЯВНО ЧЕРНЫЙ
            })
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: 'Протокол №       от «   »     . 2025 г.',
              size: 24,
              color: '000000' // ЯВНО ЧЕРНЫЙ
            })
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: 'Председатель _________  ФИО  «____»_______ 2025 г.',
              size: 24,
              color: '000000' // ЯВНО ЧЕРНЫЙ
            })
          ]
        }),

        new Paragraph({ spacing: { after: 480 } }),
        new Paragraph({ pageBreakBefore: true }),

        
        new Paragraph({
          heading: docx.HeadingLevel.HEADING_1,
          spacing: { after: 240, before: 0 },
          children: [
            new TextRun({
              text: '1. Тематический план самостоятельной работы студента с преподавателем',
              bold: true,
              size: 28,
              color: '000000' // ЯВНО ЧЕРНЫЙ
            })
          ]
        }),

        createSROPTable(data.sropPlan || []),

        new Paragraph({ spacing: { after: 480 } }),

      
        new Paragraph({
          heading: docx.HeadingLevel.HEADING_1,
          spacing: { after: 240, before: 0 },
          children: [
            new TextRun({
              text: '2. Темы контрольных заданий для СРО',
              bold: true,
              size: 28,
              color: '000000' // ЯВНО ЧЕРНЫЙ
            })
          ]
        }),

        // Подраздел 2.1
        new Paragraph({
          heading: docx.HeadingLevel.HEADING_2,
          spacing: { after: 120, before: 240 },
          children: [
            new TextRun({
              text: '2.1 Творческие и исследовательские задания',
              bold: true,
              size: 28,
              color: '000000' // ЯВНО ЧЕРНЫЙ
            })
          ]
        }),

        ...(data.creativeTasks || []).map(task => 
          new Paragraph({
            spacing: { after: 120, before: 0 },
            indent: { left: 720 }, // отступ 0.5 см
            children: [
              new TextRun({
                text: task,
                size: 26,
                color: '000000' // ЯВНО ЧЕРНЫЙ
              })
            ]
          })
        ),

        new Paragraph({ spacing: { after: 240 } }),

        // Подраздел 2.2
        new Paragraph({
          heading: docx.HeadingLevel.HEADING_2,
          spacing: { after: 120, before: 240 },
          children: [
            new TextRun({
              text: '2.2 Контрольные вопросы для СРО',
              bold: true,
              size: 28,
              color: '000000' // ЯВНО ЧЕРНЫЙ
            })
          ]
        }),

        ...(data.controlQuestions || []).map(question => 
          new Paragraph({
            spacing: { after: 80, before: 0 },
            indent: { left: 720 },
            children: [
              new TextRun({
                text: question,
                size: 26,
                color: '000000' // ЯВНО ЧЕРНЫЙ
              })
            ]
          })
        ),

        new Paragraph({ spacing: { after: 480 } }),

    
        new Paragraph({
          heading: docx.HeadingLevel.HEADING_1,
          spacing: { after: 240, before: 0 },
          children: [
            new TextRun({
              text: 'Список рекомендуемой литературы',
              bold: true,
              size: 28,
              color: '000000' // ЯВНО ЧЕРНЫЙ
            })
          ]
        }),

        new Paragraph({
          spacing: { after: 120, before: 120 },
          children: [
            new TextRun({
              text: 'Основная литература:',
              bold: true,
              size: 28,
              color: '000000' // ЯВНО ЧЕРНЫЙ
            })
          ]
        }),

        ...(data.mainLiterature || []).map((book, index) => 
          new Paragraph({
            spacing: { after: 80, before: 0 },
            indent: { left: 720 },
            children: [
              new TextRun({
                text: `${index + 1}. ${book}`,
                size: 26,
                color: '000000' // ЯВНО ЧЕРНЫЙ
              })
            ]
          })
        ),

        new Paragraph({
          spacing: { after: 120, before: 240 },
          children: [
            new TextRun({
              text: 'Дополнительная литература:',
              bold: true,
              size: 28,
              color: '000000' // ЯВНО ЧЕРНЫЙ
            })
          ]
        }),

        ...(data.additionalLiterature || []).map((book, index) => 
          new Paragraph({
            spacing: { after: 80, before: 0 },
            indent: { left: 720 },
            children: [
              new TextRun({
                text: `${index + 1}. ${book}`,
                size: 26,
                color: '000000' // ЯВНО ЧЕРНЫЙ
              })
            ]
          })
        )
      ]
    }]
  });

  return await docx.Packer.toBuffer(doc);
}



function createSROPTable(sropPlan) {
  const rows = [];


  rows.push(new TableRow({
    children: [
      createHeaderCell('Наименование темы СРОП', 4000),
      createHeaderCell('Цель занятия', 2500),
      createHeaderCell('Форма проведения занятия', 2000),
      createHeaderCell('Содержание задания', 4000),
      createHeaderCell('Рекомендуемая литература', 1800)
    ]
  }));


  sropPlan.forEach((item, index) => {
   
    const taskLines = (item.task || '').split('\n');
    
    rows.push(new TableRow({
      children: [
        createCell(item.theme || `Тема ${index + 1}`, 'left'),
        createCell(item.goal || '', 'left'),
        createCell(item.form || 'Индивидуальное консультирование', 'left'),
        createCellWithLines(taskLines),
        createCell(item.literature || '', 'center')
      ]
    }));
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 2, color: '000000' },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: '000000' },
      left: { style: BorderStyle.SINGLE, size: 2, color: '000000' },
      right: { style: BorderStyle.SINGLE, size: 2, color: '000000' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: '000000' }
    }
  });
}



function createHeaderCell(text, width) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    verticalAlign: VerticalAlign.CENTER,
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: text,
            bold: true,
            size: 24,
            font: 'Times New Roman',
            color: '000000' // ЯВНО ЧЕРНЫЙ
          })
        ]
      })
    ],
    borders: {
      top: { style: BorderStyle.SINGLE, size: 2, color: '000000' },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: '000000' },
      left: { style: BorderStyle.SINGLE, size: 2, color: '000000' },
      right: { style: BorderStyle.SINGLE, size: 2, color: '000000' }
    }
  });
}

function createCell(text, align = 'left') {
  const alignment = align === 'center' ? AlignmentType.CENTER : 
                   align === 'right' ? AlignmentType.RIGHT : 
                   AlignmentType.LEFT;

  return new TableCell({
    verticalAlign: VerticalAlign.CENTER,
    children: [
      new Paragraph({
        alignment: alignment,
        children: [
          new TextRun({
            text: text || '',
            size: 24,
            font: 'Times New Roman',
            color: '000000' // ЯВНО ЧЕРНЫЙ
          })
        ]
      })
    ],
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
      left: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
      right: { style: BorderStyle.SINGLE, size: 1, color: '000000' }
    }
  });
}

function createCellWithLines(lines) {
  const children = [];
  
  lines.forEach((line, index) => {
    if (line.trim()) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { after: index === lines.length - 1 ? 0 : 80 },
          children: [
            new TextRun({
              text: line.trim(),
              size: 24,
              font: 'Times New Roman',
              color: '000000' // ЯВНО ЧЕРНЫЙ
            })
          ]
        })
      );
    }
  });

  return new TableCell({
    verticalAlign: VerticalAlign.CENTER,
    children: children.length > 0 ? children : [new Paragraph({ children: [new TextRun('')] })],
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
      left: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
      right: { style: BorderStyle.SINGLE, size: 1, color: '000000' }
    }
  });
}

module.exports = { createSROFullDocument };