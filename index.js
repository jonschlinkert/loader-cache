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
  this.cache[ext] = [fn];
  return this;
};

Loaders.prototype.compose = function(ext, loaders) {
  return loaders.reduce(function(stack, loader) {
    (stack[ext] = stack[ext] || []).push(this.cache[loader]);
    return stack;
  }.bind(this), this.cache);
};

Loaders.prototype.read = function(fp, options) {
  var fn = this.cache[path.extname(fp)];
  return fn(path.resolve(fp), options);
};

Loaders.prototype.load = function(fp, options) {
  var fn = this.cache[path.extname(fp)];
  return fn(path.resolve(fp), options);
};
