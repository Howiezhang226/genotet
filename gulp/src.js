// Concat the sources, used in dev environment for easier debugging.
var gulp = require('gulp');
var concat = require('gulp-concat');

var paths = require('./paths.js');

gulp.task('concat-src', function(cb) {
  return gulp.src(paths.src)
    .pipe(concat('genotet.js'))
    .pipe(gulp.dest(paths.dist))
    .on('error', function(err) {
      cb(err);
    });
});

gulp.task('concat-src-dev', function(cb) {
  return gulp.src(paths.dev)
    .pipe(concat('genotet-dev.js'))
    .pipe(gulp.dest(paths.dist))
    .on('error', function(err) {
      cb(err);
    });
});
