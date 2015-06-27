'use strict';

var Emitter = require('component-emitter');
var extend = require('extend-shallow');
var get = require('get-value');
var set = require('set-value');
var LoaderType = require('./lib/type');
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
  Emitter.call(this);
  this.options = options || {};
  this.defaultType = this.options.defaultType || 'sync';
  this.types = [];
  this.decorate('resolve');
  this.decorate('get');
}

/**
 * LoaderStack prototype methods.
 */

LoaderCache.prototype = Emitter({
  contructor: LoaderCache,

  // get: function (type, name) {
  //   return this[type].get(name);
  // },

  // resolve: function (type, stack) {
  //   var args = [].slice.call(arguments, 1);
  //   var fn = this[type].resolve;
  //   return fn.apply(this[type], args);
  // },

  /**
   * Set an option.
   *
   * @param  {String|Object} `prop` Option key or object.
   * @param  {*} `value`
   * @api public
   */

  option: function(prop, value) {
    var len = arguments.length;
    var type = typeof prop;

    if (type === 'string' && len === 1) {
      return get(this.options, prop);
    } else if (type === 'object') {
      utils.visit(this, 'option', prop);
      return this;
    }

    set(this.options, prop, value);
    this.emit('option', prop, value);
    return this;
  },

  /**
   * Decorate the given method onto the LoaderCache instance.
   *
   * @param  {String} `method` Method name to decorate
   * @param  {String} `alias` Optionally specify an alias to use
   * @return {String}
   */

  decorate: function(method, alias) {
    utils.defineProp(this, method, function() {
      var args = utils.slice(arguments);
      var opts = args.shift();
      var type = this.getLoaderType(opts);
      var inst = this[type];
      return inst[alias || method].apply(inst, arguments);
    });
  },

  /**
   * Register an iterator function of the given `type`. Types typically
   * represent a kind of flow-control, like `sync`, `promise`, `stream`,
   * `async` etc.
   *
   * @param  {String} `type`
   * @param  {Object} `options`
   * @param  {Function} `fn` The actual iterator function.
   * @return {Object}
   * @api public
   */

  iterator: function(type, options, fn) {
    if (arguments.length === 1) {
      return this[type].iterator.fn;
    }
    if (typeof options === 'function') {
      fn = options;
      options = {};
    }
    this[type] = new LoaderType(options, fn.bind(this));
    this.setLoaderType(type);
    return this;
  },

  /**
   * Set a loader.
   *
   * @param  {String} `name`
   * @param  {Object} `options`
   * @param  {Function|Array} `fns` One or more loader functions or names of other registered loaders.
   * @return {Array}
   */

  loader: function(name/*, options, fns*/) {
    var args = utils.slice(arguments, 1);
    var opts = args.shift();
    var type = this.getLoaderType(opts);
    this[type].set(name, this[type].resolve(args));
    return this;
  },

  seq: function (type, stack) {
    var args = this.resolve([].slice.call(arguments, 1));
    var iterator = this[type].iterator.fn;
    return iterator(args);
  },

  setLoaderType: function(type) {
    if (this.types.indexOf(type) === -1) {
      this.types.push(type);
    }
  },

  getLoaderType: function(options) {
    var opts = extend({loaderType: this.defaultType}, options);
    var type = opts.loaderType || 'sync';
    if (!this[type]) {
      throw new Error('LoaderCache: invalid loader type: ' + type);
    }
    return type;
  },

  compose: function(name, options, stack) {
    var args = utils.slice(arguments);
    var opts = {};
    name = args.shift();

    if (!utils.isLoader(options)) {
      opts = args.shift();
    }

    var type = this.getLoaderType(opts);
    opts.loaderType = type;

    var inst = this[type];
    var iterator = this.iterator(type);

    stack = inst.resolve(inst.get(name).concat(args));

    var ctx = { app: this };
    ctx.options = opts;
    ctx.iterator = inst.iterator;
    ctx.loaders = inst;

    return function () {
      var args = [].slice.call(arguments).filter(Boolean);
      var len = args.length, loaders = [], cb = null;

      while (len-- > 1) {
        var arg = args[len];
        if (!utils.isLoader(arg)) break;
        loaders.unshift(args.pop());
      }

      // combine the `create` and collection stacks
      loaders = stack.concat(inst.resolve(loaders));

      // if loading is async, move the done function to args
      if (type === 'async') {
        args = args.concat(loaders.pop());
      }

      loaders = inst.resolve(loaders);
      if (loaders.length === 0) {
        loaders = inst.resolve(opts.defaultLoader || [])
      }
      var wrapped = loaders.map(opts.wrap || utils.identity);

      // create the actual `load` function
      var load = iterator.call(this, wrapped);
      return load.apply(ctx, args);
    }.bind(this);
  }
});

/**
 * Expose `LoaderCache`
 */

module.exports = LoaderCache;
