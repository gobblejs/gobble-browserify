// this is the entry bundle
var foo = require('./foo');

module.exports = foo === 'foo'; // should export true
