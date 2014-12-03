/*!
 * loader-cache <https://github.com/jonschlinkert/loader-cache>
 *
 * Copyright (c) 2014 Jon Schlinkert, contributors.
 * Licensed under the MIT license.
 */

'use strict';

var path = require('path');
var typeOf = require('kind-of');

/**
 * Expose `Loaders`
 */

module.exports = Loaders;

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

function Loaders() {
  this.cache = {};
}

/**
 * Base register method used by all other register method.
 *
 * @param {String} `ext`
 * @param {Function} `fn`
 * @param {String} `type`
 * @return {String}
 * @api private
 */

Loaders.prototype.register = function(ext, stack, fn, type) {
  type = filter(arguments, 'string')[1] || 'sync';
  stack = filter(arguments, 'array');

  if (stack.length) {
    return this.compose(ext, stack[0], fn, type);
  }

  var obj = filter(arguments, 'object')[0];
  fn = filter(arguments, 'function')[0];

  this.cache[type] = this.cache[type] || {};
  this.cache[type][ext] = [fn || obj];
  return this;
};

/**
 * Register the given loader callback `fn` as `ext`. Any arbitrary
 * name can be assigned to a loader, however, the loader will only be
 * called when either:
 *   a. `ext` matches the file extension of a path passed to the `.load()` method, or
 *   b. `ext` is an arbitrary name passed on the loader stack of another loader. Example below.
 *
 * @param {String|Array} `ext` File extension or name of the loader.
 * @param {Function|Array} `fn` A loader function, or create a loader from other others by passing an array of names.
 * @return {Object} `Loaders` to enable chaining
 * @api public
 */

Loaders.prototype.registerSync = function(ext, stack, fn) {
  this.register(ext, stack, fn, 'sync');
};

/**
 * Register the given async loader callback `fn` as `ext`. Any arbitrary
 * name can be assigned to a loader, however, the loader will only be
 * called when either:
 *   a. `ext` matches the file extension of a path passed to the `.load()` method, or
 *   b. `ext` is an arbitrary name passed on the loader stack of another loader. Example below.
 *
 * @param {String|Array} `ext` File extension or name of the loader.
 * @param {Function|Array} `fn` A loader function with a callback parameter, or create a loader from other others by passing an array of names.
 * @return {Object} `Loaders` to enable chaining
 * @api public
 */

Loaders.prototype.registerAsync = function(ext, stack, fn) {
  this.register(ext, stack, fn, 'async');
};

/**
 * Register the given promise loader callback `fn` as `ext`. Any arbitrary
 * name can be assigned to a loader, however, the loader will only be
 * called when either:
 *   a. `ext` matches the file extension of a path passed to the `.load()` method, or
 *   b. `ext` is an arbitrary name passed on the loader stack of another loader. Example below.
 *
 * @param {String|Array} `ext` File extension or name of the loader.
 * @param {Function|Array} `fn` A loader function that returns a promise, or create a loader from other others by passing an array of names.
 * @return {Object} `Loaders` to enable chaining
 * @api public
 */

Loaders.prototype.registerPromise = function(ext, stack, fn) {
  this.register(ext, stack, fn, 'promise');
};

/**
 * Register the given stream loader callback `fn` as `ext`. Any arbitrary
 * name can be assigned to a loader, however, the loader will only be
 * called when either:
 *   a. `ext` matches the file extension of a path passed to the `.load()` method, or
 *   b. `ext` is an arbitrary name passed on the loader stack of another loader. Example below.
 *
 * @param {String|Array} `ext` File extension or name of the loader.
 * @param {Stream|Array} `fn` A stream loader, or create a loader from other others by passing an array of names.
 * @return {Object} `Loaders` to enable chaining
 * @api public
 */

Loaders.prototype.registerStream = function(ext, stack, fn) {
  this.register(ext, stack, fn, 'stream');
};

/**
 * Create a loader from other (previously cached) loaders. For
 * example, you might create a loader like the following:
 *
 *
 * @param {String} `ext` File extension to select the loader or loader stack to use.
 * @param {String} `loaders` Array of loader names.
 * @return {Object} `Loaders` to enable chaining
 * @api private
 */

Loaders.prototype.compose = function(ext, stack, fn, type) {
  type = filter(arguments, 'string')[1] || 'sync';

  var stored = this.buildStack(type, stack);

  this.cache[type] = this.cache[type] || {};
  this.cache[type][ext] = union(this.cache[type][ext] || [], fn || []);

  console.log(fn)
  // while (len--) {
  //   var stored = this.cache[type][stack[len]];
  //   // console.log(this.cache[type][ext])
  //   this.cache[type][ext] = union(stored, this.cache[type][ext]);
  // }
  return this;
};

Loaders.prototype.buildStack = function(type, stack) {
  return stack.map(function(name) {
    return this.cache[type][name];
  }.bind(this));
};

/**
 * Run loaders associated with `ext` of the given filepath.
 *
 * **Example**
 *
 * ```js
 * // this will run the `yml` loader from the `.compose()` example
 * loaders.load('config.yml');
 * ```
 *
 * @param {String} `fp` File path to load.
 * @param {String} `options` Options to pass to whatever loaders are defined.
 * @return {String}
 * @api public
 */

Loaders.prototype.load = function(fp, options) {
  var fns = this.cache.sync[matchLoader(fp, options, this)];
  if (!fns) return fp;

  return fns.reduce(function (acc, fn) {
    return fn(acc, options);
  }, fp);
};

/**
 * Run async loaders associated with `ext` of the given filepath.
 *
 * **Example**
 *
 * ```js
 * // this will run the `yml` async loader from the `.compose()` example
 * loaders.loadAsync('config.yml', function (err, obj) {
 *   // do some async stuff
 * });
 * ```
 *
 * @param {String} `fp` File path to load.
 * @param {Object} `options` Options to pass to whatever loaders are defined.
 * @param {Function} `cb` Callback to indicate loading has finished
 * @return {String}
 * @api public
 */

Loaders.prototype.loadAsync = function(fp, options, cb) {
  var async = require('async');
  if (typeof options === 'function') {
    cb = options;
    options = {};
  }

  var fns = this.cache.async[matchLoader(fp, options, this)];
  if (!fns) return fp;

  async.reduce(fns, fp, function (acc, fn, next) {
    fn(acc, options, next);
  }, cb);
};

/**
 * Run promise loaders associated with `ext` of the given filepath.
 *
 * **Example**
 *
 * ```js
 * // this will run the `yml` promise loader from the `.compose()` example
 * loaders.loadPromise('config.yml')
 *   .then(function (results) {
 *     // do some promise stuff
 *   });
 * ```
 *
 * @param {String} `fp` File path to load.
 * @param {Object} `options` Options to pass to whatever loaders are defined.
 * @return {Promise} a promise that will be fulfilled later
 * @api public
 */

Loaders.prototype.loadPromise = function(fp, options) {
  var Promise = require('bluebird');
  var current = Promise.resolve();
  options = options || {};

  var fns = this.cache.promise[matchLoader(fp, options, this)];
  if (!fns) return current.then(function () { return fp; });

  return Promise.reduce(fns, function (acc, fn) {
    return fn(acc, options);
  }, fp);
};

/**
 * Run stream loaders associated with `ext` of the given filepath.
 *
 * **Example**
 *
 * ```js
 * // this will run the `yml` stream loader from the `.compose()` example
 * loaders.LoadStream('config.yml')
 *   .pipe(foo())
 *   .on('data', function (results) {
 *     // do stuff
 *   });
 * ```
 *
 * @param {String} `fp` File path to load.
 * @param {Object} `options` Options to pass to whatever loaders are defined.
 * @return {Stream} a stream that will be fulfilled later
 * @api public
 */

Loaders.prototype.loadStream = function(fp, options) {
  var es = require('event-stream');
  options = options || {};

  var fns = this.cache.stream[matchLoader(fp, options, this)];
  if (!fns) {
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
 * @api private
 */

function matchLoader(pattern, options, thisArg) {
  if (options && options.matchLoader) {
    return options.matchLoader(pattern, options, thisArg);
  }
  return formatExt(path.extname(pattern));
}

/**
 * Format extensions.
 *
 * @param {String} `ext`
 * @return {String}
 * @api private
 */

function formatExt(ext) {
  return (ext[0] === '.')
    ? ext.slice(1)
    : ext;
}

/**
 * Array union util.
 *
 * @api private
 */

function union() {
  return [].concat.apply([], arguments).filter(Boolean);
}


function filter(arr, type) {
  var len = arr.length;
  var res = [];
  for (var i = 0; i < len; i++) {
    var ele = arr[i];
    if (typeOf(ele) === type) {
      res.push(ele);
    }
  }
  return res;
}
