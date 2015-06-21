'use strict';

var util = require('util');
var LoaderStack = require('./loader-stack');
var Iterator = require('./iterator');

/**
 * Create a new instance of `LoaderType`
 *
 * ```js
 * var LoaderType = require('loader-cache');
 * var loaders = new LoaderType();
 * ```
 * @api public
 */

function LoaderType(options, fn) {
  if (!(this instanceof LoaderType)) {
    return new LoaderType(options);
  }
  LoaderStack.call(this);
  this.iterator = new Iterator(options, fn);
}
util.inherits(LoaderType, LoaderStack);

/**
 * Expose `LoaderType`
 */

module.exports = LoaderType;
