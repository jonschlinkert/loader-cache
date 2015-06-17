/*!
 * loader-cache <https://github.com/jonschlinkert/loader-cache>
 *
 * Copyright (c) 2014-2015, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';

var path = require('path');
var typeOf = require('kind-of');
var isObject = require('isobject');
var flatten = require('arr-flatten');
var isStream = require('is-stream');
var utils = require('./lib/utils');


function LoaderStack(options, stack) {
  if (typeof options === 'function') {
    stack = options;
    options = {};
  }
  this.options = options || {};
  this.type = this.options.type || 'sync';
  this.push(stack);
}

LoaderStack.prototype.push = function(loaders) {
  this.stack = this.stack || [];
  this.stack.push.apply(this.stack, arrayify(loaders));
  return this;
};

function Iterator(options, fn) {
  if (typeof options === 'function') {
    fn = options;
    options = {};
  }
  this.options = options || {};
  this.type = this.options.type || 'sync';
  this.fn = fn;
}

/**
 * Expose `Loaders`
 */

module.exports = Loaders;

/**
 * requires cache
 */

// var requires = {};

// /**
//  * Create a new instance of `Loaders`
//  *
//  * ```js
//  * var Loaders = require('loader-cache');
//  * var loaders = new Loaders();
//  * ```
//  *
//  * @class `Loaders`
//  * @api public
//  */

// function Loaders(options) {
//   if (!(this instanceof Loaders)) {
//     return new Loaders(options);
//   }
//   this.options = options || {};
//   this.iterators = this.options.iterators || {};
//   this.types = this.options.types || {};
//   this.fns = this.options.fns || {};
// }

// /**
//  * Add an iterator.
//  *
//  * @param {String} `name`
//  * @param {Function} `fn`
//  * @api public
//  */

// Loaders.prototype.iterator = function(type, options, fn) {
//   this.iterators[type] = new Iterator(options, fn);
//   return this;
// };

// /**
//  * Add an iterator.
//  *
//  * @param {String} `name`
//  * @param {Function} `fn`
//  * @api public
//  */

// Loaders.prototype.stack = function(name, loaders) {
//   if (typeof name === 'string' && arguments.length === 1) {
//     return this.fns[name].stack;
//   }
//   loaders = [].concat.apply([], [].slice.call(arguments, 1));
//   return this.fns[name].push(loaders);
// };

// /**
//  * Add an iterator.
//  *
//  * @param {String} `name`
//  * @param {Function} `fn`
//  * @api public
//  */

// Loaders.prototype.loader = function(name, options, stack) {
//   this.fns[name] = new LoaderStack(options, stack);
//   return this;
// };


// var loaders = new Loaders();

// loaders.iterator('a', function () {});
// loaders.iterator('b', {foo: 'bar'}, function () {});

// loaders.loader('d', {e: 'f'}, function a() {});
// loaders.loader('c', function a() {});
// loaders.stack('c', function b() {
// }, function c() {
// }, function d() {
// }, function e() {
// })

// console.log(loaders.stack('c'))


function Loaders(options) {
  if (!(this instanceof Loaders)) {
    return new Loaders(options);
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

Loaders.prototype.iterator = function(type, fn) {
  if (typeof type !== 'string') {
    throw new TypeError('Loaders#iterator type should be a string.');
  }
  if (typeof fn !== 'function') {
    throw new TypeError('Loaders#iterator fn should be a function.');
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

Loaders.prototype.loaderType = function(type) {
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

Loaders.prototype.resolveLoader = function(type) {
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

Loaders.prototype.loader = function(name, options, stack) {
  stack = flatten([].slice.call(arguments, 1));
  var opts = isObject(options) ? stack.shift() : {};
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

Loaders.prototype.buildStack = function(opts, stack) {
  stack = utils.union(stack);
  if (!stack || stack.length === 0) return [];

  var type = this.loaders[opts.loaderType || 'sync'] || {};

  return stack.reduce(function (acc, loader) {
    if (typeof loader === 'string') {
      acc.push(type[loader]);
    } else if (typeof loader === 'function') {
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

Loaders.prototype.getLoaders = function(arr) {
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
 * Register a loader.
 *
 * @param  {String} `name`
 * @param  {String} `options` If `loaderType` is not passed, defaults to `sync`
 * @param  {Array|Function} `stack` Array or list of loader functions or names.
 * @api public
 */

Loaders.prototype.firstLoader = function(type, name) {
  if (arguments.length === 1 && typeof type === 'string') {
    return this.loaders[type][name || 'default'];
  }
};

/**
 * Compose a loader function from the given options an loader stack.
 *
 * @param  {Object} `opts`
 * @param  {Array|Function} `stack` Array or functions
 * @return {Function}
 */

Loaders.prototype.compose = function(opts, stack) {
  var iterator = this.iterators[opts.loaderType];
  var type = opts.loaderType || 'sync';
  var isAsync = type === 'async';

  return function (key, value, locals, options) {
    var args = [].slice.call(arguments);
    var loaders = this.getLoaders(args);
    // get the length before modifying stack
    var len = loaders.length;

    // if loading is async, get the done function
    var cb = isAsync ? loaders.pop() : null;

    // combine the `create` and collection stacks
    stack = utils.union(stack, loaders);
    if (stack.length === 0) {
      stack = this.firstLoader(type) || [];
    }

    // ensure that all loaders are functions
    stack = this.buildStack(opts, stack);
    // last loader, for adding views to the collection
    stack = stack.concat(opts.lastLoader || []);

    // chop of non-args to get the actual args
    args = args.slice(0, args.length - len);
    // if async, re-add the done function to the args
    if (isAsync) {
      args = args.concat(cb);
    }

    // create the actual `load` function
    var load = iterator.call(this, stack);
    return load.apply(this, args);
  }.bind(this);
};
