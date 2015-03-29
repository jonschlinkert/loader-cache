/*!
 * loader-cache <https://github.com/jonschlinkert/loader-cache>
 *
 * Copyright (c) 2014-2015, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';

/* deps:mocha */
var fs = require('fs');
var path = require('path');
var Promise = require('bluebird');
var es = require('event-stream');
var YAML = require('js-yaml');
var Loaders = require('./');
require('should');

var loaders;

describe('loaders (sync)', function () {
  beforeEach(function() {
    loaders = new Loaders();

    loaders.compose('yaml', function yaml(str) {
      return YAML.safeLoad(str);
    });

    loaders.compose('yml', ['yaml']);

    loaders.compose('json', function json(fp) {
      return require(path.resolve(fp));
    });

    loaders.compose('read', function read(fp) {
      return fs.readFileSync(fp, 'utf8');
    });

    loaders.compose('hbs', ['read']);

    loaders.compose('data', function data(obj) {
      obj.e = 'f';
      return obj;
    });
  });

  it('should register loaders:', function () {
    loaders.cache.sync.should.have.properties('yaml', 'yml', 'json', 'read', 'hbs', 'data');
  });

  it('should compose a loader from other loaders with the `.compose()` method:', function () {
    loaders.compose('foo', ['read', 'yaml']);
    loaders.cache.sync.should.have.property('foo');
  });

  it('should compose a loader from other loaders with the `.register()` method:', function () {
    loaders.compose('foo', ['read', 'yaml']);
    loaders.cache.sync.should.have.property('foo');
  });

  it('should compose a loader from other loaders and functions with the `.compose()` method:', function () {
    function bar (fp) { return fp; }
    function baz (contents) { return contents; };
    loaders.compose('foo', bar, ['read'], baz, ['yaml']);
    loaders.cache.sync.should.have.property('foo');
    loaders.cache.sync.foo.length.should.be.eql(4);
  });

  it('should compose a loader from other loaders and functions with the `.register()` method:', function () {
    function bar (fp) { return fp; }
    function baz (contents) { return contents; };
    loaders.compose('foo', bar, ['read'], baz, ['yaml']);
    loaders.cache.sync.should.have.property('foo');
    loaders.cache.sync.foo.length.should.be.eql(4);
  });

  it('should pass the value returned from a loader to the next loader:', function () {
    loaders.compose('bar', ['read', 'yaml', 'data']);
    loaders.load('fixtures/a.bar').should.eql({c: 'd', e: 'f'});
  });

  it('should pass the value returned from a loader to the next loader:', function () {
    function foo (fp) { return fp; }
    function baz (contents) { return contents; };
    loaders.compose('bar', foo, ['read'], baz, ['yaml', 'data']);
    loaders.load('fixtures/a.bar').should.eql({c: 'd', e: 'f'});
  });

  it('should compose a loader from other loaders and the given function:', function () {
    loaders.compose('foo', ['read', 'yaml'], function foo(val) {
      return val;
    });
    loaders.cache.sync.should.have.property('foo');
  });

  it('should pass the value returned from a loader to the next loader:', function () {
    loaders.compose('bar', ['read', 'yaml', 'data']);
    loaders.load('fixtures/a.bar').should.eql({c: 'd', e: 'f'});
  });

  it('should use loaders passed in at load time:', function () {
    loaders.compose('bar', ['read', 'yaml']);
    loaders.load('fixtures/a.bar', ['data']).should.eql({c: 'd', e: 'f'});
  });

  it('should compose a loader from other loaders:', function () {
    loaders.compose('parse', ['read', 'yaml']);
    loaders.compose('extend', ['data']);
    loaders.compose('bar', ['parse', 'extend']);
    loaders.load('fixtures/a.bar').should.eql({c: 'd', e: 'f'});
  });

  it('should use a custom function for matching loaders:', function () {
    loaders.compose('parse', ['read', 'yaml']);
    loaders.compose('extend', ['data']);
    loaders.compose('bar', ['parse', 'extend']);
    loaders.load('fixtures/a.bar', {
      matchLoader: function(pattern) {
        return path.extname(pattern).slice(1);
      }
    }).should.eql({c: 'd', e: 'f'});
  });
});

describe('loaders async', function () {
  beforeEach(function() {
    loaders = new Loaders();

    loaders.composeAsync('yaml', function yaml(str, options, next) {
      next(null, YAML.safeLoad(str));
    });

    loaders.composeAsync('yml', function yml(str, options, next) {
      next(null, YAML.safeLoad(str));
    });

    loaders.composeAsync('json', function json(fp, options, next) {
      next(null, require(path.resolve(fp)));
    });

    loaders.composeAsync('read', function read(fp, options, next) {
      fs.readFile(fp, 'utf8', next);
    });

    loaders.composeAsync('hbs', function hbs(fp, options, next) {
      fs.readFile(fp, 'utf8', next);
    });

    loaders.composeAsync('data', function data(obj, options, next) {
      obj.e = 'f';
      next(null, obj);
    });
  });

  it('should register async loaders:', function () {
    loaders.cache.async.should.have.properties('yaml', 'yml', 'json', 'read', 'hbs', 'data');
  });

  it('should compose an async loader from other async loaders with the `.compose()` method:', function () {
    loaders.compose('foo', ['read', 'yaml'], 'async');
    loaders.cache.async.should.have.property('foo');
  });

  it('should compose an async loader from other async loaders with the `.register()` method:', function () {
    loaders.composeAsync('foo', ['read', 'yaml']);
    loaders.cache.async.should.have.property('foo');
  });

  it('should compose an async loader from other async loaders and functions with the `.compose()` method:', function () {
    function bar (fp, options, next) { next(null, fp); }
    function baz (contents, options, next) { next(null, contents); };
    loaders.compose('foo', bar, ['read'], baz, ['yaml'], 'async');
    loaders.cache.async.should.have.property('foo');
    loaders.cache.async.foo.length.should.be.eql(4);
  });

  it('should compose an async loader from other async loaders and functions with the `.register()` method:', function () {
    function bar (fp, options, next) { next(null, fp); }
    function baz (contents, options, next) { next(null, contents); };
    loaders.composeAsync('foo', bar, ['read'], baz, ['yaml']);
    loaders.cache.async.should.have.property('foo');
    loaders.cache.async.foo.length.should.be.eql(4);
  });


  it('should pass the value returned from an async loader to the next async loader:', function (done) {
    loaders.composeAsync('bar', ['read', 'yaml', 'data']);
    loaders.loadAsync('fixtures/a.bar', function (err, obj) {
      obj.should.eql({c: 'd', e: 'f'});
      done();
    });
  });

  it('should pass the value returned from an async loader to the next async loader:', function (done) {
    function foo (fp, options, next) { next(null, fp); }
    function baz (contents, options, next) { next(null, contents); };
    loaders.composeAsync('bar', foo, ['read'], baz, ['yaml', 'data']);
    loaders.loadAsync('fixtures/a.bar', function (err, obj) {
      obj.should.eql({c: 'd', e: 'f'});
      done();
    });
  });

  it('should pass the value returned from an async loader to the next async loader:', function (done) {
    loaders.compose('bar', ['read', 'yaml', 'data'], 'async');
    loaders.loadAsync('fixtures/a.bar', function (err, obj) {
      obj.should.eql({c: 'd', e: 'f'});
      done();
    });
  });

  it('should use async loaders passed in at load time:', function (done) {
    loaders.compose('bar', ['read', 'yaml'], 'async');
    loaders.loadAsync('fixtures/a.bar', ['data'], function (err, obj) {
      obj.should.eql({c: 'd', e: 'f'});
      done();
    });
  });

  it('should compose an async loader from other async loaders:', function (done) {
    loaders.compose('parse', ['read', 'yaml'], 'async');
    loaders.compose('extend', ['data'], 'async');
    loaders.compose('bar', ['parse', 'extend'], 'async');
    loaders.loadAsync('fixtures/a.bar', function (err, obj) {
      obj.should.eql({c: 'd', e: 'f'});
      done();
    });
  });
});

describe('loaders promise', function () {
  beforeEach(function() {
    loaders = new Loaders();

    loaders.composePromise('yaml', Promise.method(function yaml(str) {
      return YAML.safeLoad(str);
    }));

    loaders.composePromise('yml', Promise.method(function yml(str) {
      return YAML.safeLoad(str);
    }));

    loaders.composePromise('json', Promise.method(function json(fp) {
      return require(path.resolve(fp));
    }));

    loaders.composePromise('read', Promise.method(function read(fp) {
      return fs.readFileSync(fp, 'utf8');
    }));

    loaders.composePromise('hbs', Promise.method(function hbs(fp) {
      return fs.readFileSync(fp, 'utf8');
    }));

    loaders.composePromise('data', Promise.method(function data(obj) {
      obj.e = 'f';
      return obj;
    }));
  });

  it('should register promise loaders:', function () {
    loaders.cache.promise.should.have.properties('yaml', 'yml', 'json', 'read', 'hbs', 'data');
  });

  it('should compose a promise loader from other promise loaders with the `.compose()` method:', function () {
    loaders.compose('foo', ['read', 'yaml'], 'promise');
    loaders.cache.promise.should.have.property('foo');
  });

  it('should compose a promise loader from other promise loaders with the `.register()` method:', function () {
    loaders.composePromise('foo', ['read', 'yaml']);
    loaders.cache.promise.should.have.property('foo');
  });

  it('should compose a promise loader from other promise loaders and functions with the `.compose()` method:', function () {
    var bar = Promise.method(function bar (fp) { return fp; });
    var baz = Promise.method(function baz (contents) { return contents; });
    loaders.compose('foo', bar, ['read'], baz, ['yaml'], 'promise');
    loaders.cache.promise.should.have.property('foo');
    loaders.cache.promise.foo.length.should.be.eql(4);
  });

  it('should compose a promise loader from other promise loaders and functions with the `.register()` method:', function () {
    var bar = Promise.method(function bar (fp) { return fp; });
    var baz = Promise.method(function baz (contents) { return contents; });
    loaders.composePromise('foo', bar, ['read'], baz, ['yaml']);
    loaders.cache.promise.should.have.property('foo');
    loaders.cache.promise.foo.length.should.be.eql(4);
  });

  it('should pass the value returned from a promise loader to the next promise loader:', function (done) {
    var foo = Promise.method(function foo (fp) { return fp; });
    var baz = Promise.method(function baz (contents) { return contents; });
    loaders.composePromise('bar', foo, ['read'], baz, ['yaml', 'data']);
    loaders.loadPromise('fixtures/a.bar').then(function (results) {
      results.should.eql({c: 'd', e: 'f'});
      done();
    });
  });

  it('should pass the value returned from a promise loader to the next promise loader:', function (done) {
    loaders.composePromise('bar', ['read', 'yaml', 'data']);
    loaders.loadPromise('fixtures/a.bar').then(function (results) {
      results.should.eql({c: 'd', e: 'f'});
      done();
    });
  });

  it('should pass the value returned from a promise loader to the next promise loader:', function (done) {
    loaders.compose('bar', ['read', 'yaml', 'data'], 'promise');
    loaders.loadPromise('fixtures/a.bar').then(function (results) {
      results.should.eql({c: 'd', e: 'f'});
      done();
    });
  });

  it('should use promise loaders passed in at load time:', function (done) {
    loaders.compose('bar', ['read', 'yaml'], 'promise');
    loaders.loadPromise('fixtures/a.bar', ['data']).then(function (results) {
      results.should.eql({c: 'd', e: 'f'});
      done();
    });
  });

  it('should compose a promise loader from other promise loaders:', function (done) {
    loaders.compose('parse', ['read', 'yaml'], 'promise');
    loaders.compose('extend', ['data'], 'promise');
    loaders.compose('bar', ['parse', 'extend'], 'promise');
    loaders.loadPromise('fixtures/a.bar').then(function (results) {
      results.should.eql({c: 'd', e: 'f'});
      done();
    });
  });
});


describe('loaders stream', function () {
  beforeEach(function() {
    loaders = new Loaders();

    loaders.composeStream('yaml', es.through(function yaml(str) {
      this.emit('data', YAML.safeLoad(str));
    }));

    loaders.composeStream('yml', es.through(function yml(str) {
      this.emit('data', YAML.safeLoad(str));
    }));

    loaders.composeStream('json', es.through(function json(fp) {
      this.emit('data', require(path.resolve(fp)));
    }));

    loaders.composeStream('read', es.through(function read(fp) {
      this.emit('data', fs.readFileSync(fp, 'utf8'));
    }));

    loaders.composeStream('hbs', es.through(function hbs(fp) {
      this.emit('data', fs.readFileSync(fp, 'utf8'));
    }));

    loaders.composeStream('data', es.through(function data(obj) {
      obj.e = 'f';
      this.emit('data', obj);
    }));
  });

  it('should register stream loaders:', function () {
    loaders.cache.stream.should.have.properties('yaml', 'yml', 'json', 'read', 'hbs', 'data');
  });

  it('should compose a stream loader from other stream loaders with the `.compose()` method:', function () {
    loaders.compose('foo', ['read', 'yaml'], 'stream');
    loaders.cache.stream.should.have.property('foo');
  });

  it('should compose a stream loader from other stream loaders with the `.register()` method:', function () {
    loaders.composeStream('foo', ['read', 'yaml']);
    loaders.cache.stream.should.have.property('foo');
  });

  it('should compose a stream loader from other stream loaders and functions with the `.compose()` method:', function () {
    var bar = es.through(function bar (fp) { this.emit('data', fp); });
    var baz = es.through(function baz (contents) { this.emit('data', contents); });
    loaders.compose('foo', bar, ['read'], baz, ['yaml'], 'stream');
    loaders.cache.stream.should.have.property('foo');
    loaders.cache.stream.foo.length.should.be.eql(4);
  });

  it('should compose a stream loader from other stream loaders and functions with the `.register()` method:', function () {
    var bar = es.through(function bar (fp) { this.emit('data', fp); });
    var baz = es.through(function baz (contents) { this.emit('data', contents); });
    loaders.composeStream('foo', bar, ['read'], baz, ['yaml']);
    loaders.cache.stream.should.have.property('foo');
    loaders.cache.stream.foo.length.should.be.eql(4);
  });

  it('should pass the value from a stream loader to the next stream loader:', function (done) {
    var foo = es.through(function foo (fp) { this.emit('data', fp); });
    var baz = es.through(function baz (contents) { this.emit('data', contents); });
    loaders.composeStream('bar', foo, ['read'], baz, ['yaml', 'data']);
    loaders.loadStream('fixtures/a.bar')
      .on('data', function (results) {
        results.should.eql({c: 'd', e: 'f'});
      })
      .on('end', done);
  });

  it('should pass the value from a stream loader to the next stream loader:', function (done) {
    loaders.composeStream('bar', ['read', 'yaml', 'data']);
    loaders.loadStream('fixtures/a.bar').on('data', function (results) {
      results.should.eql({c: 'd', e: 'f'});
    }).on('end', done);
  });

  it('should pass the value from a stream loader to the next stream loader:', function (done) {
    loaders.composeStream('bar', ['read', 'yaml', 'data']);
    loaders.loadStream('fixtures/a.bar')
      .on('data', function (results) {
        results.should.eql({c: 'd', e: 'f'});
      })
      .on('end', done);
    });

  it('should use stream loaders passed in at load time:', function (done) {
    loaders.compose('bar', ['read', 'yaml'], 'stream');
    loaders.loadStream('fixtures/a.bar', ['data'])
      .on('data', function (results) {
        results.should.eql({c: 'd', e: 'f'});
      })
      .on('end', done);
  });

  it('should compose a stream loader from other stream loaders:', function (done) {
    loaders.compose('parse', ['read', 'yaml'], 'stream');
    loaders.compose('extend', ['data'], 'stream');
    loaders.compose('bar', ['parse', 'extend'], 'stream');
    loaders.loadStream('fixtures/a.bar').on('data', function (results) {
      results.should.eql({c: 'd', e: 'f'});
    }).on('end', done);
  });
});
