'use strict';

/**
 * Create a new instance of `Iterator`
 *
 * ```js
 * var iterator = new Iterator();
 * ```
 * @api public
 */

function Iterator(options, fn) {
  if (typeof options === 'function') {
    fn = options;
    options = {};
  }
  if (typeof fn !== 'function') {
    throw new TypeError('Iterator expects `fn` to be a function.');
  }
  this.options = options || {};
  this.fn = fn;
}

/**
 * Expose `Iterator`
 */

module.exports = Iterator;
