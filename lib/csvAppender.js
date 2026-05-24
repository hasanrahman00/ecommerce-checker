const fs = require('fs');
const { stringify } = require('csv-stringify/sync');

function createAppender(filePath, headers, urlColumn) {
  const rows = new Map();
  let writeTimer = null;
  const tmp = filePath + '.tmp';

  function writeNow() {
    if (writeTimer) { clearTimeout(writeTimer); writeTimer = null; }
    const data = [headers, ...[...rows.values()].map(r => headers.map(h => r[h] ?? ''))];
    fs.writeFileSync(tmp, stringify(data));
    fs.renameSync(tmp, filePath);
  }
  function schedule() {
    if (writeTimer) return;
    writeTimer = setTimeout(() => { writeTimer = null; writeNow(); }, 250);
  }

  writeNow();

  return {
    append(rowObj) {
      const key = urlColumn ? rowObj[urlColumn] : `_${rows.size}`;
      rows.set(key, rowObj);
      schedule();
    },
    preload(existingRows) {
      for (const r of existingRows) {
        const key = urlColumn ? r[urlColumn] : `_${rows.size}`;
        rows.set(key, r);
      }
      writeNow();
    },
    has(url) { return rows.has(url); },
    size() { return rows.size; },
    flush() { writeNow(); },
  };
}

module.exports = { createAppender };
