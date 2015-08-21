'use strict';

var lazy = require('lazy-cache')(require);
lazy('arrayify-compact', 'arrayify');

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
    this[name] = this[name] || [];
    return this;
  },

  set: function(name, fns) {
    this.createStack(name);
    this[name].push.apply(this[name], lazy.arrayify(fns));
    return this;
  },

  get: function(name) {
    return this[name] || name;
  },

  seq: function (name) {
    return this.iterator(this.resolve(name));
  },

  resolve: function() {
    var args = lazy.arrayify([].slice.call(arguments));
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
