/*!
 * loader-cache <https://github.com/jonschlinkert/loader-cache>
 *
 * Copyright (c) 2014-2015, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';

var path = require('path');
var typeOf = require('kind-of');
var flatten = require('arr-flatten');
var isStream = require('is-stream');

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

function Loaders(options) {
  if (!(this instanceof Loaders)) {
    return new Loaders(options);
  }
  options = options || {};
  this.cache = options.cache || {};
  this.iterator = options.iterator;
}

/**
 * Get a loader stack from the cache.
 *
 * @param {String} `name`
 * @return {Object}
 * @api public
 */

Loaders.prototype.getStack = function(name) {
  return this.cache[name] || [];
};

/**
 * Create a loader from other (previously cached) loaders. For
 * example, you might create a loader like the following:
 *
 *
 * @param {String} `name` Name of the loader or loader stack to use.
 * @param {Array} `stack` Array of loader names.
 * @param {Function} `fn` Optional loader function
 * @return {Object} `Loaders` to enable chaining
 */

Loaders.prototype.register = function(name, loaders) {
  var args = [].slice.call(arguments, 1);
  var cached = this.getStack(name);
  var stack = this.buildStack(args).stack;
  this.cache[name] = cached.concat(stack);
  return this;
};

/**
 * Build a loader stack from a mix of functions and loader names.
 *
 * @param  {Array} `stack` array of loader functions and names.
 * @return {Array} Resolved loader functions
 * @api public
 */

Loaders.prototype.buildStack = function(args, cache) {
  if (!Array.isArray(args)) {
    throw new TypeError('Loaders#buildStack expects an array.');
  }

  var len = args.length, i = 0;
  var stack = [], other = [];
  cache = cache || this.cache;

  while (len--) {
    var arg = args[i++];
    var type = typeOf(arg);

    if (type === 'string' && cache[arg]) {
      stack.push(cache[arg]);
    } else if (type === 'function') {
      stack.push(arg);
    } else if (type === 'array') {
      stack.push.apply(stack, this.buildStack(arg, cache).stack);
    } else if (isStream(arg)) {
      stack.push(arg);
    } else {
      other.push(arg);
    }
  }

  var res = {};
  res.stack = flatten(stack);
  res.args = other;
  return res;
};

/**
 * Compose a loader function from the given functions and/or
 * the names of cached loader functions.
 *
 * ```js
 * // this will return a function from the given loaders
 * // and function
 * loaders.compose(['a', 'b', 'c'], function(val) {
 *   //=> do stuff to val
 * });
 * ```
 * @param {String} `name` The name of the loader stack to compose.
 * @return {Function} Returns a function to use for loading.
 * @api public
 */

Loaders.prototype.compose = function() {
  var fns = this.buildStack([].slice.call(arguments)).stack;
  return this.iterator.call(this, fns);
};

