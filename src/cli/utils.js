const { filesize } = require('humanize');
const { statSync } = require('fs');
const { resolve } = require('path');

/**
 * Serialize a Map.
 * Reference: https://stackoverflow.com/questions/29085197/how-do-you-json-stringify-an-es6-map
 */
function replacer(key, value) {
  const originalObject = this[key];

  if(originalObject instanceof Map) {
    const entry = Array.from(originalObject.entries());
    return entry.reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});
  } else {
    return value;
  }
}

/**
 * Get the size of a file.
 */
function getFileSize(fileName) {
  const filePath = resolve(process.cwd(), 'data', fileName);
  const stats = statSync(filePath);
  return filesize(stats.size);
}

module.exports = {
  replacer,
  getFileSize
};
