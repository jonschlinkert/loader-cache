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

function Loaders(cache, handler) {
  if (!(this instanceof Loaders))
    return new Loaders(cache, handler);

  if (typeof cache === 'function') {
    handler = cache;
    cache = {};
  }

  this.cache = cache || {};
  this.middleware = {
    first: [],
    last: []
  };
  this._handler = handler;
}

/**
 * Register a loader
 *
 * @param {String} `name`
 * @param {Function} `fn`
 * @return {Object}
 */

Loaders.prototype.register = function(/*name, stack, fn*/) {
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

Loaders.prototype.compose = function(name, stack, fn) {
  if (typeof stack === 'function') {
    fn = stack;
    stack = [];
  }

  stack = stack || [];
  stack = Array.isArray(stack) ? stack : [stack];
  if (typeof fn === 'function') {
    stack.push(fn);
  }

  stack = this.buildStack(stack);
  this.cache[name] = union(this.cache[name] || [], stack);
  return this;
};

Loaders.prototype.first = function(fn) {
  this.middleware.first.push(fn);
};

Loaders.prototype.last = function(fn) {
  this.middleware.last.push(fn);
};

Loaders.prototype.handler = function(handler) {
  this._handler = handler;
};

Loaders.prototype.handle = function(verb, stack, args) {
  switch (verb) {
    case 'first':
    case 'last':
      var len = stack.length, i = 0;
      var results = null;
      while (len-- || results != null) {
        var fn = stack[i++];
        results = fn.apply(fn, args);
      }
      return results;
      break;

    case 'load':
      if (typeof this._handler !== 'function') return null;
      return this._handler(stack, args);
      break;
    default:
      throw new Error('Invalid verb [' + verb + ']');
  }
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
    } else if (typeOf(name) === 'array') {
      res = res.concat(this.buildStack(name));
    } else {
      res.push(name);
    }
  }
  return res;
};

/**
 * Run first middleware, call load function, run last middleware
 *
 * **Example**
 *
 * ```js
 * // this will run the `yml` loader from the `.compose()` example
 * loaders.load('config.yml');
 * ```
 *
 * @api public
 */

Loaders.prototype.load = function(/* arguments */) {
  var first = this.middleware.first;
  var last = this.middleware.last;

  var len = arguments.length, i = 0;
  var args = new Array(len);
  while (len--) args[i] = arguments[i++];

  var arg = this.handle('first', first, args) || args;
  arg = Array.isArray(arg) ? arg : [arg];

  var results = this.handle('load', this.cache, arg);
  return this.handle('last', last, results) || results;
};

/**
 * Concat a list of arrays.
 */

function union() {
  return [].concat.apply([], arguments);
}
