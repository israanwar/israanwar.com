const EXPORT_THEMES = {
  terracotta: { ink: "2C2522", accent: "B84F31", soft: "F5EBE6" },
  midnight: { ink: "17233C", accent: "3157A4", soft: "E9EEF8" },
  forest: { ink: "19382D", accent: "2E765A", soft: "E7F1EC" },
  plum: { ink: "3F2341", accent: "8A4D82", soft: "F3EAF2" },
  graphite: { ink: "272B30", accent: "626A73", soft: "ECEEF0" },
};

function exportTheme(invoice) {
  if (invoice.theme === "custom" && invoice.customTheme) {
    const normalise = (value, fallback) => /^#[0-9a-f]{6}$/i.test(value ?? "") ? value.slice(1).toUpperCase() : fallback;
    return {
      ink: normalise(invoice.customTheme.ink, EXPORT_THEMES.terracotta.ink),
      accent: normalise(invoice.customTheme.accent, EXPORT_THEMES.terracotta.accent),
      soft: normalise(invoice.customTheme.soft, EXPORT_THEMES.terracotta.soft),
    };
  }
  return EXPORT_THEMES[invoice.theme] ?? EXPORT_THEMES.terracotta;
}

const EXPORT_FONT_NAMES = {
  system: "Calibri",
  jakarta: "Plus Jakarta Sans",
  cormorant: "Cormorant Garamond",
  georgia: "Georgia",
  mono: "Courier New",
};

const EXPORT_FONT_SCALES = { compact: 0.88, standard: 1, large: 1.18 };

function exportTypography(invoice) {
  return {
    fontName: EXPORT_FONT_NAMES[invoice.fontFamily] ?? EXPORT_FONT_NAMES.system,
    scale: EXPORT_FONT_SCALES[invoice.fontSize] ?? 1,
    bold: Boolean(invoice.bold),
    italic: Boolean(invoice.italic),
  };
}

export function paginateInvoiceItems(items, itemsPerPage = 8) {
  const pages = [];
  for (let index = 0; index < items.length; index += itemsPerPage) pages.push(items.slice(index, index + itemsPerPage));
  return pages.length ? pages : [[]];
}

function safeFilename(value, fallback = "invoice") {
  return String(value || fallback)
    .trim()
    .replace(/[^a-z0-9._-]+/gi, "-")
    .replace(/^-+|-+$/g, "") || fallback;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function text(value) {
  return String(value ?? "").trim();
}

function csvCell(value) {
  const output = String(value ?? "");
  return /[",\r\n]/.test(output) ? `"${output.replaceAll('"', '""')}"` : output;
}

function moneyValue(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function exportInvoiceJson(invoice, totals) {
  const payload = {
    schema: "israanwar.invoice.v1",
    exportedAt: new Date().toISOString(),
    document: invoice,
    totals,
  };
  downloadBlob(
    new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" }),
    `${safeFilename(invoice.number)}.json`,
  );
}

export function exportInvoiceCsv(invoice, totals) {
  const rows = [
    ["Document type", invoice.type],
    ["Document number", invoice.number],
    ["Currency", invoice.currency],
    ["Issue date", invoice.issuedAt],
    [invoice.type === "quote" ? "Valid until" : "Due date", invoice.dueAt],
    ["From", invoice.issuer.name],
    ["Bill to", invoice.client.name],
    [],
    ["Description", "Quantity", "Rate", "Amount"],
    ...invoice.items.map((item) => [item.description, moneyValue(item.quantity), moneyValue(item.rate), moneyValue(item.quantity) * moneyValue(item.rate)]),
    [],
    ["Subtotal", totals.subtotal],
    ["Discount", totals.discount],
    ["Tax", totals.tax],
    ["Shipping / fee", moneyValue(invoice.shipping)],
    ["Total", totals.total],
  ];
  const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
  downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8" }), `${safeFilename(invoice.number)}.csv`);
}

export async function exportInvoiceWord(invoice, totals, formatMoney) {
  const {
    AlignmentType, BorderStyle, Document, HeadingLevel, Packer, Paragraph,
    ShadingType, Table, TableCell, TableRow, TextRun, WidthType,
  } = await import("docx");
  const theme = exportTheme(invoice);
  const typo = exportTypography(invoice);
  const sz = (base) => Math.round(base * typo.scale);

  const borders = {
    top: { style: BorderStyle.SINGLE, size: 1, color: "D9E2EC" },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: "D9E2EC" },
    left: { style: BorderStyle.SINGLE, size: 1, color: "D9E2EC" },
    right: { style: BorderStyle.SINGLE, size: 1, color: "D9E2EC" },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "D9E2EC" },
    insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "D9E2EC" },
  };
  const cell = (value, options = {}) => new TableCell({
    borders,
    shading: options.header ? { fill: theme.ink, type: ShadingType.CLEAR } : undefined,
    width: options.width ? { size: options.width, type: WidthType.PERCENTAGE } : undefined,
    children: [new Paragraph({
      alignment: options.align ?? AlignmentType.LEFT,
      children: [new TextRun({ text: String(value ?? ""), bold: options.bold || options.header || typo.bold, italic: typo.italic, color: options.header ? "FFFFFF" : theme.ink, size: options.header ? sz(19) : sz(18) })],
    })],
  });

  const itemRows = invoice.items.map((item) => new TableRow({
    children: [
      cell(item.description, { width: 48 }),
      cell(moneyValue(item.quantity), { align: AlignmentType.RIGHT, width: 12 }),
      cell(formatMoney(moneyValue(item.rate)), { align: AlignmentType.RIGHT, width: 20 }),
      cell(formatMoney(moneyValue(item.quantity) * moneyValue(item.rate)), { align: AlignmentType.RIGHT, width: 20 }),
    ],
  }));

  const totalRows = [
    ["Subtotal", formatMoney(totals.subtotal)],
    ...(totals.discount ? [["Discount", `- ${formatMoney(totals.discount)}`]] : []),
    ...(totals.tax ? [[`Tax (${moneyValue(invoice.tax)}%)`, formatMoney(totals.tax)]] : []),
    ...(moneyValue(invoice.shipping) ? [["Shipping / fee", formatMoney(moneyValue(invoice.shipping))]] : []),
    ["Total", formatMoney(totals.total)],
  ];

  const doc = new Document({
    creator: "Isra Anwar Invoice Builder",
    title: `${invoice.type === "quote" ? "Quotation" : "Invoice"} ${invoice.number}`,
    sections: [{
      properties: { page: { margin: { top: 900, right: 900, bottom: 900, left: 900 } } },
      children: [
        new Paragraph({
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: invoice.type === "quote" ? "QUOTATION" : "INVOICE", bold: true, italic: typo.italic, color: theme.ink, size: sz(44) })],
        }),
        new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: text(invoice.number), bold: true, italic: typo.italic, color: theme.accent, size: sz(20) })] }),
        new Paragraph({ children: [new TextRun({ text: text(invoice.issuer.name) || "Your business", bold: true, italic: typo.italic, size: sz(28), color: theme.ink })] }),
        new Paragraph({ children: [new TextRun({ text: [invoice.issuer.email, invoice.issuer.phone, invoice.issuer.address].filter(text).join(" · "), bold: typo.bold, italic: typo.italic, color: "52667A", size: sz(18) })] }),
        new Paragraph({ spacing: { before: 360 }, children: [new TextRun({ text: "BILL TO", bold: true, italic: typo.italic, color: theme.accent, size: sz(18) })] }),
        new Paragraph({ children: [new TextRun({ text: text(invoice.client.name), bold: true, italic: typo.italic, size: sz(23), color: theme.ink })] }),
        new Paragraph({ children: [new TextRun({ text: [invoice.client.email, invoice.client.phone, invoice.client.address].filter(text).join(" · "), bold: typo.bold, italic: typo.italic, color: "52667A", size: sz(18) })] }),
        new Paragraph({ spacing: { before: 180 }, children: [new TextRun({ text: `Issue date: ${invoice.issuedAt}    ${invoice.type === "quote" ? "Valid until" : "Due date"}: ${invoice.dueAt}`, bold: typo.bold, italic: typo.italic, color: "52667A", size: sz(18) })] }),
        new Paragraph({ spacing: { before: 360 } }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ tableHeader: true, children: [cell("Description", { header: true, width: 48 }), cell("Qty", { header: true, align: AlignmentType.RIGHT, width: 12 }), cell("Rate", { header: true, align: AlignmentType.RIGHT, width: 20 }), cell("Amount", { header: true, align: AlignmentType.RIGHT, width: 20 })] }),
            ...itemRows,
          ],
        }),
        new Paragraph({ spacing: { before: 260 } }),
        new Table({
          alignment: AlignmentType.RIGHT,
          width: { size: 44, type: WidthType.PERCENTAGE },
          rows: totalRows.map(([label, value], index) => new TableRow({ children: [cell(label, { bold: index === totalRows.length - 1, width: 45 }), cell(value, { bold: index === totalRows.length - 1, align: AlignmentType.RIGHT, width: 55 })] })),
        }),
        ...(text(invoice.notes) ? [new Paragraph({ spacing: { before: 360 }, children: [new TextRun({ text: "NOTES", bold: true, italic: typo.italic, color: theme.accent, size: sz(18) })] }), new Paragraph({ children: [new TextRun({ text: text(invoice.notes), bold: typo.bold, italic: typo.italic, color: "52667A", size: sz(18) })] })] : []),
        ...(text(invoice.paymentDetails) ? [new Paragraph({ spacing: { before: 220 }, children: [new TextRun({ text: "PAYMENT DETAILS", bold: true, italic: typo.italic, color: theme.accent, size: sz(18) })] }), new Paragraph({ children: [new TextRun({ text: text(invoice.paymentDetails), bold: typo.bold, italic: typo.italic, color: "52667A", size: sz(18) })] })] : []),
      ],
    }],
    styles: { default: { document: { run: { font: typo.fontName, size: sz(20), bold: typo.bold, italic: typo.italic }, paragraph: { spacing: { after: 90 } } } } },
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, `${safeFilename(invoice.number)}.docx`);
}

export async function exportInvoiceExcel(invoice, totals) {
  const module = await import("exceljs/dist/exceljs.min.js");
  const ExcelJS = module.default ?? module;
  const theme = exportTheme(invoice);
  const typo = exportTypography(invoice);
  const mergeFont = (base = {}) => ({ ...base, name: typo.fontName, size: Math.round((base.size ?? 11) * typo.scale), bold: base.bold || typo.bold, italic: typo.italic });
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Isra Anwar Invoice Builder";
  workbook.created = new Date();
  const sheet = workbook.addWorksheet(invoice.type === "quote" ? "Quotation" : "Invoice", {
    views: [{ state: "frozen", ySplit: 8 }],
    pageSetup: { paperSize: 9, orientation: "portrait", fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });
  sheet.columns = [
    { key: "description", width: 42 },
    { key: "quantity", width: 14 },
    { key: "rate", width: 20 },
    { key: "amount", width: 22 },
  ];
  sheet.mergeCells("A1:D1");
  sheet.getCell("A1").value = `${invoice.type === "quote" ? "QUOTATION" : "INVOICE"} ${text(invoice.number)}`;
  sheet.getCell("A1").font = mergeFont({ bold: true, size: 20, color: { argb: "FFFFFFFF" } });
  sheet.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${theme.ink}` } };
  sheet.getCell("A1").alignment = { vertical: "middle", horizontal: "left" };
  sheet.getRow(1).height = 34;
  [
    ["A3", "From", "B3", invoice.issuer.name],
    ["A4", "Bill to", "B4", invoice.client.name],
    ["A5", "Issue date", "B5", invoice.issuedAt],
    ["C5", invoice.type === "quote" ? "Valid until" : "Due date", "D5", invoice.dueAt],
    ["A6", "Currency", "B6", invoice.currency],
  ].forEach(([labelCell, label, valueCell, value]) => {
    sheet.getCell(labelCell).value = label;
    sheet.getCell(labelCell).font = mergeFont({ bold: true, color: { argb: `FF${theme.ink}` } });
    sheet.getCell(valueCell).value = value;
    sheet.getCell(valueCell).font = mergeFont();
  });
  const header = sheet.getRow(8);
  header.values = ["Description", "Quantity", "Rate", "Amount"];
  header.eachCell((cell) => {
    cell.font = mergeFont({ bold: true, color: { argb: "FFFFFFFF" } });
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${theme.ink}` } };
    cell.alignment = { vertical: "middle" };
  });
  invoice.items.forEach((item) => {
    const row = sheet.addRow({ description: item.description, quantity: moneyValue(item.quantity), rate: moneyValue(item.rate), amount: moneyValue(item.quantity) * moneyValue(item.rate) });
    row.getCell(4).value = { formula: `B${row.number}*C${row.number}`, result: moneyValue(item.quantity) * moneyValue(item.rate) };
    row.font = mergeFont();
  });
  const firstTotalRow = sheet.rowCount + 2;
  const totalLines = [
    ["Subtotal", totals.subtotal],
    ...(totals.discount ? [["Discount", -totals.discount]] : []),
    ...(totals.tax ? [[`Tax (${moneyValue(invoice.tax)}%)`, totals.tax]] : []),
    ...(moneyValue(invoice.shipping) ? [["Shipping / fee", moneyValue(invoice.shipping)]] : []),
    ["Total", totals.total],
  ];
  totalLines.forEach(([label, value], index) => {
    const row = sheet.getRow(firstTotalRow + index);
    row.getCell(3).value = label;
    row.getCell(4).value = value;
    row.font = index === totalLines.length - 1 ? mergeFont({ bold: true, color: { argb: `FF${theme.ink}` } }) : mergeFont();
    if (index === totalLines.length - 1) {
      row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${theme.soft}` } };
    }
  });
  [3, 4].forEach((column) => { sheet.getColumn(column).numFmt = `\"${invoice.currency}\" #,##0.00`; });
  sheet.autoFilter = { from: "A8", to: `D${8 + invoice.items.length}` };
  const notesRow = firstTotalRow + totalLines.length + 2;
  if (text(invoice.notes)) {
    sheet.getCell(`A${notesRow}`).value = "Notes";
    sheet.getCell(`A${notesRow}`).font = mergeFont({ bold: true });
    sheet.getCell(`B${notesRow}`).value = invoice.notes;
    sheet.getCell(`B${notesRow}`).font = mergeFont();
  }
  if (text(invoice.paymentDetails)) {
    sheet.getCell(`A${notesRow + 1}`).value = "Payment details";
    sheet.getCell(`A${notesRow + 1}`).font = mergeFont({ bold: true });
    sheet.getCell(`B${notesRow + 1}`).value = invoice.paymentDetails;
    sheet.getCell(`B${notesRow + 1}`).font = mergeFont();
  }
  const buffer = await workbook.xlsx.writeBuffer();
  downloadBlob(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `${safeFilename(invoice.number)}.xlsx`);
}
