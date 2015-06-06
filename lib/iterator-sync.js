'use strict';

module.exports = function iteratorSync(app, stack) {
  return function () {
    var results = null;
    var len = stack.length, i = 0;
    while (len--) {
      var fn = stack[i++].bind(app);
      var args = i === 1 ? arguments : [results];
      results = fn.apply(fn, args);
    }
    return results;
  };
};
