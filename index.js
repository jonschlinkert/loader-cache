/*!
 * loader-cache <https://github.com/jonschlinkert/loader-cache>
 *
 * Copyright (c) 2014-2015, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';

var path = require('path');

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

function Loaders(cache) {
  this.cache = cache || {};
}

/**
 * Register a loader, or compose a loader from other (previously cached) loaders.
 *
 * {%= method("compose") %}
 *
 * @param {String} `ext` File extension to select the loader or loader stack to use.
 * @param {String} `loaders` Array of loader names.
 * @return {Object} `Loaders` to enable chaining
 */

Loaders.prototype.compose = function(ext/*, stack, fns*/) {
  var len = arguments.length - 1, i = 1;
  var stack = [], type;

  while (len--) {
    var arg = arguments[i++];
    if (typeof arg === 'string') {
      type = arg;
    } else if (arg) {
      stack.push(arg);
    }
  }

  if (typeof type === 'undefined') {
    type = 'sync';
  }

  this.cache[type] = this.cache[type] || {};
  stack = this.buildStack(type, stack);

  this.cache[type][ext] = union(this.cache[type][ext] || [], stack);
  return this;
};

/**
 * Internal method for creating composers.
 *
 * @param {String} `type` The type of composer to create.
 * @return {Function} Composer function for the given `type.
 */

Loaders.prototype.composer = function(type) {
  return function () {
    // don't slice args (for v8 optimizations)
    var len = arguments.length, i = 0;
    var args = new Array(len);
    while (len--) {
      args[i] = arguments[i++];
    }
    args[i] = type || 'sync';
    this.compose.apply(this, args);
  }.bind(this);
};

/**
 * Register the given loader callback `fn` as `ext`.
 *
 * {%= method("composeSync") %}
 *
 * @param {String|Array} `ext` File extension or name of the loader.
 * @param {Function|Array} `fn` A loader function, or create a loader from other others by passing an array of names.
 * @return {Object} `Loaders` to enable chaining
 * @api public
 *
 */

Loaders.prototype.composeSync = function(/*ext, stack, fn*/) {
  this.composer('sync').apply(this, arguments);
};

/**
 * Register the given async loader callback `fn` as `ext`.
 *
 * {%= method("composeAsync") %}
 *
 * @param {String|Array} `ext` File extension or name of the loader.
 * @param {Function|Array} `fn` A loader function with a callback parameter, or create a loader from other others by passing an array of names.
 * @return {Object} `Loaders` to enable chaining
 * @api public
 */

Loaders.prototype.composeAsync = function(/*ext, stack, fn*/) {
  this.composer('async').apply(this, arguments);
};

/**
 * Register the given promise loader callback `fn` as `ext`.
 *
 * {%= method("composePromise") %}
 *
 * @param {String|Array} `ext` File extension or name of the loader.
 * @param {Function|Array} `fn` A loader function that returns a promise, or create a loader from other others by passing an array of names.
 * @return {Object} `Loaders` to enable chaining
 * @api public
 */

Loaders.prototype.composePromise = function(/*ext, stack, fn*/) {
  this.composer('promise').apply(this, arguments);
};

/**
 * Register the given stream loader callback `fn` as `ext`.
 *
 * {%= method("composeStream") %}

 * @param {String|Array} `ext` File extension or name of the loader.
 * @param {Stream|Array} `fn` A stream loader, or create a loader from other others by passing an array of names.
 * @return {Object} `Loaders` to enable chaining
 * @api public
 */

Loaders.prototype.composeStream = function(/*ext, stack, fn*/) {
  this.composer('stream').apply(this, arguments);
};

/**
 * Build a stack of loader functions from functions
 * and/or names of other cached loaders.
 *
 * @param  {String} `type` Loader type to get loaders from.
 * @param  {Array}  `stack` Stack of loader functions and names.
 * @return {Array} Array of loader functions
 */

Loaders.prototype.buildStack = function(type, stack) {
  var len = stack && stack.length, i = 0;
  var res = [];

  while (len--) {
    var name = stack[i++];
    if (typeof name === 'string') {
      res = res.concat(this.cache[type][name]);
    } else if (Array.isArray(name)) {
      res.push.apply(res, this.buildStack(type, name));
    } else {
      res.push(name);
    }
  }
  return res;
};

/**
 * Run loaders associated with `ext` of the given filepath.
 *
 * {%= method("load") %}
 *
 * @param {String} `val` Value to load, like a file path.
 * @param {String} `options` Options to pass to whatever loaders are defined.
 * @return {String}
 * @api public
 */

Loaders.prototype.load = function(val, stack, options) {
  if (!Array.isArray(stack)) {
    options = stack; stack = [];
  }

  var loader = matchLoader(val, options, this);
  stack = this.buildStack('sync', stack);

  var fns = [];
  if (this.cache.sync.hasOwnProperty(loader)) {
    fns = fns.concat(this.cache.sync[loader]);
  }

  if (stack && stack.length) {
    fns = fns.concat(stack);
  }

  if (!fns.length) return val;
  var len = fns.length, i = 0;

  while (len--) {
    var fn = fns[i++];
    val = fn.call(this, val, options);
  }
  return val;
};

/**
 * Run async loaders associated with `ext` of the given filepath.
 *
 * {%= method("loadAsync") %}

 * @param {String} `fp` File path to load.
 * @param {Object} `options` Options to pass to whatever loaders are defined.
 * @param {Function} `cb` Callback to indicate loading has finished
 * @return {String}
 * @api public
 */

Loaders.prototype.loadAsync = function(fp, stack, options, cb) {
  var async = requires.async || (requires.async = require('async'));
  if (typeof stack === 'function') {
    cb = stack; stack = []; options = {};
  }

  if (typeof options === 'function') {
    cb = options; options = {};
  }

  if (!Array.isArray(stack)) {
    options = stack; stack = [];
  }

  stack = this.buildStack('async', stack);

  var loader = matchLoader(fp, options, this);
  var fns = union(this.cache.async[loader] || [], stack);
  if (!fns.length) {
    return fp;
  }

  async.reduce(fns, fp, function (acc, fn, next) {
    fn(acc, options, next);
  }, cb);
};

/**
 * Run promise loaders associated with `ext` of the given filepath.
 *
 * {%= method("loadAsync") %}
 *
 * @param {String} `fp` File path to load.
 * @param {Object} `options` Options to pass to whatever loaders are defined.
 * @return {Promise} a promise that will be fulfilled later
 * @api public
 */

Loaders.prototype.loadPromise = function(fp, stack, options) {
  var Promise = requires.promise || (requires.promise = require('bluebird'));
  if (!Array.isArray(stack)) {
    options = stack;
    stack = [];
  }

  var resolve = Promise.resolve();
  options = options || {};

  var loader = matchLoader(fp, options, this);
  stack = this.buildStack('promise', stack);

  var fns = union(this.cache.promise[loader] || [], stack);
  if (!fns.length) {
    return resolve.then(function () {
      return fp;
    });
  }

  return Promise.reduce(fns, function (acc, fn) {
    return fn(acc, options);
  }, fp);
};

/**
 * Run stream loaders associated with `ext` of the given filepath.
 *
 * {%= method("loadStream") %}
 *
 * @param {String} `fp` File path to load.
 * @param {Object} `options` Options to pass to whatever loaders are defined.
 * @return {Stream} a stream that will be fulfilled later
 * @api public
 */

Loaders.prototype.loadStream = function(fp, stack, options) {
  var es = requires.es || (requires.es = require('event-stream'));
  if (!Array.isArray(stack)) {
    options = stack;
    stack = [];
  }

  options = options || {};
  var loader = matchLoader(fp, options, this);
  stack = this.buildStack('stream', stack);

  var fns = union(this.cache.stream[loader] || [], stack);
  if (!fns.length) {
    var noop = es.through(function (fp) {
      this.emit('data', fp);
    });
    noop.stream = true;
    fns = [noop];
  }

  var stream = es.pipe.apply(es, fns);
  process.nextTick(function () {
    stream.write(fp);
    stream.end();
  });
  return stream;
};

/**
 * Get a loader based on the given pattern.
 *
 * @param {String} `pattern` By default, this is assumed to be a filepath.
 * @return {Object} Object
 */

function matchLoader(pattern, opts, thisArg) {
  if (opts && opts.matchLoader) {
    return opts.matchLoader(pattern, opts, thisArg);
  }
  return formatExt(path.extname(pattern));
}

/**
 * Format extensions.
 *
 * @param {String} `ext`
 * @return {String}
 */

function formatExt(ext) {
  return (ext[0] === '.') ? ext.slice(1) : ext;
}

/**
 * Concat a list of arrays.
 */

function union() {
  return [].concat.apply([], arguments);
}
