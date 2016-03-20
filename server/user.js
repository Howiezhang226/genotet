/**
 * @fileoverview user function handler
 */
var fs = require('fs');
var assert = require('assert');

var log = require('./log.js');
var utils = require('./utils.js');

/** @type {user} */
module.exports = user;

/**
 * @constructor
 */
function user() {}

/** @enum {string} */
user.QueryType = {
  SIGNUP: 'sign-up',
  SIGNIN: 'sign-in'
};

/**
 * Name of user information file.
 * @type {string}
 */
user.userInfoFile = 'userInfo.txt';

/**
 * Expire time of cookie.
 * @const {number}
 */
user.cookieExpireTime = 24 * 60 * 60 * 1000;

/**
 * @typedef {{
 *   email: (string|undefined),
 *   username: string,
 *   password: string,
 *   confirmed: (boolean|undefined)
 * }}
 */
user.Info;

/**
 * @typedef {{
 *   error: string
 * }}
 */
user.Error;

/**
 * Checks the user information for signing in.
 * @param {string} userPath Directory of user indormation file.
 * @param {!user.Info} userInfo User Information
 * @return {user.Error|boolean}
 */
user.signUp = function(userPath, userInfo) {
  var checkDuplicate = {
    duplicated: false,
    elements: []
  };
  var lines = fs.readFileSync(userPath + user.userInfoFile).toString()
    .split('\n');
  for (var i = 0; i < lines.length; i++) {
    var parts = lines[i].split(/[\t\s]+/);
    if (parts.length == 0) {
      continue;
    }
    if (parts[0] == userInfo.email || parts[1] == userInfo.username) {
      checkDuplicate.duplicated = true;
      if (parts[0] == userInfo.email) {
        checkDuplicate.elements.push('email: ' + userInfo.email);
      }
      if (parts[1] == userInfo.username) {
        checkDuplicate.elements.push('username: ' + userInfo.username);
      }
      break;
    }
  }
  if (checkDuplicate.duplicated) {
    var errorMessage = checkDuplicate.elements.join(' and ') + ' exist';
    errorMessage += checkDuplicate.elements.length == 1 ? 's' : '';
    return {
      error: errorMessage
    };
  } else {
    var infoLine = userInfo.email + ' ' + userInfo.username + ' ' +
      userInfo.password + ' ' + userInfo.confirmed + '\n';
    fs.appendFile(userPath + user.userInfoFile, infoLine, function(err) {
      if (err) {
        log.serverLog(err);
        return;
      }
      log.serverLog('user information saved');
    });
    var folder = userPath + userInfo.username + '/';
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder);
    }
    return true;
  }
};

/**
 * Checks the user information for signing in.
 * @param {string} userPath Directory of user information file.
 * @param {!user.Info} userInfo User Information
 * @return {user.Error|boolean}
 */
user.signIn = function(userPath, userInfo) {
  var lines = fs.readFileSync(userPath + user.userInfoFile).toString()
    .split('\n');
  for (var i = 0; i < lines.length; i++) {
    var parts = lines[i].split(/[\t\s]+/);
    if (parts.length == 0) {
      continue;
    }
    if (parts[1] == userInfo.username && parts[2] == userInfo.password) {
      return true;
    }
  }
  return {
    error: 'invalid username or password'
  };
};

/**
 * Gets session ID from database. Regenerate if it is expired.
 * @param {!mongodb.Db} db Session database.
 * @param {string} username Username of the POST query.
 * @param {!Object} res HTTP response.
 * @param {function()} callback Callback function.
 */
user.authenticate = function(db, username, res, callback) {
  var cursor = db.collection('session').find({username: username});
  var result = [];
  cursor.each(function(err, doc) {
    assert.equal(err, null, 'error occurs');
    if (doc != null) {
      result.push(doc);
    } else {
      callback();
      authenticateCallback();
    }
  });
  var authenticateCallback = function() {
    var hasValidSession = false;
    var sessionIndex = -1;
    if (result.length) {
      for (var i = 0; i < result.length; i++) {
        if (new Date().getTime() < result[i].expiration) {
          sessionIndex = i;
          hasValidSession = true;
          break;
        }
      }
    }
    if (!result.length || !hasValidSession) {
      // Don't have username or have username but don't have valid session
      var cookie = {
        username: username,
        sessionId: utils.randomString(),
        expiration: new Date().getTime() + user.cookieExpireTime
      };
      db.collection('session').insertOne(cookie);
    } else {
      // Have session and update expire date
      var cookie = result[sessionIndex];
      var newExpiration = new Date().getTime() + user.cookieExpireTime;
      db.collection('session').update(cookie,
        {$set: {expiration: newExpiration}}, {upsert: false});
      cookie.expiration = newExpiration;
    }
    res.json({
      cookie: cookie
    });
  };
};
