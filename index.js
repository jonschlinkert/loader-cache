/*!
 * loader-cache <https://github.com/jonschlinkert/loader-cache>
 *
 * Copyright (c) 2014 Jon Schlinkert, contributors.
 * Licensed under the MIT license.
 */

'use strict';

var path = require('path');

/**
 * Expose `Loaders`
 */

module.exports = Loaders;


function Loaders() {
  this.cache = {};
}

Loaders.prototype.register = function(ext, fn) {
  this.cache[this.ext(ext)] = [fn];
  return this;
};

Loaders.prototype.compose = function(ext, loaders) {
  return loaders.reduce(function(stack, loader) {
    stack[ext] = stack[ext] || [];
    stack[ext] = stack[ext].concat(this.cache[loader]);
    return stack;
  }.bind(this), this.cache);
};

Loaders.prototype.read = function(fp, options) {
  var fn = this.cache[path.extname(fp)];
  return fn(path.resolve(fp), options);
};

Loaders.prototype._read = function(fn, fp, options) {
  return fn(path.resolve(fp), options);
};

Loaders.prototype.ext = function(ext) {
  return ext[0] === '.' ? ext.slice(1) : ext;
};

Loaders.prototype.load = function(fp, options) {
  var ext = path.extname(fp);
  var fns = this.cache[ext.slice(1)];

  return fns.reduce(function (acc, fn) {
    return fn(acc, options);
  }, fp);
};
