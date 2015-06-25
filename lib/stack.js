'use strict';

var arrayify = require('arrayify-compact');

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
 * LoaderStack prototype methods.
 */

LoaderStack.prototype = {

  /**
   * Push loaders onto the stack.
   *
   * @param {String} `name`
   * @param {Function} `fn`
   * @api public
   */

  createStack: function(name) {
    this[name] = this[name] || {};
    this[name].stack = this[name].stack || [];
    this[name].first = this[name].first || [];
    this[name].last = this[name].last || [];
    return this;
  },

  set: function(name, fns) {
    this.createStack(name);
    this[name].stack.push.apply(this[name].stack, arrayify(fns));
    return this;
  },

  get: function(name) {
    return this[name] ? this[name].stack : name;
  },

  seq: function (name) {
    return this.iterator(this.resolve(name));
  },

  first: function(name, fn) {
    this.createStack(name);
    if (!fn) return this[name].first;
    var stack = arrayify([].slice.call(arguments, 1));
    this[name].first = this.resolve(stack);
    return this;
  },

  last: function(name, fn) {
    this.createStack(name);
    if (!fn) return this[name].last;
    var stack = arrayify([].slice.call(arguments, 1));
    this[name].last = this.resolve(stack);
    return this;
  },

  resolve: function() {
    var args = arrayify([].slice.call(arguments));
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
  }
};


/**
 * Expose `LoaderStack`
 */

module.exports = LoaderStack;
