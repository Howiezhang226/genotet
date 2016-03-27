/**
 * @fileoverview Server code main entry.
 */

var bodyParser = require('body-parser');
var express = require('express');
var fs = require('fs');
var https = require('https');
var multer = require('multer');
var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var assert = require('assert');
var mongoUrl = 'mongodb://localhost:27017/express';
var cookieParser = require('cookie-parser');
var CryptoJS = require('crypto-js');

var segtree = require('./segtree.js');
var network = require('./network.js');
var binding = require('./binding.js');
var expression = require('./expression.js');
var uploader = require('./uploader.js');
var user = require('./user.js');
var bed = require('./bed.js');
var mapping = require('./mapping.js');
var log = require('./log.js');
var utils = require('./utils.js');

// Application
var app = express();

/**
 * Genotet namespace.
 * @const
 */
var genotet = {};

/**
 * @typedef {{
 *   type: string,
 *   message: string
 * }}
 */
genotet.Error;

/**
 * Path of wiggle files.
 * @type {string}
 */
var bindingPath;
/**
 * Path of network files.
 * @type {string}
 */
var networkPath;
/**
 * Path of expression matrix files.
 * @type {string}
 */
var expressionPath;
/**
 * Path of bigwig to Wig conversion script
 * @type {string}
 */
var bigWigToWigPath;
/**
 * Path of temporary uploaded files.
 * @type {string}
 */
var uploadPath;
/**
 * Path of user logs.
 * @type {string}
 */
var logPath;
/**
 * Path of bed data files.
 * @type {string}
 */
var bedPath;
/**
 * Path of mapping files.
 * @type {string}
 */
var mappingPath;
/**
 * Path of config file.
 * @type {string}
 */
var configPath = 'server/config';

/**
 * Path of config file.
 * @type {string}
 */
var privateKeyPath = '/etc/ssl/private/star_simonsfoundation_org.key';
/**
 * Path of config file.
 * @type {string}
 */
var certificatePath = '/etc/ssl/certs/star_simonsfoundation_org.crt';

// Parse command arguments.
process.argv.forEach(function(token) {
  var tokens = token.split(['=']);
  var arg = tokens.length >= 1 ? tokens[0] : '';
  var val = tokens.length >= 2 ? tokens[1] : '';
  switch (arg) {
    case '--config':
      if (val) {
        configPath = val;
      }
      break;
  }
});

/**
 * Reads the configuration file and gets the file paths.
 */
function config() {
  var tokens = fs.readFileSync(configPath)
    .toString()
    .split(RegExp(/\s+/));
  var dataPath;
  for (var i = 0; i < tokens.length; i += 3) {
    var variable = tokens[i];
    var value = tokens[i + 2];
    switch (variable) {
      case 'dataPath':
        dataPath = value;
        break;
      case 'bigWigToWigPath':
        bigWigToWigPath = value;
        break;
    }
  }
  bindingPath = dataPath + 'wiggle/';
  networkPath = dataPath + 'network/';
  expressionPath = dataPath + 'expression/';
  uploadPath = dataPath + 'upload/';
  bedPath = dataPath + 'bed/';
  mappingPath = dataPath + 'mapping/';
  logPath = dataPath + 'log/';
}
// Configures the server paths.
config();

var upload = multer({
  dest: uploadPath
});

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

/**
 * Path of the exon info file.
 * @type {string}
 */
var exonFile = bindingPath + 'exons.bin';

/**
 * User log POST handler.
 */
app.post('/genotet/log', function(req, res) {
  log.serverLog('POST', 'user-log');

  log.query.userLog(logPath, req.body);
});

/**
 * Upload POST handler.
 */
app.post('/genotet/upload', upload.single('file'), function(req, res) {
  log.serverLog('POST upload');

  var prefix = '';
  switch (req.body.type) {
    case uploader.FileType.NETWORK:
      prefix = networkPath;
      break;
    case uploader.FileType.BINDING:
      prefix = bindingPath;
      break;
    case uploader.FileType.EXPRESSION:
      prefix = expressionPath;
      break;
    case uploader.FileType.BED:
      prefix = bedPath;
      break;
    case uploader.FileType.MAPPING:
      prefix = mappingPath;
      break;
  }
  var body = {
    type: req.body.type,
    name: req.body.name,
    description: req.body.description
  };
  uploader.uploadFile(body, req.file, prefix, bigWigToWigPath, uploadPath);
  res.header('Access-Control-Allow-Origin', '*');
  res.json({
    success: true
  });
});

app.use(cookieParser());

app.post('/genotet/user', function(req, res) {
  log.serverLog('POST user');

  var type = req.body.type;
  MongoClient.connect(mongoUrl, function(err, db) {
    assert.equal(null, err, err);
    log.serverLog('connected to MongoDB');

    var userInfo, data;
    var authenticate = function(data) {
      res.header('Access-Control-Allow-Origin', '*');
      if (data && data.error) {
        log.serverLog(data.error.type, data.error.message);
        res.status(500).json(data.error);
      } else {
        var username = req.body.username;
        user.authenticate(db, username, function(data) {
          res.json(data);
          db.close();
        });
      }
    };
    switch (type) {
      case user.QueryType.SIGNUP:
        userInfo = {
          email: req.body.email,
          username: req.body.username,
          password: CryptoJS.SHA256(req.body.password).toString(),
          confirmed: req.body.confirmed
        };
        if (!user.validateEmail(userInfo.email) ||
          !user.validateUsername(userInfo.username) ||
          !user.validatePassword(userInfo.password)) {
          log.serverLog('invalid input');
          return;
        }
        user.signUp(db, userInfo, function(result) {
          data = result;
          authenticate(data);
        });
        break;
      case user.QueryType.SIGNIN:
        userInfo = {
          username: req.body.username,
          password: CryptoJS.SHA256(req.body.password).toString()
        };
        if (!user.validateUsername(userInfo.username) ||
          !user.validatePassword(req.body.password)) {
          log.serverLog('invalid input');
          return;
        }
        user.signIn(db, userInfo, function(result) {
          data = result;
          authenticate(data);
        });
        break;

      // Undefined type, error
      default:
        log.serverLog('invalid query type');
        data = {
          error: {
            type: 'query',
            message: 'invalid query type'
          }
        };
        authenticate(data);
    }
  });
});

// GET request handlers.
app.get('/genotet', function(req, res) {
  var query = JSON.parse(req.query.data);
  var type = query.type;
  var data;
  log.serverLog('GET', type);
  switch (type) {
    // Network data queries
    case network.QueryType.NETWORK:
      data = network.query.network(query, networkPath);
      break;
    case network.QueryType.NETWORK_INFO:
      data = network.query.allNodes(query, networkPath);
      break;
    case network.QueryType.INCIDENT_EDGES:
      data = network.query.incidentEdges(query, networkPath);
      break;
    case network.QueryType.COMBINED_REGULATION:
      data = network.query.combinedRegulation(query, networkPath);
      break;
    case network.QueryType.INCREMENTAL_EDGES:
      data = network.query.incrementalEdges(query, networkPath);
      break;

    // Binding data queries
    case binding.QueryType.BINDING:
      data = binding.query.histogram(query, bindingPath);
      break;
    case binding.QueryType.EXONS:
      data = binding.query.exons(query, exonFile);
      break;
    case binding.QueryType.LOCUS:
      data = binding.query.locus(query, exonFile);
      break;

    // Expression data queries
    case expression.QueryType.EXPRESSION:
      data = expression.query.matrix(query, expressionPath);
      break;
    case expression.QueryType.EXPRESSION_INFO:
      data = expression.query.matrixInfo(query, expressionPath);
      break;
    case expression.QueryType.PROFILE:
      data = expression.query.profile(query, expressionPath);
      break;
    case expression.QueryType.TFA_PROFILE:
      data = expression.query.tfaProfile(query, expressionPath);
      break;

    // Bed data queries
    case bed.QueryType.BED:
      data = bed.query.motifs(query, bedPath);
      break;

    // Mapping data queries
    case mapping.QueryType.MAPPING:
      data = mapping.query.getMapping(query, mappingPath);
      break;

    // Data listing
    case network.QueryType.LIST_NETWORK:
      data = network.query.list(networkPath);
      break;
    case binding.QueryType.LIST_BINDING:
      data = binding.query.list(bindingPath);
      break;
    case expression.QueryType.LIST_EXPRESSION:
      data = expression.query.list(expressionPath);
      break;
    case bed.QueryType.LIST_BED:
      data = bed.query.list(bedPath);
      break;
    case mapping.QueryType.LIST_MAPPING:
      data = mapping.query.list(mappingPath);
      break;

    // Upload file checking
    case 'check-finish':
      data = uploader.checkFinish(query, uploadPath);
      break;

    // Undefined type, error
    default:
      log.serverLog('invalid query type');
      data = {
        error: {
          type: 'query',
          message: 'invalid query type'
        }
      };
  }

  res.header('Access-Control-Allow-Origin', '*');
  if (data.error) {
    res.status(500).json(data.error);
  } else {
    res.json(data);
  }
});

// Error Handler
app.use(function(err, req, res, next) {
  log.serverLog([err.stack]);
  res.status(500);
  res.json('Internal Server Error');
});

// Start the application.
var privateKey = fs.readFileSync(privateKeyPath);
var certificate = fs.readFileSync(certificatePath);
var httpsServer = https.createServer({
  key: privateKey,
  cert: certificate
}, app).listen(443);
httpsServer.setTimeout(1200000);
