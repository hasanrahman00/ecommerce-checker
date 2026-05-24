const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const xlsx = require('xlsx');

function parseFile(filePath, originalName) {
  const ext = path.extname(originalName || filePath).toLowerCase();
  if (ext === '.csv') return parseCsv(filePath);
  if (ext === '.xlsx' || ext === '.xls') return parseExcel(filePath);
  throw new Error(`Unsupported file format "${ext || 'unknown'}". Use CSV or Excel.`);
}

function parseCsv(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  return parse(raw, { columns: true, skip_empty_lines: true, trim: true });
}

function parseExcel(filePath) {
  const wb = xlsx.readFile(filePath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  return xlsx.utils.sheet_to_json(sheet, { defval: '' });
}

module.exports = { parseFile };
