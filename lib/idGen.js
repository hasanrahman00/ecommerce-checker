const crypto = require('crypto');

function genJobId() {
  return 'job_' + crypto.randomBytes(8).toString('hex');
}

module.exports = { genJobId };
