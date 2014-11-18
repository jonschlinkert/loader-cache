/*!
 * loader-cache <https://github.com/jonschlinkert/loader-cache>
 *
 * Copyright (c) 2014 Jon Schlinkert, contributors.
 * Licensed under the MIT license.
 */

'use strict';

var Promise = require('bluebird');
var es = require('event-stream');
var async = require('async');
var path = require('path');

/**
 * Expose `Loaders`
 */

module.exports = Loaders;

/**
 * Create a new instance of `Loader`
 *
 * ```js
 * var Loader = require('loader');
 * var loader = new Loader();
 * ```
 *
 * @class `Loader`
 * @api public
 */

function Loaders() {
  this.cache = {};
}

/**
 * Register the given loader callback `fn` as `ext`. Any arbitrary
 * name can be assigned to a loader, however, the loader will only be
 * called when either:
 *   a. `ext` matches the file extension of a path passed to the `.load()` method, or
 *   b. `ext` is an arbitrary name passed on the loader stack of another loader. Example below.
 *
 * **Examples**
 *
 * ```js
 * // register a loader for parsing YAML
 * loaders.register('yaml', function(fp) {
 *   return YAML.safeLoad(fp);
 * });
 *
 * // register a loader to be used in other loaders
 * loaders.register('read', function(fp) {
 *   return fs.readFileSync(fp, 'utf8');
 * });
 *
 * // create a new loader from the `yaml` and `read` loaders.
 * loaders.register('yml', ['read', 'yaml']);
 * ```
 *
 * @param {String|Array} `ext` File extension or name of the loader.
 * @param {Function|Array} `fn` A loader function, or create a loader from other others by passing an array of names.
 * @return {Object} `Loaders` to enable chaining
 * @api public
 */

Loaders.prototype.register = function(ext, fn) {
  ext = (ext[0] === '.') ? ext.slice(1) : ext;

  if (Array.isArray(fn)) {
    return this.compose(ext, fn);
  }

  this.cache[ext] = [fn];
  return this;
};

/**
 * Register the given async loader callback `fn` as `ext`. Any arbitrary
 * name can be assigned to a loader, however, the loader will only be
 * called when either:
 *   a. `ext` matches the file extension of a path passed to the `.load()` method, or
 *   b. `ext` is an arbitrary name passed on the loader stack of another loader. Example below.
 *
 * **Examples**
 *
 * ```js
 * // register an async loader for parsing YAML
 * loaders.registerAsync('yaml', function(fp, next) {
 *    next(null, YAML.safeLoad(fp));
 * });
 *
 * // register a loader to be used in other loaders
 * loaders.registerAsync('read', function(fp, next) {
 *   fs.readFile(fp, 'utf8', next);
 * });
 *
 * // create a new loader from the `yaml` and `read` loaders.
 * loaders.registerAsync('yml', ['read', 'yaml']);
 * ```
 *
 * @param {String|Array} `ext` File extension or name of the loader.
 * @param {Function|Array} `fn` A loader function with a callback parameter, or create a loader from other others by passing an array of names.
 * @return {Object} `Loaders` to enable chaining
 * @api public
 */

Loaders.prototype.registerAsync = function(ext, fn) {
  ext = (ext[0] === '.') ? ext.slice(1) : ext;

  if (Array.isArray(fn)) {
    return this.compose(ext, fn);
  }

  fn.async = true;
  this.cache[ext] = [fn];
  return this;
};

/**
 * Register the given promise loader callback `fn` as `ext`. Any arbitrary
 * name can be assigned to a loader, however, the loader will only be
 * called when either:
 *   a. `ext` matches the file extension of a path passed to the `.load()` method, or
 *   b. `ext` is an arbitrary name passed on the loader stack of another loader. Example below.
 *
 * **Examples**
 *
 * ```js
 * // register an promise loader for parsing YAML
 * loaders.registerPromise('yaml', function(fp) {
 *    var Promise = require('bluebird');
 *    var deferred = Promise.pending();
 *    process.nextTick(function () {
 *      deferred.fulfill(YAML.safeLoad(fp));
 *    });
 *    return deferred.promise;
 * });
 *
 * // register a loader to be used in other loaders
 * loaders.registerPromise('read', function(fp) {
 *    var Promise = require('bluebird');
 *    var deferred = Promise.pending();
 *    fs.readFile(fp, 'utf8', function (err, content) {
 *      deferred.fulfill(content);
 *    });
 *    return deferred.promise;
 * });
 *
 * // create a new loader from the `yaml` and `read` loaders.
 * loaders.registerPromise('yml', ['read', 'yaml']);
 * ```
 *
 * @param {String|Array} `ext` File extension or name of the loader.
 * @param {Function|Array} `fn` A loader function that returns a promise, or create a loader from other others by passing an array of names.
 * @return {Object} `Loaders` to enable chaining
 * @api public
 */

Loaders.prototype.registerPromise = function(ext, fn) {
  ext = (ext[0] === '.') ? ext.slice(1) : ext;

  if (Array.isArray(fn)) {
    return this.compose(ext, fn);
  }

  fn.promise = true;
  this.cache[ext] = [fn];
  return this;
};

/**
 * Register the given stream loader callback `fn` as `ext`. Any arbitrary
 * name can be assigned to a loader, however, the loader will only be
 * called when either:
 *   a. `ext` matches the file extension of a path passed to the `.load()` method, or
 *   b. `ext` is an arbitrary name passed on the loader stack of another loader. Example below.
 *
 * **Examples**
 *
 * ```js
 * // register an stream loader for parsing YAML
 * loaders.registerStream('yaml', es.through(function(fp) {
 *   this.emit('data', YAML.safeLoad(fp));
 * });
 *
 * // register a loader to be used in other loaders
 * loaders.registerStream('read', function(fp) {
 *   fs.readFile(fp, 'utf8', function (err, content) {
 *     this.emit('data', content);
 *   });
 * });
 *
 * // create a new loader from the `yaml` and `read` loaders.
 * loaders.registerStream('yml', ['read', 'yaml']);
 * ```
 *
 * @param {String|Array} `ext` File extension or name of the loader.
 * @param {Stream|Array} `fn` A stream loader, or create a loader from other others by passing an array of names.
 * @return {Object} `Loaders` to enable chaining
 * @api public
 */

Loaders.prototype.registerStream = function(ext, fn) {
  ext = (ext[0] === '.') ? ext.slice(1) : ext;

  if (Array.isArray(fn)) {
    return this.compose(ext, fn);
  }

  fn.stream = true;
  this.cache[ext] = [fn];
  return this;
};

/**
 * Create a loader from other (previously cached) loaders. For
 * example, you might create a loader like the following:
 *
 * **Example**
 *
 * ```js
 * // arbitrary name, so it won't match file extensions. This
 * // loader will be used in other loaders for reading files
 * loaders.register('read', function(fp) {
 *   return fs.readFileSync(fp, 'utf8');
 * });
 *
 * // Parse a string of YAML
 * loaders.register('yaml', function(fp) {
 *   return YAML.safeLoad(fp);
 * });
 *
 * // Compose a new loader that will read a file, then parse it as YAML
 * loaders.compose('yml', ['read', 'yaml']);
 *
 * // you can alternatively do the same thing with the register method, e.g.
 * loaders.register('yml', ['read', 'yaml']);
 * ```
 *
 * @param {String} `ext` File extension to select the loader or loader stack to use.
 * @param {String} `loaders` Array of loader names.
 * @return {Object} `Loaders` to enable chaining
 * @api private
 */

Loaders.prototype.compose = function(ext, loaders) {
  loaders.reduce(function(stack, loader) {
    stack[ext] = stack[ext] || [];
    stack[ext] = stack[ext].concat(this.cache[loader]);
    return stack;
  }.bind(this), this.cache);
  return this;
};

/**
 * Validate loaders associated with a given laoder type.
 *
 * **Example**
 *
 * ```js
 * var valid = loaders.validate('async', fns);
 * ```
 *
 * @param {String} `type` Type of loader to check for.
 * @param {Array} `fns` Loader functions to validate
 * @return {Boolean}
 * @api public
 */

Loaders.prototype.validate = function(type, fns) {
  fns.forEach(function (fn) {
    if (!fn[type]) {
      throw new Error('Invalid loader type for ' + (fn.name == undefined ? 'annoyomous' : fn.name) + '. Expected ' + type);
    }
  });
  return true;
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
  var ext = path.extname(fp);
  var fns = this.cache[ext.slice(1)];
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
 * });
 * ```
 *
 * @param {String} `fp` File path to load.
 * @param {Object} `options` Options to pass to whatever loaders are defined.
 * @param {Function} `done` Callback to indicate loading has finished
 * @return {String}
 * @api public
 */

Loaders.prototype.loadAsync = function(fp, options, done) {
  if (typeof options === 'function') {
    done = options;
    options = {};
  }
  var ext = path.extname(fp);
  var fns = this.cache[ext.slice(1)];
  if (!fns) return fp;

  this.validate('async', fns);
  async.reduce(fns, fp, function (acc, fn, next) {
    fn(acc, options, next);
  }, done);
};

/**
 * Run promise loaders associated with `ext` of the given filepath.
 *
 * **Example**
 *
 * ```js
 * // this will run the `yml` promise loader from the `.compose()` example
 * loaders.loadPromise('config.yml').then(function (results) {
 * });
 * ```
 *
 * @param {String} `fp` File path to load.
 * @param {Object} `options` Options to pass to whatever loaders are defined.
 * @return {Promise} a promise that will be fulfilled later
 * @api public
 */

Loaders.prototype.loadPromise = function(fp, options) {
  var current = Promise.resolve();
  options = options || {};
  var ext = path.extname(fp);
  var fns = this.cache[ext.slice(1)];
  if (!fns) return current.then(function () { return fp; });

  this.validate('promise', fns);
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
 * loaders.LoadStream('config.yml').on('data', function (results) {
 * });
 * ```
 *
 * @param {String} `fp` File path to load.
 * @param {Object} `options` Options to pass to whatever loaders are defined.
 * @return {Promise} a stream that will be fulfilled later
 * @api public
 */

Loaders.prototype.loadStream = function(fp, options) {
  options = options || {};
  var ext = path.extname(fp);
  var fns = this.cache[ext.slice(1)];
  if (!fns) {
    var noop = es.through(function (fp) { 
      this.emit('data', fp);
    });
    noop.stream = true;
    fns = [noop];
  }

  this.validate('stream', fns);
  var stream = es.pipe.apply(es, fns);
  process.nextTick(function () {
    stream.write(fp);
    stream.end();
  });
  return stream;
};
