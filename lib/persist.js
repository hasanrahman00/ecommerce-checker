const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'jobs');
const FILE = path.join(DIR, 'jobs.json');
const TMP = path.join(DIR, 'jobs.json.tmp');

function serialize(j) {
  return {
    id: j.id, name: j.name, filePath: j.filePath,
    websiteCol: j.websiteCol, headers: j.headers, outputPath: j.outputPath,
    total: j.total, processed: j.processed, createdAt: j.createdAt,
    status: j.status,
    logs: (j.logs || []).slice(-300),
  };
}

function save(jobs) {
  try {
    if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });
    fs.writeFileSync(TMP, JSON.stringify(jobs.map(serialize), null, 2));
    fs.renameSync(TMP, FILE);
  } catch (e) {
    console.error('persist save failed:', e.message);
  }
}

function load() {
  if (!fs.existsSync(FILE)) return [];
  try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch { return []; }
}

module.exports = { save, load };
