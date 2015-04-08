'use strict';

var fs = require('fs');
var LoaderCache = require('./');
var app = new LoaderCache();

app.register('file', function (fp) {
  return {path: fp, content: fp};
});

app.register('init', function (file) {
  file.content = fs.readFileSync(file.content, 'utf8');
  return file;
});

app.register('parse', function (file) {
  file.content = JSON.parse(file.content);
  return file;
});

// app.register('template', ['file', 'init', 'parse']);

// function create(name, options, loaders) {
//   return function () {
//     var args = [].slice.call(arguments);
//     var res = normalize(name, args, loaders);
//     return app.load.apply(app, res);
//   }
// }

// var pages = create('pages', ['init', 'parse']);
// var page = pages('package.json', ['file']);
// console.log(page)

// var layouts = create('layouts', ['init', 'parse']);
// var layout = layouts('package.json', function (fp) {
//   return {path: fp, content: fp};
// });
// console.log(layout)
// console.log(app)

// function normalize(name, arr, loaders) {
//   var len = arr.length;
//   var last = arr[len - 1];
//   if (typeof last === 'function') {
//     last = [last];
//   }
//   if (Array.isArray(last)) {
//     arr.splice(len -1, 1, last.concat(loaders));
//   }
//   return arr;
// }

// function type (name, loaders) {
//   return function () {
//     var len = arguments.length;
//     var args = new Array(len);
//     var last;

//     for (var i = 0; i < len; i++) {
//       args[i] = arguments[i];
//       if (i === len - 1) {
//         last = arguments[i];
//       }
//     }

//     if (typeof last === 'function') {
//       last = [last].concat(loaders);
//       args.pop();
//       args.push(last);
//     }

//     if (Array.isArray(last)) {
//       last = last.concat(loaders);
//       args.pop();
//       args.push(last);
//     }
//     return app.load.apply(app, args);
//   }
// }

// var fn = type('pages', ['init', 'parse']);
// var foo = fn('package.json', ['file']);

// console.log(foo)
