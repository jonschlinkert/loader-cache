'use strict';

module.exports = function iteratorStream (stack) {
  return function (obj) {
    var es = require('event-stream');
    if (!stack.length) {
      var noop = es.through(function (obj) {
        this.emit('data', obj);
      });
      noop.stream = true;
      stack = [noop];
    }

    var stream = es.pipe.apply(es, stack);
    process.nextTick(function () {
      stream.write(obj);
      stream.end();
    });
    return stream;
  };
};
