'use strict';

var lazy = require('lazy-cache')(require);
var isObject = require('isobject');
var flatten = lazy('arr-flatten');
var setValue = lazy('set-value');
var getValue = lazy('get-value');

/**
 * Expose `utils`
 */

var utils = module.exports;

utils.flatten = flatten();

/**
 * Normalize arguments.
 */

utils.slice = function slice(arr, i) {
  var args = [].slice.call(arr, i);
  var opts = {};
  if (!utils.isLoader(args[0])) {
    opts = args.shift();
  }
  return utils.flatten([opts, args]);
};

/**
 * Returns true if the value looks like an options object.
 */

utils.isOptions = function isOptions(val) {
  return val && isObject(val)
    && !utils.isPromise(val)
    && !utils.isStream(val);
};

/**
 * Concatenate and flatten multiple arrays, filtering
 * falsey values from the result set.
 *
 * @param {Array} `arrays` One or more arrays
 * @return {Array}
 */

utils.union = function union() {
  var arr = [].concat.apply([], [].slice.call(arguments));
  return flatten()(arr).filter(Boolean);
};

/**
 * Cast val to an array.
 */

utils.arrayify = function arrayify(val) {
  return Array.isArray(val) ? val : [val];
};

/**
 * Set a value on an object using array-dot-notation.
 *
 * @param  {Array|String} `prop` Object path.
 * @param  {Object} `val` The value to set.
 */

utils.set = function set(obj, prop, val) {
  prop = utils.union(prop).join('.');
  setValue()(obj, prop, val);
  return this;
};

/**
 * Get a value from an object by passing an array of
 * property paths to be used as dot notation.
 *
 * @param  {Object} `obj` The object to get a value from.
 * @param  {Array|String} `prop` Object path.
 */

utils.get = function get(obj, prop) {
  prop = utils.union(prop).join('.');
  return getValue()(obj, prop);
};

/**
 * Return true if the given value is a loader.
 *
 * @param  {Object} `val`
 * @return {Boolean}
 */

utils.isLoader = function isLoader(val, cache) {
  return typeof val === 'function'
    || cache && typeof val === 'string' && cache[string]
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

utils.isStream = function isStream(val) {
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