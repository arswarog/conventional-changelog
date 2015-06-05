'use strict';
var assign = require('lodash.assign');
var dargs = require('dargs');
var exec = require('child_process').exec;
var split = require('split2');
var stream = require('stream');
var template = require('lodash.template');
var through = require('through2');

function gitRawCommits(options) {
  var readable = new stream.Readable();
  readable._read = function() {};

  options = assign({
    from: '',
    to: 'HEAD',
    format: '%B'
  }, options);

  var args = dargs(options, {
    excludes: ['from', 'to', 'format']
  });

  var cmd = template(
    'git log --format=\'<%= format %>%n------------------------ >8 ------------------------\' ' +
    '<%= from ? [from, to].join("..") : to %> '
  )(options) + args.join(' ');

  var child = exec(cmd);
  child.stdout
    .pipe(split('------------------------ >8 ------------------------\n'))
    .pipe(through(function(chunk, enc, cb) {
      readable.push(chunk);

      cb();
    }, function(cb) {
      readable.push(null);

      cb();
    }));

  child.stderr
    .pipe(through.obj(function(chunk) {
      readable.emit('error', chunk);
      readable.push(null);
    }));

  return readable;
}

module.exports = gitRawCommits;