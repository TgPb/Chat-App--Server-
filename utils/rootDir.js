const { dirname } = require('path');

const rootDir = dirname(require.main.filename || process.mainModule.filename);

module.exports = rootDir;