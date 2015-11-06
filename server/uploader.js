/**
 * @fileoverview upload function handler
 */

'use strict'

var path;
var fs = require('fs');
var multer = require('multer');
var shell = require('shelljs');

var utils = require('./utils');
var binding = require('./binding');
var segtree = require('./segtree');

var upload = multer();

module.exports = {

  /**
   * Upload a file or a directory to server.
   * @param req {Object} Including query parameders.
   * @param wiggleAddr {string} Wiggle data directory to upload to.
   * @param networkAddr {string} Network Data directory to upload to.
   * @param expmatAddr {string} Expression Matrix data directory to upload to.
   * @param bigwigtoWigAddr {string} Directory of script of BigwigtoWig.
   * @param genecodes {Array} Namecode conversion of gene.
   * @returns {boolean} Success or not as a JS Object.
   */
  uploadFile: function(req, prefix, bigwigtoWigAddr) {

    var fileType = req.type;

    var isFinish = true;
    upload = multer({dest: prefix});
    isFinish = upload(req, function(err){
      if (err) {
        return false;
      }
      return true;
    });

    if (!isFinish) {
      return false;
    }

    if (fileType == 'wiggle') {
      this.bigwigtoBcwig(prefix, req.file.filedname, bigwigtoWigAddr);

      // write down the gene name and description
      var filename = req.file.originalname.substr(0, req.file.originalname.length - 3);
      var fd = fs.openSync(prefix + 'NameInfo', 'a');
      fd.write(filename + '\t' + req.genename + '\t' + req.description + '\n');
      fd.close();
    }
    return isFinish;
  },

  /**
   * Convert bigwig file to bcwig file and construct segment trees.
   * @param prefix {String} Folder that contains the bw file.
   * @param bwFile {String} Name of the bigwig file.
   * @param bigwigtoWigAddr {String} The convention script path.
   * @param genecodes {Array} Namecode convention of gene.
   */
  bigwigtoBcwig: function(prefix, bwFile, bigwigtoWigAddr) {
    // convert *.bw into *.wig
    var wigFileName = bwFile.substr(0, bwFile.length - 3) + '.wig';
    shell.exec('./' + bigwigtoWigAddr + ' ' + prefix + bwFile + ' ' + prefix + wigFileName);

    // convert *.wig into *.bcwig
    var seg = [];  // for segment tree, 22 trees for each chromosome
    for (var i = 1; i < 20; i++) {
      var chName = 'chr' + i.toString();
      seg[chName] = [];
    }
    seg['chrM'] = [];
    seg['chrX'] = [];
    seg['chrY'] = [];

    var buf = fs.readFileSync(prefix + wigFileName);
    var wigLine = buf.toString().split('\n');
    var lastxr = -1;
    for (var i = 1; i < wigLine.length; i++) {
      if (wigLine.contains('#')) {
        continue;
      }
      var wigLinePart = wigLine.split(RegExp(/\s+/));
      var chName = wigLinePart[0];
      var xl = parseInt(wigLinePart[1]);
      var xr = parseInt(wigLinePart[2]);
      var val = parseFloat(wigLinePart[3]);
      if (xl != lastxr) {
        seg[chName].push({
          x: lastxr,
          val: 0
        });
      }
      seg[chName].push({
        x: xl,
        val: val
      });
      lastxr = xr;
    }

    // write to *.bcwig file
    var namecode = bwFile.substr(0, bwFile.length - 3);
    fs.mkdir(prefix + namecode);
    for (var chr in seg) {
      var bcwigFile = prefix + namecode + '/' + namecode + '_' + chr + '.bcwig';
      for (var i = 0; i < seg[chr].length; i++) {
        var bcwigBuf = new Buffer(8 * seg[chr].length);

        bcwigBuf.writeInt32LE(seg[chr][i].x, i * 4);
        bcwigBuf.writeFloatLE(seg[chr][i].val, i * 4 + 4);
        var fd = fs.openSync(bcwigFile, 'w');
        fs.writeSync(fd, buf, 0, 4 * seg[chr].length, 0);
      }
    }

    // build segment tree and save
    for (var chr in seg) {
      var segFile = prefix + namecode + '/' + namecode + '_' + chr + '.seg';
      var nodes = [];
      segtree.buildSegmentTree(nodes, seg[chr]);
      var segBuf = new Buffer(4 + 4 * nodes.length);
      segBuf.writeInt32LE(nodes.length, 0);
      for (var i = 0, offset = 4; i < nodes.length; i++, offset += 2) {
        segBuf.writeFloatLE(nodes[i], offset);
      }
      var fd = fs.openSync(segFile, 'w');
      fs.writeSync(fd, segBuf, 0, offset, 0);
    }
  }

};
