'use strict';

module.exports = function iteratorStream(app, stack) {
  return function (obj) {
    var es = require('event-stream');
    if (!stack.length) {
      var noop = es.through(function (obj) {
        this.emit('data', obj);
      });
      noop.stream = true;
      stack = [noop];
    }

    var len = stack.length, i = 0;
    while (len--) {
      var fn = stack[i++];
      if (typeof fn === 'function') {
        stack[i - 1] = es.through(fn);
      }
    }
    var stream = es.pipe.apply(es, stack);
    process.nextTick(function () {
      stream.write(obj);
      stream.end();
    });
    return stream;
  };
};
