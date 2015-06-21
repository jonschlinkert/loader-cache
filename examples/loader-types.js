
var LoaderType = require('../lib/type');
var type = new LoaderType(function () {
  return [].slice.call(arguments);
});

type.create('sync');

type.sync.set('s', function a() {});
type.sync.set('a', function b() {});
type.sync.set('b', ['a'], function b() {});
type.sync.set('c', ['b'], function c() {});
type.sync.set('d', ['c'], function d() {});

console.log(type.sync.resolve('d'))


