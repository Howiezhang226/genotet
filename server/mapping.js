/**
 * @fileoverview Server handler for mapping data.
 */

var fs = require('fs');

/** @type {mapping} */
module.exports = mapping;

/**
 * @constructor
 */
function mapping() {}

/** @enum {string} */
mapping.QueryType = {
  MAPPING: 'mapping',
  LIST_MAPPING: 'list-mapping'
};

/** @const */
mapping.query = {};

/**
 * @typedef {{
 *   fileName: string
 * }}
 */
mapping.query.GetMapping;

/**
 * Lists all the mapping files.
 * @param {string} mappingPath Path to the mapping file folder.
 * @return {?Array<string>}
 */
mapping.query.list = function(mappingPath) {
  return fs.readdirSync(mappingPath).filter(function(fileName) {
    // filter the files starting with '.' which are hidden files
    return fileName[0] != '.';
  });
};

/**
 * @param {!mapping.query.GetMapping} query
 * @param {string} mappingPath
 * @return {!Object<string>}
 */
mapping.query.getMapping = function(query, mappingPath) {
  return mapping.getMapping_(mappingPath + query.fileName);
};

/**
 * Gets mapping rules.
 * @param {string} filePath Path to the mapping file.
 * @return {!Object<string>}
 * @private
 */
mapping.getMapping_ = function(filePath) {
  var mappingRules = {};
  var content = fs.readFileSync(filePath, 'utf-8').toString()
    .split('\n');
  content.forEach(function(line) {
    var entry = line.split(/[\t\s]+/);
    var gene = entry[0];
    var bindingFile = entry[1];
    mappingRules[gene.toLowerCase()] = bindingFile;
  });
  return mappingRules;
};
