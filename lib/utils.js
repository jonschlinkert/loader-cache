'use strict';

var isObject = require('isobject');
var flatten = require('arr-flatten');

/**
 * Expose `utils`
 */

var utils = module.exports;

utils.flatten = flatten;

utils.identity = function identity(val) {
  return val;
};

/**
 * Normalize arguments.
 */

utils.slice = function slice(arr, i) {
  var args = [].slice.call(arr, i);
  var opts = {};
  if (!utils.isLoader(args[0])) {
    opts = args.shift();
  }
  opts = opts || {};
  return flatten([opts, args]);
};

/**
 * Call `method` on each value in `obj`.
 *
 * @param  {Object} `thisArg` The context in which to invoke `method`
 * @param  {String} `method` Name of the method to call on `thisArg`
 * @param  {Object} `obj` Object to iterate over
 * @return {Object} `thisArg` for chaining.
 */

utils.visit = function visit(thisArg, method, obj) {
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      thisArg[method](key, obj[key]);
    }
  }
  return thisArg;
};

/**
 * Return true if the given value is a loader.
 *
 * @param  {Object} `val`
 * @return {Boolean}
 */

utils.isLoader = function isLoader(val, cache) {
  return typeof val === 'function'
    || cache && typeof val === 'string' && cache[val]
    || utils.isStream(val)
    || utils.isPromise(val)
    || Array.isArray(val);
};

/**
 * Return true if the given object is a stream.
 *
 * @param  {Object} `val`
 * @return {Boolean}
 */

utils.isStream = function isStream (val) {
  return val && isObject(val) && typeof val.pipe === 'function';
};

/**
 * Return true if the given object is a promise.
 *
 * @param  {Object} `val`
 * @return {Boolean}
 */

utils.isPromise = function isPromise(val) {
  return val && isObject(val) && typeof val.then === 'function';
};

/**
 * Add a non-enumerable property to `receiver`
 *
 * @param  {Object} `obj`
 * @param  {String} `name`
 * @param  {Function} `val`
 */

utils.defineProp = function defineProp(receiver, key, value) {
  return Object.defineProperty(receiver, key, {
    configurable: true,
    enumerable: false,
    get: function () {
      return value;
    },
    set: function (val) {
      value = val;
    }
  });
};
