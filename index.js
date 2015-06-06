/*!
 * loader-cache <https://github.com/jonschlinkert/loader-cache>
 *
 * Copyright (c) 2014-2015, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';

var path = require('path');
var typeOf = require('kind-of');

/**
 * Expose `Loaders`
 */

module.exports = Loaders;

/**
 * requires cache
 */

var requires = {};

/**
 * Create a new instance of `Loaders`
 *
 * ```js
 * var Loaders = require('loader-cache');
 * var loaders = new Loaders();
 * ```
 *
 * @class `Loaders`
 * @api public
 */

function Loaders(type, cache) {
  if (!(this instanceof Loaders))
    return new Loaders(type, cache);
  if (typeof type === 'object') {
    cache = type;
    type = 'sync';
  }
  this.cache = cache || {};
  this.type = type || 'sync';
  this.iterators = {};
  this.iterator(this.type, require('./lib/iterator-' + this.type));
}

/**
 * Register a loader
 *
 * @param {String} `name`
 * @param {Function} `fn`
 * @return {Object}
 */

Loaders.prototype.register = function(name, fn) {
  return this.compose.apply(this, arguments);
};

/**
 * Create a loader from other (previously cached) loaders. For
 * example, you might create a loader like the following:
 *
 *
 * @param {String} `name` File extension to select the loader or loader stack to use.
 * @param {Array} `stack` Array of loader names.
 * @param {Function} `fn` Optional loader function
 * @return {Object} `Loaders` to enable chaining
 */

Loaders.prototype.compose = function(name /*, loader names|functions */) {
  var stack = [].slice.call(arguments);
  name = stack.shift();
  stack = this.buildStack(stack);
  this.cache[name] = union(this.cache[name] || [], stack);
  return this;
};

/**
 * Build a stack of loader functions when given a mix of functions and names.
 *
 * @param  {Array}  `stack` Stack of loader functions and names.
 * @return {Array}  Resolved loader functions
 */

Loaders.prototype.buildStack = function(stack) {
  var len = stack && stack.length, i = 0;
  var res = [];
  while (i < len) {
    var name = stack[i++];
    if (typeOf(name) === 'string') {
      res = res.concat(this.cache[name]);
    } else if (Array.isArray(name)) {
      res.push.apply(res, this.buildStack(name));
    } else {
      res.push(name);
    }
  }
  return res;
};

/**
 * Get a loader for the specified loader stack.
 *
 * ```js
 * // this will return the `yml` loader from the `.compose()` example
 * loaders.loader('yml');
 * ```
 *
 * @api public
 */

Loaders.prototype.loader = function(/*name, additional loader names|functions */) {
  var stack = [].slice.call(arguments);
  stack = this.buildStack(stack);
  return this.iterator(this.type)(this, stack);
};

Loaders.prototype.iterator = function(type, fn) {
  if (arguments.length === 0) return this.iterators;
  if (arguments.length === 1) return this.iterators[type];
  if (typeof type !== 'string') {
    throw new Error('Expected `type` to be of type [string] but got [' + (typeof type) + ']');
  }
  if (typeof fn !== 'function') {
    throw new Error('Expected `fn` to be type [function] but got [' + (typeof fn) + ']')
  }
  this.iterators[type] = fn;
  return this;
};

/**
 * Concat a list of arrays.
 */

function union() {
  return [].concat.apply([], arguments);
}
