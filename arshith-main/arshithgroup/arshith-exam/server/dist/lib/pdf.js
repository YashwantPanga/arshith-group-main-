import PDFDocument from 'pdfkit';
import { config } from '../config.js';
const GREEN = '#05361f';
const GOLD = '#b31b76';
const INK = '#1f2937';
const MUTED = '#6b7280';
const LINE = '#e5e7eb';
const CREAM = '#f8f5ee';
export function newDoc(res, filename, title) {
    const doc = new PDFDocument({ size: 'A4', margin: 40, info: { Title: title, Author: config.ORG_NAME }, bufferPages: true });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
    doc.pipe(res);
    return doc;
}
export function header(doc, title, subtitle) {
    const w = doc.page.width;
    doc.rect(0, 0, w, 74).fill(GREEN);
    doc.rect(0, 74, w, 3).fill(GOLD);
    doc.fillColor('#ffffff').font('Times-Bold').fontSize(20).text(config.ORG_NAME, 40, 22, { lineBreak: false });
    doc.font('Helvetica').fontSize(8).fillColor('#cbd5c9').text(config.ORG_TAGLINE.toUpperCase(), 40, 48, { characterSpacing: 1.5, lineBreak: false });
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#ffffff').text(title, 240, 26, { width: w - 280, align: 'right', lineBreak: false });
    if (subtitle)
        doc.font('Helvetica').fontSize(8.5).fillColor('#cbd5c9').text(subtitle, 240, 44, { width: w - 280, align: 'right', lineBreak: false });
    doc.fillColor(INK);
    doc.y = 96;
    doc.x = 40;
}
export function sectionTitle(doc, text) {
    if (doc.y > doc.page.height - 140)
        doc.addPage();
    doc.moveDown(0.6);
    doc.font('Times-Bold').fontSize(13).fillColor(GREEN).text(text, 40, doc.y);
    const y = doc.y + 2;
    doc.moveTo(40, y).lineTo(doc.page.width - 40, y).lineWidth(0.8).strokeColor(GOLD).stroke();
    doc.y = y + 8;
    doc.fillColor(INK);
}
/** Two-column key/value grid. */
export function keyValues(doc, pairs, cols = 2) {
    const usable = doc.page.width - 80;
    const colW = usable / cols;
    const rowH = 34;
    const startY = doc.y;
    pairs.forEach(([k, v], i) => {
        const x = 40 + (i % cols) * colW;
        const y = startY + Math.floor(i / cols) * rowH;
        doc.font('Helvetica').fontSize(7.5).fillColor(MUTED).text(k.toUpperCase(), x, y, { width: colW - 10, characterSpacing: 0.6, lineBreak: false });
        doc.font('Helvetica-Bold').fontSize(10.5).fillColor(INK).text(v || '—', x, y + 11, { width: colW - 10, ellipsis: true, lineBreak: false });
    });
    doc.y = startY + Math.ceil(pairs.length / cols) * rowH;
    doc.x = 40;
}
export function statCards(doc, cards) {
    const usable = doc.page.width - 80;
    const gap = 10;
    const w = (usable - gap * (cards.length - 1)) / cards.length;
    const y = doc.y;
    cards.forEach((c, i) => {
        const x = 40 + i * (w + gap);
        doc.roundedRect(x, y, w, 52, 6).fill(c.accent ? GREEN : CREAM);
        doc.font('Helvetica').fontSize(7.5).fillColor(c.accent ? '#cbd5c9' : MUTED).text(c.label.toUpperCase(), x + 10, y + 9, { width: w - 20, characterSpacing: 0.6, lineBreak: false });
        doc.font('Times-Bold').fontSize(18).fillColor(c.accent ? '#ffffff' : GREEN).text(c.value, x + 10, y + 24, { width: w - 20, lineBreak: false });
    });
    doc.y = y + 64;
    doc.x = 40;
    doc.fillColor(INK);
}
export function table(doc, cols, rows, opts = {}) {
    const rowH = opts.rowH ?? 20;
    const total = cols.reduce((s, c) => s + c.width, 0);
    const drawHead = () => {
        const y = doc.y;
        doc.rect(40, y, total, rowH).fill(GREEN);
        let x = 40;
        doc.font('Helvetica-Bold').fontSize(8).fillColor('#ffffff');
        for (const c of cols) {
            doc.text(c.label, x + 5, y + 6, { width: c.width - 10, align: c.align ?? 'left', lineBreak: false, ellipsis: true });
            x += c.width;
        }
        doc.y = y + rowH;
    };
    drawHead();
    rows.forEach((r, ri) => {
        if (doc.y + rowH > doc.page.height - 50) {
            doc.addPage();
            doc.y = 50;
            drawHead();
        }
        const y = doc.y;
        if (ri % 2 === 0)
            doc.rect(40, y, total, rowH).fill(CREAM);
        let x = 40;
        doc.font('Helvetica').fontSize(8.5).fillColor(INK);
        r.forEach((cell, ci) => { doc.text(cell, x + 5, y + 6, { width: cols[ci].width - 10, align: cols[ci].align ?? 'left', lineBreak: false, ellipsis: true }); x += cols[ci].width; });
        doc.moveTo(40, y + rowH).lineTo(40 + total, y + rowH).lineWidth(0.3).strokeColor(LINE).stroke();
        doc.y = y + rowH;
    });
    doc.x = 40;
    doc.moveDown(0.5);
}
export function badge(doc, text, ok, x, y) {
    const w = doc.widthOfString(text) + 22;
    doc.roundedRect(x, y, w, 20, 10).fill(ok ? '#dcfce7' : '#fee2e2');
    doc.font('Helvetica-Bold').fontSize(9).fillColor(ok ? '#166534' : '#991b1b').text(text, x, y + 6, { width: w, align: 'center', lineBreak: false });
    doc.fillColor(INK);
}
export function finish(doc, note) {
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
        doc.switchToPage(range.start + i);
        const y = doc.page.height - 30;
        doc.moveTo(40, y - 6).lineTo(doc.page.width - 40, y - 6).lineWidth(0.5).strokeColor(LINE).stroke();
        doc.font('Helvetica').fontSize(7.5).fillColor(MUTED);
        doc.text(`${note} · Generated ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`, 40, y, { width: 400, lineBreak: false });
        doc.text(`Page ${i + 1} of ${range.count}`, doc.page.width - 140, y, { width: 100, align: 'right', lineBreak: false });
    }
    doc.end();
}
export const fmtDur = (sec) => `${Math.floor(sec / 60)}m ${String(sec % 60).padStart(2, '0')}s`;
export const fmtDt = (d) => (d ? d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' }) : '—');
