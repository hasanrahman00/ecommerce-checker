const express = require('express');
const multer = require('multer');
const path = require('path');
const { createJob } = require('../lib/createJob');
const { runJob } = require('../lib/batchRunner');

const upload = multer({ dest: path.join(__dirname, '..', 'uploads') });
const router = express.Router();

router.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const job = createJob(req.file.path, req.file.originalname);
    runJob(job.id).catch(err => console.error('Job error:', err));
    res.json({ id: job.id, name: job.name, total: job.total });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;
