const A = require('./rulesA').RULES;
const B = require('./rulesB').RULES;

module.exports = { RULES: [...A, ...B] };
