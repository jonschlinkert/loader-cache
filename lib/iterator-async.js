'use strict';

module.exports = function iteratorAync (app, stack) {
  return function (/* arguments */) {
    var args = arrayify(arguments);
    var done = args.pop();
    var results = null;
    var len = stack.length, i = 0;
    args.unshift(null);
    if (!len) return done.apply(done, args);
    next.apply(next, args);

    function next (err/*, arguments */) {
      args = arrayify(arguments);
      err = args.shift();
      if (err) return done(err);
      if (i >= len) return done(null, args.shift());

      var fn = stack[i++];
      args.push(next);
      fn.apply(fn, args);
    }
  };
};

function arrayify (args) {
  var len = args.length, i = 0;
  var results = new Array(len);
  while (len--) results[i] = args[i++];
  return results;
}
