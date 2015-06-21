
var util = require('util');
var LoaderCache = require('..');

function App(options) {
  LoaderCache.call(this, options);
  this.views = {};
  this.loaders = {};
}
util.inherits(App, LoaderCache);

App.prototype.create = function(name, opts, loaders) {
  var args = [].slice.call(arguments, 1);
  this.views[name] = {};

  this.loader(name, opts, loaders);
  this.loader('last', opts, last(name));

  this[name] = this.compose.apply(this, args);
};

var app = new App({defaultType: 'sync'});
var opts = {loaderType: 'sync'};

app.iterator('async', function (stack) {
});

app.iterator('sync', function (stack) {
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
  }.bind(this);
});

function last(collection) {
  return function(obj) {
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        this.views[collection][key] = obj[key];
      }
    }
    return obj;
  };
}


app.loader('a', function a(key, val) {
  obj.a = 'b';
  return obj;
});

app.loader('b', ['a'], function b(obj) {
  obj.c = 'd';
  return obj;
});

app.create('pages', opts, function pages(key, value) {
  var res = {};
  res[key] = value;
  return res;
});

app.pages('a', 'b');
app.pages('c', 'd');

// var stack = app.sync.resolve('b');
// var fn = app.compose({loaderType: 'sync'}, 'b');

// var res = fn('one', 'two');
console.log(app.views.pages);
