'use strict';

var extend = require('extend-shallow');
var LoaderType = require('./loader-type');
var utils = require('./lib/utils');

/**
 * Create a new instance of `LoaderCache`
 *
 * ```js
 * var LoaderCache = require('loader-cache');
 * var loaders = new LoaderCache();
 * ```
 * @api public
 */

function LoaderCache(options) {
  if (!(this instanceof LoaderCache)) {
    return new LoaderCache(options);
  }
  this.options = options || {};
  this.defaultType = this.options.defaultType || 'sync';
  this.types = [];
}

LoaderCache.prototype = {
  contructor: LoaderCache,

  iterator: function(type, options, fn) {
    if (arguments.length === 1) {
      return this[type].iterator.fn;
    }
    this[type] = new LoaderType(options, fn);
    this.setLoaderType(type);
  },

  setLoaderType: function(type) {
    if (this.types.indexOf(type) === -1) {
      this.types.push(type);
    }
  },

  getLoaderType: function(options) {
    var opts = extend({loaderType: this.defaultType}, options);
    var type = opts.loaderType;
    if (!this[type]) {
      throw new Error('LoaderCache: invalid loader type: ' + type);
    }
    return type;
  },

  loader: function(name/*, options, fns*/) {
    var args = utils.slice(arguments, 1);
    var opts = args.shift();
    var type = this.getLoaderType(opts);
    this[type].set(name, this[type].resolve(args));
    return this[type];
  },

  get: function(name, options) {
    var type = this.getLoaderType(options);
    return this[type].resolve(name);
  },

  /**
   * Get the loaders from the end of an array.
   *
   * @param  {Array} `arr`
   * @return {Array}
   */

  getLoaders: function(arr) {
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
  },

  compose: function(/*options, loaders*/) {
    var args = utils.slice(arguments);
    var opts = args.shift();

    var type = this.getLoaderType(opts);
    var inst = this[type];
    var last = inst.loaders.last;

    var stack = inst.resolve(args);
    var load = this.iterator(type);

    return function (/*key, value, locals, options*/) {
      args = [].slice.call(arguments);
      var fns = this.getLoaders(args);
      stack = inst.resolve(stack, fns, last);

      args = args.slice(0, args.length - fns.length);
      var fn = load.call(this, stack);
      return fn.apply(this, args);
    }.bind(this);
  }
};

/**
 * Expose `LoaderCache`
 */

module.exports = LoaderCache;
