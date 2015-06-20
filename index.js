/*!
 * loader-cache <https://github.com/jonschlinkert/loader-cache>
 *
 * Copyright (c) 2014-2015, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';

var path = require('path');
var arrayifyCompact = require('arrayify-compact');
var union = require('arr-union');
var slice = require('array-slice');
var typeOf = require('kind-of');
var isObject = require('isobject');
var flatten = require('arr-flatten');
var isStream = require('is-stream');
var utils = require('./lib/utils');

/**
 * Create a new instance of `LoaderCache`
 *
 * ```js
 * var LoaderCache = require('loader-cache');
 * var loaderCache = new LoaderCache();
 * ```
 * @api public
 */

function LoaderCache(options) {
  if (!(this instanceof LoaderCache)) {
    return new LoaderCache(options);
  }
  this.options = options || {};
  this.iterators = this.options.iterators || {};
  this.loaders = this.options.loaders || {};
  this.types = this.options.types || {};
  this.fns = this.options.fns || {};
}

/**
 * Register an iterator to use with loaders.
 *
 * @param {String} `type`
 * @param {Function} `fn` Iterator function
 * @api public
 */

LoaderCache.prototype.iterator = function(type, fn) {
  if (typeof type !== 'string') {
    throw new TypeError('LoaderCache#iterator type should be a string.');
  }
  if (typeof fn !== 'function') {
    throw new TypeError('LoaderCache#iterator fn should be a function.');
  }
  this.iterators[type] = fn;
  return this;
};

/**
 * Create a new loader type.
 *
 * @param  {String} `name`
 * @api public
 */

LoaderCache.prototype.loaderType = function(type) {
  if (this.loaders.hasOwnProperty(type)) return;
  this.loaders[type] = {};
  return this;
};

/**
 * Returns a function for getting a loader.
 *
 * @param  {String} `type`
 * @api public
 */

LoaderCache.prototype.resolveLoader = function(type) {
  var stack = this.loaders[type];
  return function (val) {
    return stack[val] || val;
  };
};

/**
 * Register a loader.
 *
 * @param  {String} `name`
 * @param  {String} `options` If `loaderType` is not passed, defaults to `sync`
 * @param  {Array|Function} `stack` Array or list of loader functions or names.
 * @api public
 */

LoaderCache.prototype.loader = function(name, options, stack) {
  stack = flatten([].slice.call(arguments, 1));
  var opts = utils.isOptions(options) ? stack.shift() : {};
  var type = opts.loaderType || 'sync';
  this.loaders[type] = this.loaders[type] || {};
  this.loaders[type][name] = this.loaders[type][name] || [];
  if (!this.loaders[type][name]) {
    this.loaders[type][name] = utils.arrayify(stack);
  } else {
    this.loaders[type][name] = utils.union(this.loaders[type][name], stack);
  }
  this.loaders[type][name] = this.buildStack(opts, this.loaders[type][name]);
  return this;
};

/**
 * Build an array of resolved loader functions from the
 * given `options` and loader names or functions.
 *
 * @param  {Object} `opts`
 * @param  {Arrays|Functions} `stack` One or more functions or arrays of loaders.
 * @return {Array}
 */

LoaderCache.prototype.buildStack = function(opts, stack) {
  stack = utils.union(stack);

  if (!stack || stack.length === 0) return [];
  var type = this.loaders[opts.loaderType || 'sync'] || {};

  return stack.reduce(function (acc, loader) {
    if (typeof loader === 'string') {
      acc.push(type[loader]);
    } else if (typeof loader === 'function') {
      acc.push(loader);
    } else if (utils.isStream(loader) || utils.isPromise(loader)) {
      acc.push(loader);
    } else if (Array.isArray(loader)) {
      acc = acc.concat(loader);
    }
    return flatten(acc);
  }.bind(this), []);
};

/**
 * Get the loaders from the end of an array.
 *
 * @param  {Array} `arr`
 * @return {Array}
 */

LoaderCache.prototype.getLoaderCache = function(arr) {
  var len = arr.length;
  var stack = [];
  if (len === 0) {
    return [];
  }

  while (len--) {
    var val = arr[len];
    if (!utils.isLoader(val) || len === 0) break;
    stack.unshift(val);
  }
  return stack;
};

/**
 * Get the `firstLoader` to use
 */

LoaderCache.prototype.firstLoader = function(type, name) {
  if (arguments.length === 1 && typeof type === 'string') {
    return this.loaders[type][name || 'default'] || [];
  }
};

/**
 * Get the `loaderType` to use. If a type isn't defined, but
 * only one kind of iterator is registered, then we assume
 * that's the type to use.
 */

LoaderCache.prototype.detectLoaderType = function(opts) {
  opts = opts || {};
  var keys = Object.keys(this.iterators);
  var type = opts.loaderType;
  if (!type && keys.length === 1) {
    type = keys[0];
  }
  return type || 'sync';
};

/**
 * Compose a loader function from the given options an loader stack.
 *
 * @param  {Object} `opts`
 * @param  {Array|Function} `stack` Array or functions
 * @return {Function}
 */

LoaderCache.prototype.compose = function(opts, stack) {
  if (!isObject(opts)) {
    stack = opts;
    opts = {};
  }

  var type = this.detectLoaderType(opts);
  var iterator = this.iterators[type];
  stack = utils.arrayify(stack);

  var ctx = {app: this, options: opts, loaders: this.loaders[type]};
  var isAsync = type === 'async';
  var self = this;

  return function (key, value, locals, options) {
    var args = [].slice.call(arguments).filter(Boolean);
    var loaders = self.getLoaderCache(args);

    // get the length before modifying the loader stack
    var len = loaders.length;

    // if loading is async, get the done function
    var cb = isAsync ? loaders.pop() : null;

    // combine the `create` and collection stacks
    stack = utils.union(stack, loaders);
    if (stack.length === 0) {
      stack = self.firstLoader(type);
    }

    // ensure that all loaders are functions
    stack = self.buildStack(opts, stack);
    // last loader, for adding views to the collection
    stack = stack.concat(opts.lastLoader || []);
    // chop of non-args to get the actual args
    args = args.slice(0, args.length - len);
    // if async, re-add the done function to the args
    if (isAsync) {
      args = args.concat(cb);
    }

    // create the actual `load` function
    var load = iterator.call(self, stack);
    return load.apply(ctx, args);
  };
};

/**
 * Expose `LoaderCache`
 */

module.exports = LoaderCache;
