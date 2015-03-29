'use strict';

var fs = require('fs');
var path = require('path');
var gutil = require('gulp-util');
var stripAnsi = require('strip-ansi');
var istanbul = require('gulp-istanbul');
var jshint = require('gulp-jshint');
var mocha = require('gulp-mocha');
var verb = require('verb');


// helper for including coverage report
verb.helper('coverage', function (fp) {
  var str = fs.readFileSync(fp, 'utf8');
  return stripAnsi(str).replace(/^=.*/gm, '').trim();
});

function toSections(fp) {
  var str = fs.readFileSync(fp, 'utf8');
  var arr = str.split(/^##\s/gm);
  var len = arr.length, sections = {};
  while (len--) {
    var section = arr[len].trim();
    var lines = section.split('\n');
    if (lines.length > 1) {
      var heading = lines[0].trim();
      lines = lines.slice(1);
      section = '\n' + lines.join('\n').trim();
      sections[heading] = {path: heading, content: section};
    }
  }
  return sections;
}

verb.create('snippet', 'snippets', {isPartial: true}, [toSections]);
verb.snippets('.verb.md');

/* deps:jshint-stylish */
verb.task('lint', function () {
  verb.src(['index.js'])
    .pipe(jshint('.jshintrc'))
    .pipe(jshint.reporter('jshint-stylish'));
});

verb.task('test', ['lint'], function (cb) {
  verb.src('index.js')
    .pipe(istanbul({includeUntested: true}))
    .pipe(istanbul.hookRequire())
    .on('finish', function () {
      verb.src(['test.js'])
        .pipe(mocha())
        .on('error', gutil.log)
        .pipe(istanbul.writeReports({
          reporters: [ 'text' ],
          reportOpts: {dir: 'coverage', file: 'summary.txt'}
        }))
        .on('end', cb)
    });
});

// ignore patterns for excluding TOC headings (for verb's built-in `toc` helper)
verb.option('toc.ignore', [
  'Install',
  'Contributing',
  'Author',
  'License'
]);

verb.task('readme', function () {
  verb.src('.verb.md').pipe(verb.dest('.'));
});

verb.task('default', ['test', 'readme']);
