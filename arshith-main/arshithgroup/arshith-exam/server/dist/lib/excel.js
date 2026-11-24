import ExcelJS from 'exceljs';
import { Readable } from 'node:stream';
import { badRequest } from './errors.js';
function cellText(v) {
    if (v == null)
        return '';
    if (v instanceof Date)
        return v.toISOString();
    if (typeof v === 'object') {
        if ('richText' in v)
            return v.richText.map((r) => r.text).join('');
        if ('text' in v)
            return String(v.text);
        if ('result' in v)
            return String(v.result ?? '');
    }
    return String(v);
}
/** Parses an uploaded .xlsx or .csv into row objects keyed by a normalised (lower-case, no spaces) header. */
export async function parseSheet(file) {
    const wb = new ExcelJS.Workbook();
    const name = file.originalname.toLowerCase();
    if (!name.endsWith('.csv') && !name.endsWith('.xlsx'))
        throw badRequest('Only .xlsx and .csv files are supported');
    try {
        if (name.endsWith('.csv'))
            await wb.csv.read(Readable.from(file.buffer));
        else
            await wb.xlsx.load(file.buffer);
    }
    catch {
        throw badRequest('The file could not be read. Make sure it is a valid .xlsx or .csv file.');
    }
    const ws = wb.worksheets[0];
    if (!ws)
        throw badRequest('The file contains no sheets');
    const headers = [];
    ws.getRow(1).eachCell((c, i) => {
        headers[i] = cellText(c.value).trim().toLowerCase().replace(/[\s_-]+/g, '');
    });
    const rows = [];
    ws.eachRow((row, n) => {
        if (n === 1)
            return;
        const obj = {};
        let any = false;
        headers.forEach((h, i) => {
            if (!h)
                return;
            const v = cellText(row.getCell(i).value).trim();
            if (v)
                any = true;
            obj[h] = v;
        });
        if (any)
            rows.push(obj);
    });
    return rows;
}
export function buildWorkbook(sheetName, columns, rows) {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(sheetName);
    ws.columns = columns.map((c) => ({ ...c, width: c.width ?? 18 }));
    ws.addRows(rows);
    const head = ws.getRow(1);
    head.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    head.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF12352C' } };
    ws.views = [{ state: 'frozen', ySplit: 1 }];
    return wb;
}
export async function sendWorkbook(res, wb, filename, format) {
    if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
        await wb.csv.write(res);
    }
    else {
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
        await wb.xlsx.write(res);
    }
    res.end();
}
/** A clean, print-ready ranked sheet: title, one header row, zebra rows, Pass/Fail colours and the top three highlighted. */
export function buildRankedWorkbook(opts) {
    const wb = new ExcelJS.Workbook();
    wb.calcProperties.fullCalcOnLoad = true;
    const ws = wb.addWorksheet('Ranked list', { pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 } });
    const n = opts.columns.length;
    const GREEN = 'FF05361F', CREAM = 'FFF5F0E4', LINE = 'FFE1D8C3';
    ws.columns = opts.columns.map((c) => ({ key: c.key, width: c.width ?? 14 }));
    ws.mergeCells(1, 1, 1, n);
    ws.getCell(1, 1).value = opts.title;
    ws.getCell(1, 1).font = { bold: true, size: 15, color: { argb: GREEN } };
    ws.getRow(1).height = 24;
    ws.mergeCells(2, 1, 2, n);
    ws.getCell(2, 1).value = opts.subtitle;
    ws.getCell(2, 1).font = { size: 10, color: { argb: 'FF5B6B64' } };
    const FIRST = 5, last = Math.max(FIRST, FIRST + opts.rows.length - 1);
    const letter = (key) => ws.getColumn(opts.columns.findIndex((c) => c.key === key) + 1).letter;
    const [TOTAL, OUTOF, PCT, RESULT] = ['obtainedMarks', 'totalMarks', 'percentage', 'resultText'].map(letter);
    const pcts = `'Ranked list'!$${PCT}$${FIRST}:$${PCT}$${last}`, results = `'Ranked list'!$${RESULT}$${FIRST}:$${RESULT}$${last}`;
    const values = opts.rows.map((r) => Number(r.percentage));
    const passed = opts.rows.filter((r) => r.resultText === 'PASS').length;
    const r2 = (v) => Math.round(v * 100) / 100;
    const average = values.length ? r2(values.reduce((a, v) => a + v, 0) / values.length) : 0;
    const highest = values.length ? Math.max(...values) : 0, lowest = values.length ? Math.min(...values) : 0;
    // The pass mark lives on the Summary sheet; every Result and the totals are live formulas that read from it.
    const sum = wb.addWorksheet('Summary');
    sum.columns = [{ width: 24 }, { width: 14 }];
    sum.getCell('A1').value = 'Summary';
    sum.getCell('A1').font = { bold: true, size: 14, color: { argb: GREEN } };
    [
        ['Pass mark (%)', opts.passPercent, '0.00'],
        ['Students', { formula: `COUNT(${pcts})`, result: values.length }, '0'],
        ['Passed', { formula: `COUNTIF(${results},"PASS")`, result: passed }, '0'],
        ['Failed', { formula: `COUNTIF(${results},"FAIL")`, result: values.length - passed }, '0'],
        ['Average percentage', { formula: `IFERROR(ROUND(AVERAGE(${pcts}),2),0)`, result: average }, '0.00"%"'],
        ['Highest percentage', { formula: `MAX(${pcts})`, result: highest }, '0.00"%"'],
        ['Lowest percentage', { formula: `MIN(${pcts})`, result: lowest }, '0.00"%"'],
    ].forEach(([label, value, fmt], i) => {
        sum.getCell(3 + i, 1).value = label;
        sum.getCell(3 + i, 1).font = { bold: true };
        sum.getCell(3 + i, 2).value = value;
        sum.getCell(3 + i, 2).numFmt = fmt;
    });
    ws.mergeCells(3, 1, 3, n);
    ws.getCell(3, 1).value = {
        formula: `"Students "&Summary!$B$4&"  |  Pass mark "&Summary!$B$3&"%  |  Passed "&Summary!$B$5&"  |  Failed "&Summary!$B$6&"  |  Average "&TEXT(Summary!$B$7,"0.00")&"%  |  Highest "&TEXT(Summary!$B$8,"0.00")&"%  |  Lowest "&TEXT(Summary!$B$9,"0.00")&"%"`,
        result: `Students ${values.length}  |  Pass mark ${opts.passPercent}%  |  Passed ${passed}  |  Failed ${values.length - passed}  |  Average ${average.toFixed(2)}%  |  Highest ${highest.toFixed(2)}%  |  Lowest ${lowest.toFixed(2)}%`,
    };
    ws.getCell(3, 1).font = { bold: true, size: 11, color: { argb: GREEN } };
    const head = ws.getRow(4);
    opts.columns.forEach((c, i) => { head.getCell(i + 1).value = c.header; });
    head.height = 22;
    head.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GREEN } };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    });
    const medal = ['FFF6E7B8', 'FFE8E8E8', 'FFF1D9C4'];
    opts.rows.forEach((r, idx) => {
        const row = ws.getRow(5 + idx);
        opts.columns.forEach((c, i) => {
            const cell = row.getCell(i + 1);
            const rn = row.number;
            // percentage = obtained / total x 100; PASS when percentage >= pass mark (a score below the pass mark never rounds up to PASS)
            if (c.key === 'percentage')
                cell.value = { formula: `IF(${OUTOF}${rn}>0,ROUND(${TOTAL}${rn}/${OUTOF}${rn}*100,2),0)`, result: r.percentage };
            else if (c.key === 'resultText')
                cell.value = { formula: `IF(AND(${OUTOF}${rn}>0,${TOTAL}${rn}/${OUTOF}${rn}*100>=Summary!$B$3),"PASS","FAIL")`, result: r.resultText };
            else
                cell.value = r[c.key];
            cell.border = { bottom: { style: 'thin', color: { argb: LINE } } };
            cell.alignment = { vertical: 'middle', horizontal: c.kind === 'text' || !c.kind ? 'left' : 'center' };
            if (c.kind === 'pct')
                cell.numFmt = '0.00"%"';
            if (c.kind === 'result')
                cell.font = { bold: true };
            else if (idx < 3)
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: medal[idx] } };
            else if (idx % 2)
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: CREAM } };
        });
        row.height = 19;
    });
    // colours follow the formula, so they stay right if the pass mark is changed in the sheet
    ws.addConditionalFormatting({
        ref: `${RESULT}${FIRST}:${RESULT}${last}`,
        rules: [
            { type: 'expression', priority: 1, formulae: [`${RESULT}${FIRST}="PASS"`], style: { font: { bold: true, color: { argb: 'FF0F6040' } }, fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFDCEFE3' } } } },
            { type: 'expression', priority: 2, formulae: [`${RESULT}${FIRST}="FAIL"`], style: { font: { bold: true, color: { argb: 'FFB42318' } }, fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFFBE4E1' } } } },
        ],
    });
    ws.autoFilter = { from: { row: 4, column: 1 }, to: { row: last, column: n } };
    ws.views = [{ state: 'frozen', ySplit: 4, xSplit: 2 }];
    return wb;
}
