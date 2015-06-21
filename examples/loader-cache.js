
var LoaderCache = require('..');
var loaders = new LoaderCache({defaultType: 'sync'});

loaders.iterator('sync', function (stack) {
  return function (arg) {
    var len = stack.length, i = -1;
    while (len--) {
      var fn = stack[++i];
      if (i === 0) {
        arg = fn.apply(this, arguments);
      } else {
        arg = fn.call(this, arg);
      }
    }
    return arg;
  };
});

loaders.sync.set('a', function a(key, val) {
  var res = {};
  res[key] = val;
  return res;
});

loaders.sync.set('b', function b(obj) {
  obj.a = 'b';
  return obj;
});

loaders.sync.set('c', function b(obj) {
  obj.c = 'd';
  return obj;
});

loaders.sync.set('d', ['a', 'b', 'c'], function b(obj) {
  obj.e = 'f';
  return obj;
});

// var stack = loaders.sync.resolve('b');
var fn = loaders.compose({loaderType: 'sync'}, 'd');

var res = fn('one', 'two');
console.log(res);
