/*!
 * loader-cache <https://github.com/jonschlinkert/loader-cache>
 *
 * Copyright (c) 2014-2015, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';

/* deps: mocha */
require('should');
var path = require('path');
var glob = require('glob');
var assert = require('assert');
var extend = require('extend-shallow');
var Promise = require('bluebird');
var es = require('event-stream');
var YAML = require('js-yaml');
var Loaders = require('./');
var fs = require('fs');
var loaders;

describe('loader-cache', function () {
  beforeEach(function() {
    loaders = new Loaders();
  });

  describe('iterators', function() {
    it('should store an iterator:', function () {
      loaderCache.iterator('sync', function() {});
      loaderCache.iterators.should.have.property('sync');
    });

    it('should store iterators as a function:', function () {
      loaderCache.iterator('sync', function() {});
      assert.equal(typeof loaderCache.iterators.sync, 'function');
    });
  });
});

describe('loaders (sync)', function () {
  beforeEach(function() {
    loaders = new Loaders();
    loaderCache.iterator('sync', require('iterator-sync'));

    loaderCache.loader('yaml', function yaml(str) {
      return YAML.safeLoad(str);
    });

    loaderCache.loader('yml', ['yaml']);
    loaderCache.loader('json', function json(fp) {
      return require(path.resolve(fp));
    });

    loaderCache.loader('read', function read(fp) {
      return fs.readFileSync(fp, 'utf8');
    });

    loaderCache.loader('hbs', ['read']);

    loaderCache.loader('data', function data(obj) {
      obj.e = 'f';
      return obj;
    });
  });

  it('should register loaders:', function () {
    loaderCache.loaders.should.have.property('sync');
    loaderCache.loaders.sync.should.have.properties('yaml', 'yml', 'json', 'read', 'hbs', 'data');
  });

  it('should register a loader created from other loaders:', function () {
    loaderCache.loader('foo', ['read', 'yaml']);
    loaderCache.loaders.sync.should.have.property('foo');
  });

  it('should register a loader created from other loaders:', function () {
    loaderCache.loader('foo', ['read', 'yaml']);
    loaderCache.loaders.sync.should.have.property('foo');
  });

  it('should register a loader created from other loaders and functions:', function () {
    function bar (fp) { return fp; }
    function baz (contents) { return contents; }
    loaderCache.loader('foo', [bar, 'read', baz, 'yaml']);
    loaderCache.loaders.sync.should.have.property('foo');
    loaderCache.loaders.sync.foo.length.should.be.eql(4);
  });

  it('should register a loader created from other loaders and functions:', function () {
    function bar (fp) { return fp; }
    function baz (contents) { return contents; }
    loaderCache.loader('foo', [bar, 'read', baz, 'yaml']);
    loaderCache.loaders.sync.should.have.property('foo');
    loaderCache.loaders.sync.foo.length.should.be.eql(4);
  });

  it('should pass the value returned from a loader to the next loader:', function () {
    loaderCache.loader('bar', ['read', 'yaml', 'data']);
    loaderCache.compose({}, ['bar'])('fixtures/a.bar')
    //.should.eql({c: 'd', e: 'f'});
  });
});



//   it('should pass the value returned from a loader to the next loader:', function () {
//     function foo (fp) { return fp; }
//     function baz (contents) { return contents; }
//     loaderCache.loader('bar', [foo, 'read', baz, 'yaml', 'data']);
//     loaderCache.compose('bar')('fixtures/a.bar').should.eql({c: 'd', e: 'f'});
//   });

//   it('should expose the loader instance as `this` in loaders:', function () {
//     loaderCache.loader('a', function a(fp) {
//       return fs.readFileSync(fp, 'utf8');
//     });
//     loaderCache.loader('b', function b(fp) {
//       return YAML.load(this.compose('a')(fp));
//     });
//     loaderCache.loader('c', function c(pattern) {
//       return glob.sync(pattern);
//     });
//     loaderCache.loader('d', ['c'], function d(files) {
//       return files.map(this.compose('b'));
//     });
//     loaderCache.loader('e', function e(arr) {
//       return extend.apply(extend, [{}].concat(arr));
//     });
//     loaderCache.loader('parse', ['d', 'e']);
//     loaderCache.compose(['parse'])('fixtures/*.txt').should.eql({c: 'd', e: 'f'});
//     loaderCache.compose('parse')('fixtures/*.txt').should.eql({c: 'd', e: 'f'});
//     loaderCache.compose(['d', 'e'])('fixtures/*.txt').should.eql({c: 'd', e: 'f'});
//   });

//   it('should register a loader from other loaders and the given function:', function () {
//     loaderCache.loader('foo', ['read', 'yaml'], function foo(val) {
//       return val;
//     });
//     loaderCache.loaders.sync.should.have.property('foo');
//   });

//   it('should pass the value returned from a loader to the next loader:', function () {
//     loaderCache.loader('bar', ['read', 'yaml', 'data']);
//     loaderCache.compose('bar')('fixtures/a.bar').should.eql({c: 'd', e: 'f'});
//   });

//   it('should use loaders passed in at load time:', function () {
//     loaderCache.loader('bar', ['read', 'yaml']);
//     loaderCache.compose('bar', ['data'])('fixtures/a.bar').should.eql({c: 'd', e: 'f'});
//   });

//   it('should register a loader from other loaders:', function () {
//     loaderCache.loader('parse', ['read', 'yaml']);
//     loaderCache.loader('extend', ['data']);
//     loaderCache.loader('bar', ['parse', 'extend']);
//     loaderCache.compose('bar')('fixtures/a.bar').should.eql({c: 'd', e: 'f'});
//   });
// });

// describe('loaders async', function () {
//   beforeEach(function() {
//     loaders = new Loaders({iterator: require('iterator-async')});

//     loaderCache.loader('yaml', function yaml(str, next) {
//       next(null, YAML.safeLoad(str));
//     });

//     loaderCache.loader('yml', function yml(str, next) {
//       next(null, YAML.safeLoad(str));
//     });

//     loaderCache.loader('json', function json(fp, next) {
//       next(null, require(path.resolve(fp)));
//     });

//     loaderCache.loader('read', function read(fp, next) {
//       fs.readFile(fp, 'utf8', next);
//     });

//     loaderCache.loader('hbs', function hbs(fp, next) {
//       fs.readFile(fp, 'utf8', next);
//     });

//     loaderCache.loader('data', function data(obj, next) {
//       obj.e = 'f';
//       next(null, obj);
//     });
//   });

//   it('should register async loaders:', function () {
//     loaderCache.loaders.sync.should.have.properties('yaml', 'yml', 'json', 'read', 'hbs', 'data');
//   });

//   it('should register an async loader from other async loaders:', function () {
//     loaderCache.loader('foo', ['read', 'yaml']);
//     loaderCache.loaders.sync.should.have.property('foo');
//   });

//   it('should register an async loader from other async loaders:', function () {
//     loaderCache.loader('foo', ['read', 'yaml']);
//     loaderCache.loaders.sync.should.have.property('foo');
//   });

//   it('should register an async loader from other async loaders and functions:', function () {
//     function bar (fp, next) { next(null, fp); }
//     function baz (contents, next) { next(null, contents); }
//     loaderCache.loader('foo', bar, ['read'], baz, ['yaml']);
//     loaderCache.loaders.sync.should.have.property('foo');
//     loaderCache.loaders.foo.length.should.be.eql(4);
//   });

//   it('should register an async loader from other async loaders and functions:', function () {
//     function bar (fp, next) { next(null, fp); }
//     function baz (contents, next) { next(null, contents); }
//     loaderCache.loader('foo', bar, ['read'], baz, ['yaml']);
//     loaderCache.loaders.sync.should.have.property('foo');
//     loaderCache.loaders.foo.length.should.be.eql(4);
//   });


//   it('should pass the value returned from an async loader to the next async loader:', function (done) {
//     loaderCache.loader('bar', ['read', 'yaml', 'data']);
//     loaderCache.compose('bar')('fixtures/a.bar', function (err, obj) {
//       obj.should.eql({c: 'd', e: 'f'});
//       done();
//     });
//   });

//   it('should pass the value returned from an async loader to the next async loader:', function (done) {
//     function foo (fp, next) { next(null, fp); }
//     function baz (contents, next) { next(null, contents); }
//     loaderCache.loader('bar', foo, ['read'], baz, ['yaml', 'data']);
//     loaderCache.compose('bar')('fixtures/a.bar', function (err, obj) {
//       obj.should.eql({c: 'd', e: 'f'});
//       done();
//     });
//   });

//   it('should pass the value returned from an async loader to the next async loader:', function (done) {
//     loaderCache.loader('bar', ['read', 'yaml', 'data']);
//     loaderCache.compose('bar')('fixtures/a.bar', function (err, obj) {
//       obj.should.eql({c: 'd', e: 'f'});
//       done();
//     });
//   });

//   it('should use async loaders passed in at load time:', function (done) {
//     loaderCache.loader('bar', ['read', 'yaml']);
//     loaderCache.compose('bar', ['data'])('fixtures/a.bar', function (err, obj) {
//       obj.should.eql({c: 'd', e: 'f'});
//       done();
//     });
//   });

//   it('should register an async loader from other async loaders:', function (done) {
//     loaderCache.loader('parse', ['read', 'yaml']);
//     loaderCache.loader('extend', ['data']);
//     loaderCache.loader('bar', ['parse', 'extend']);
//     loaderCache.compose('bar')('fixtures/a.bar', function (err, obj) {
//       obj.should.eql({c: 'd', e: 'f'});
//       done();
//     });
//   });
// });

// describe('loaders promise', function () {
//   beforeEach(function() {
//     loaders = new Loaders({iterator: require('iterator-promise')});

//     loaderCache.loader('yaml', Promise.method(function yaml(str) {
//       return YAML.safeLoad(str);
//     }));

//     loaderCache.loader('yml', Promise.method(function yml(str) {
//       return YAML.safeLoad(str);
//     }));

//     loaderCache.loader('json', Promise.method(function json(fp) {
//       return require(path.resolve(fp));
//     }));

//     loaderCache.loader('read', Promise.method(function read(fp) {
//       return fs.readFileSync(fp, 'utf8');
//     }));

//     loaderCache.loader('hbs', Promise.method(function hbs(fp) {
//       return fs.readFileSync(fp, 'utf8');
//     }));

//     loaderCache.loader('data', Promise.method(function data(obj) {
//       obj.e = 'f';
//       return obj;
//     }));
//   });

//   it('should register promise loaders:', function () {
//     loaderCache.loaders.sync.should.have.properties('yaml', 'yml', 'json', 'read', 'hbs', 'data');
//   });

//   it('should register a promise loader from other promise loaders:', function () {
//     loaderCache.loader('foo', ['read', 'yaml']);
//     loaderCache.loaders.sync.should.have.property('foo');
//   });

//   it('should register a promise loader from other promise loaders:', function () {
//     loaderCache.loader('foo', ['read', 'yaml']);
//     loaderCache.loaders.sync.should.have.property('foo');
//   });

//   it('should register a promise loader from other promise loaders and functions:', function () {
//     var bar = Promise.method(function bar (fp) { return fp; });
//     var baz = Promise.method(function baz (contents) { return contents; });
//     loaderCache.loader('foo', bar, ['read'], baz, ['yaml']);
//     loaderCache.loaders.sync.should.have.property('foo');
//     loaderCache.loaders.foo.length.should.be.eql(4);
//   });

//   it('should register a promise loader from other promise loaders and functions:', function () {
//     var bar = Promise.method(function bar (fp) { return fp; });
//     var baz = Promise.method(function baz (contents) { return contents; });
//     loaderCache.loader('foo', bar, ['read'], baz, ['yaml']);
//     loaderCache.loaders.sync.should.have.property('foo');
//     loaderCache.loaders.foo.length.should.be.eql(4);
//   });

//   it('should pass the returned value to the next promise loader:', function (done) {
//     var foo = Promise.method(function foo (fp) { return fp; });
//     var baz = Promise.method(function baz (contents) { return contents; });
//     loaderCache.loader('bar', foo, ['read'], baz, ['yaml', 'data']);
//     loaderCache.compose('bar')('fixtures/a.bar').then(function (results) {
//       results.should.eql({c: 'd', e: 'f'});
//       done();
//     });
//   });

//   it('should pass the returned value to the next promise loader:', function (done) {
//     loaderCache.loader('bar', ['read', 'yaml', 'data']);
//     loaderCache.compose('bar')('fixtures/a.bar').then(function (results) {
//       results.should.eql({c: 'd', e: 'f'});
//       done();
//     });
//   });

//   it('should pass the returned value to the next promise loader:', function (done) {
//     loaderCache.loader('bar', ['read', 'yaml', 'data']);
//     loaderCache.compose('bar')('fixtures/a.bar').then(function (results) {
//       results.should.eql({c: 'd', e: 'f'});
//       done();
//     });
//   });

//   it('should use promise loaders passed in at load time:', function (done) {
//     loaderCache.loader('bar', ['read', 'yaml']);
//     loaderCache.compose('bar', ['data'])('fixtures/a.bar').then(function (results) {
//       results.should.eql({c: 'd', e: 'f'});
//       done();
//     });
//   });

//   it('should register a promise loader from other promise loaders:', function (done) {
//     loaderCache.loader('parse', ['read', 'yaml']);
//     loaderCache.loader('extend', ['data']);
//     loaderCache.loader('bar', ['parse', 'extend']);
//     loaderCache.compose('bar')('fixtures/a.bar').then(function (results) {
//       results.should.eql({c: 'd', e: 'f'});
//       done();
//     });
//   });
// });

// describe('loaders stream', function () {
//   beforeEach(function() {
//     loaders = new Loaders({iterator: require('iterator-streams')});

//     loaderCache.loader('yaml', es.through(function yaml(str) {
//       this.emit('data', YAML.safeLoad(str));
//     }));

//     loaderCache.loader('yml', es.through(function yml(str) {
//       this.emit('data', YAML.safeLoad(str));
//     }));

//     loaderCache.loader('json', es.through(function json(fp) {
//       this.emit('data', require(path.resolve(fp)));
//     }));

//     loaderCache.loader('read', es.through(function read(fp) {
//       this.emit('data', fs.readFileSync(fp, 'utf8'));
//     }));

//     loaderCache.loader('hbs', es.through(function hbs(fp) {
//       this.emit('data', fs.readFileSync(fp, 'utf8'));
//     }));

//     loaderCache.loader('data', es.through(function data(obj) {
//       obj.e = 'f';
//       this.emit('data', obj);
//     }));
//   });

//   it('should register stream loaders:', function () {
//     loaderCache.loaders.sync.should.have.properties('yaml', 'yml', 'json', 'read', 'hbs', 'data');
//   });

//   it('should register a stream loader from other stream loaders:', function () {
//     loaderCache.loader('foo', ['read', 'yaml']);
//     loaderCache.loaders.sync.should.have.property('foo');
//   });

//   it('should register a stream loader from other stream loaders:', function () {
//     loaderCache.loader('foo', ['read', 'yaml']);
//     loaderCache.loaders.sync.should.have.property('foo');
//   });

//   it('should create a loader from other loaders and functions:', function () {
//     var bar = es.through(function bar (fp) { this.emit('data', fp); });
//     var baz = es.through(function baz (contents) { this.emit('data', contents); });
//     loaderCache.loader('foo', bar, ['read'], baz, ['yaml']);
//     loaderCache.loaders.sync.should.have.property('foo');
//     loaderCache.loaders.foo.length.should.be.eql(4);
//   });

//   it('should create a loader from other loaders and functions:', function () {
//     var bar = es.through(function bar (fp) { this.emit('data', fp); });
//     var baz = es.through(function baz (contents) { this.emit('data', contents); });
//     loaderCache.loader('foo', bar, ['read'], baz, ['yaml']);
//     loaderCache.loaders.sync.should.have.property('foo');
//     loaderCache.loaders.foo.length.should.be.eql(4);
//   });

//   it('should pass the value from a stream loader to the next stream loader:', function (done) {
//     var foo = es.through(function foo (fp) { this.emit('data', fp); });
//     var baz = es.through(function baz (contents) { this.emit('data', contents); });
//     loaderCache.loader('bar', foo, ['read'], baz, ['yaml', 'data']);
//     loaderCache.compose('bar')('fixtures/a.bar')
//       .on('data', function (results) {
//         results.should.eql({c: 'd', e: 'f'});
//       })
//       .on('end', done);
//   });

//   it('should pass the value to the next stream loader:', function (done) {
//     loaderCache.loader('bar', ['read', 'yaml', 'data']);
//     loaderCache.compose('bar')('fixtures/a.bar').on('data', function (results) {
//       results.should.eql({c: 'd', e: 'f'});
//     }).on('end', done);
//   });

//   it('should pass the value to the next stream loader:', function (done) {
//     loaderCache.loader('bar', ['read', 'yaml', 'data']);
//     loaderCache.compose('bar')('fixtures/a.bar')
//       .on('data', function (results) {
//         results.should.eql({c: 'd', e: 'f'});
//       })
//       .on('end', done);
//     });

//   it('should use stream loaders passed in at load time:', function (done) {
//     loaderCache.loader('bar', ['read', 'yaml']);
//     loaderCache.compose('bar', ['data'])('fixtures/a.bar')
//       .on('data', function (results) {
//         results.should.eql({c: 'd', e: 'f'});
//       })
//       .on('end', done);
//   });

//   it('should register a stream loader from other stream loaders:', function (done) {
//     loaderCache.loader('parse', ['read', 'yaml']);
//     loaderCache.loader('extend', ['data']);
//     loaderCache.loader('bar', ['parse', 'extend']);
//     loaderCache.compose('bar')('fixtures/a.bar').on('data', function (results) {
//       results.should.eql({c: 'd', e: 'f'});
//     }).on('end', done);
//   });
// });
