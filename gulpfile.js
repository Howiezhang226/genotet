var gulp = require('gulp');

var runSequence = require('run-sequence');
var requireDir = require('require-dir');

var paths = require('./gulp/paths.js');

requireDir('./gulp', {recurse: true});

// Watch the sources and automatically rebuild when files change.
gulp.task('watch', function() {
  gulp.watch([
    'index.html',
    paths.src,
    paths.scss,
    paths.server,
    paths.html
  ], ['dev']);
});

// Test task.
gulp.task('test', function(cb) {
  runSequence(
    'test-dev',
    'test-production',
    cb);
});

// Dev task. Build without code minification.
gulp.task('dev', ['lint', 'build-dev']);

// Default task. Build with code minification.
gulp.task('default', ['lint', 'build']);

// Do everything.
gulp.task('all', function(cb) {
  runSequence(
    'clean',
    ['lint', 'compile-all'],
    'test',
    cb);
});
