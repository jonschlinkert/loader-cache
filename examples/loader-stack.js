
var Stack = require('../lib/stack');
var stack = new Stack();

stack.set('a', function a() {});
stack.set('a', function b() {});
stack.set('b', ['a'], function b() {});
stack.set('c', ['b'], function c() {});
stack.set('d', ['c'], function d() {});

console.log(stack.resolve('d'))
