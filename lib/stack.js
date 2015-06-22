'use strict';

var utils = require('./utils');

/**
 * Create a new instance of `LoaderStack`
 *
 * ```js
 * var loaders = new LoaderStack();
 * ```
 * @api public
 */

function LoaderStack(loaders) {
  if (!(this instanceof LoaderStack)) {
    return new LoaderStack(loaders);
  }
}

/**
 * Push loaders onto the stack.
 *
 * @param {String} `name`
 * @param {Function} `fn`
 * @api public
 */

LoaderStack.prototype.set = function(key, loaders) {
  this[key] = this.union(key, [].slice.call(arguments, 1));
  return this;
};

LoaderStack.prototype.get = function(val) {
  return this[val] || val;
};

LoaderStack.prototype.union = function(key, val) {
  return utils.union(this[key] || [], val);
};

LoaderStack.prototype.resolve = function() {
  var args = utils.union([].slice.call(arguments));
  var res = [], self = this;

  function build(stack) {
    stack = self.get(stack);
    var len = stack.length, i = 0;
    while (len--) {
      var val = self.get(stack[i++]);
      if (Array.isArray(val)) {
        build(val, res);
      } else {
        res.push(val);
      }
    }
    return res;
  }
  return build(args);
};

/**
 * Expose `LoaderStack`
 */

module.exports = LoaderStack;
