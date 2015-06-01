/*!
 * loader-cache <https://github.com/jonschlinkert/loader-cache>
 *
 * Copyright (c) 2014-2015, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';

/* deps:mocha */
var path = require('path');
var Promise = require('bluebird');
var es = require('event-stream');
var YAML = require('js-yaml');
var Loaders = require('./');
var fs = require('fs');
require('should');

var loaders;

describe('loaders (sync)', function () {
  beforeEach(function() {
    loaders = new Loaders();

    loaders.register('yaml', function yaml(str) {
      return YAML.safeLoad(str);
    });

    loaders.register('yml', ['yaml']);

    loaders.register('json', function json(fp) {
      return require(path.resolve(fp));
    });

    loaders.register('read', function read(fp) {
      return fs.readFileSync(fp, 'utf8');
    });

    loaders.register('hbs', ['read']);

    loaders.register('data', function data(obj) {
      obj.e = 'f';
      return obj;
    });
  });

  it('should register loaders:', function () {
    loaders.cache.should.have.properties('yaml', 'yml', 'json', 'read', 'hbs', 'data');
  });

  it('should compose a loader from other loaders with the `.compose()` method:', function () {
    loaders.compose('foo', ['read', 'yaml']);
    loaders.cache.should.have.property('foo');
  });

  it('should compose a loader from other loaders with the `.register()` method:', function () {
    loaders.register('foo', ['read', 'yaml']);
    loaders.cache.should.have.property('foo');
  });

  it('should compose a loader from other loaders and functions with the `.compose()` method:', function () {
    function bar (fp) { return fp; }
    function baz (contents) { return contents; };
    loaders.compose('foo', [bar, 'read', baz, 'yaml']);
    loaders.cache.should.have.property('foo');
    loaders.cache.foo.length.should.be.eql(4);
  });

  it('should compose a loader from other loaders and functions with the `.register()` method:', function () {
    function bar (fp) { return fp; }
    function baz (contents) { return contents; };
    loaders.register('foo', [bar, 'read', baz, 'yaml']);
    loaders.cache.should.have.property('foo');
    loaders.cache.foo.length.should.be.eql(4);
  });

  it('should pass the value returned from a loader to the next loader:', function () {
    loaders.register('bar', ['read', 'yaml', 'data']);
    loaders.loader('bar')('fixtures/a.bar').should.eql({c: 'd', e: 'f'});
  });

  it('should pass the value returned from a loader to the next loader:', function () {
    function foo (fp) { return fp; }
    function baz (contents) { return contents; };
    loaders.register('bar', [foo, 'read', baz, 'yaml', 'data']);
    loaders.loader('bar')('fixtures/a.bar').should.eql({c: 'd', e: 'f'});
  });

  it('should compose a loader from other loaders and the given function:', function () {
    loaders.register('foo', ['read', 'yaml'], function foo(val) {
      return val;
    });
    loaders.cache.should.have.property('foo');
  });

  it('should pass the value returned from a loader to the next loader:', function () {
    loaders.compose('bar', ['read', 'yaml', 'data']);
    loaders.loader('bar')('fixtures/a.bar').should.eql({c: 'd', e: 'f'});
  });

  it('should use loaders passed in at load time:', function () {
    loaders.compose('bar', ['read', 'yaml']);
    loaders.loader('bar', ['data'])('fixtures/a.bar').should.eql({c: 'd', e: 'f'});
  });

  it('should compose a loader from other loaders:', function () {
    loaders.compose('parse', ['read', 'yaml']);
    loaders.compose('extend', ['data']);
    loaders.compose('bar', ['parse', 'extend']);
    loaders.loader('bar')('fixtures/a.bar').should.eql({c: 'd', e: 'f'});
  });
});

describe('loaders async', function () {
  beforeEach(function() {
    loaders = new Loaders();

    loaders.register('yaml', function yaml(str, next) {
      next(null, YAML.safeLoad(str));
    });

    loaders.register('yml', function yml(str, next) {
      next(null, YAML.safeLoad(str));
    });

    loaders.register('json', function json(fp, next) {
      next(null, require(path.resolve(fp)));
    });

    loaders.register('read', function read(fp, next) {
      fs.readFile(fp, 'utf8', next);
    });

    loaders.register('hbs', function hbs(fp, next) {
      fs.readFile(fp, 'utf8', next);
    });

    loaders.register('data', function data(obj, next) {
      obj.e = 'f';
      next(null, obj);
    });
  });

  it('should register async loaders:', function () {
    loaders.cache.should.have.properties('yaml', 'yml', 'json', 'read', 'hbs', 'data');
  });

  it('should compose an async loader from other async loaders with the `.compose()` method:', function () {
    loaders.compose('foo', ['read', 'yaml']);
    loaders.cache.should.have.property('foo');
  });

  it('should compose an async loader from other async loaders with the `.register()` method:', function () {
    loaders.register('foo', ['read', 'yaml']);
    loaders.cache.should.have.property('foo');
  });

  it('should compose an async loader from other async loaders and functions with the `.compose()` method:', function () {
    function bar (fp, next) { next(null, fp); }
    function baz (contents, next) { next(null, contents); };
    loaders.compose('foo', bar, ['read'], baz, ['yaml']);
    loaders.cache.should.have.property('foo');
    loaders.cache.foo.length.should.be.eql(4);
  });

  it('should compose an async loader from other async loaders and functions with the `.register()` method:', function () {
    function bar (fp, next) { next(null, fp); }
    function baz (contents, next) { next(null, contents); };
    loaders.register('foo', bar, ['read'], baz, ['yaml']);
    loaders.cache.should.have.property('foo');
    loaders.cache.foo.length.should.be.eql(4);
  });


  it('should pass the value returned from an async loader to the next async loader:', function (done) {
    loaders.register('bar', ['read', 'yaml', 'data']);
    loaders.loaderAsync('bar')('fixtures/a.bar', function (err, obj) {
      obj.should.eql({c: 'd', e: 'f'});
      done();
    });
  });

  it('should pass the value returned from an async loader to the next async loader:', function (done) {
    function foo (fp, next) { next(null, fp); }
    function baz (contents, next) { next(null, contents); };
    loaders.register('bar', foo, ['read'], baz, ['yaml', 'data']);
    loaders.loaderAsync('bar')('fixtures/a.bar', function (err, obj) {
      obj.should.eql({c: 'd', e: 'f'});
      done();
    });
  });

  it('should pass the value returned from an async loader to the next async loader:', function (done) {
    loaders.compose('bar', ['read', 'yaml', 'data']);
    loaders.loaderAsync('bar')('fixtures/a.bar', function (err, obj) {
      obj.should.eql({c: 'd', e: 'f'});
      done();
    });
  });

  it('should use async loaders passed in at load time:', function (done) {
    loaders.compose('bar', ['read', 'yaml']);
    loaders.loaderAsync('bar', ['data'])('fixtures/a.bar', function (err, obj) {
      obj.should.eql({c: 'd', e: 'f'});
      done();
    });
  });

  it('should compose an async loader from other async loaders:', function (done) {
    loaders.compose('parse', ['read', 'yaml']);
    loaders.compose('extend', ['data']);
    loaders.compose('bar', ['parse', 'extend']);
    loaders.loaderAsync('bar')('fixtures/a.bar', function (err, obj) {
      obj.should.eql({c: 'd', e: 'f'});
      done();
    });
  });
});

describe('loaders promise', function () {
  beforeEach(function() {
    loaders = new Loaders();

    loaders.register('yaml', Promise.method(function yaml(str) {
      return YAML.safeLoad(str);
    }));

    loaders.register('yml', Promise.method(function yml(str) {
      return YAML.safeLoad(str);
    }));

    loaders.register('json', Promise.method(function json(fp) {
      return require(path.resolve(fp));
    }));

    loaders.register('read', Promise.method(function read(fp) {
      return fs.readFileSync(fp, 'utf8');
    }));

    loaders.register('hbs', Promise.method(function hbs(fp) {
      return fs.readFileSync(fp, 'utf8');
    }));

    loaders.register('data', Promise.method(function data(obj) {
      obj.e = 'f';
      return obj;
    }));
  });

  it('should register promise loaders:', function () {
    loaders.cache.should.have.properties('yaml', 'yml', 'json', 'read', 'hbs', 'data');
  });

  it('should compose a promise loader from other promise loaders with the `.compose()` method:', function () {
    loaders.compose('foo', ['read', 'yaml']);
    loaders.cache.should.have.property('foo');
  });

  it('should compose a promise loader from other promise loaders with the `.register()` method:', function () {
    loaders.register('foo', ['read', 'yaml']);
    loaders.cache.should.have.property('foo');
  });

  it('should compose a promise loader from other promise loaders and functions with the `.compose()` method:', function () {
    var bar = Promise.method(function bar (fp) { return fp; });
    var baz = Promise.method(function baz (contents) { return contents; });
    loaders.compose('foo', bar, ['read'], baz, ['yaml']);
    loaders.cache.should.have.property('foo');
    loaders.cache.foo.length.should.be.eql(4);
  });

  it('should compose a promise loader from other promise loaders and functions with the `.register()` method:', function () {
    var bar = Promise.method(function bar (fp) { return fp; });
    var baz = Promise.method(function baz (contents) { return contents; });
    loaders.register('foo', bar, ['read'], baz, ['yaml']);
    loaders.cache.should.have.property('foo');
    loaders.cache.foo.length.should.be.eql(4);
  });

  it('should pass the value returned from a promise loader to the next promise loader:', function (done) {
    var foo = Promise.method(function foo (fp) { return fp; });
    var baz = Promise.method(function baz (contents) { return contents; });
    loaders.register('bar', foo, ['read'], baz, ['yaml', 'data']);
    loaders.loaderPromise('bar')('fixtures/a.bar').then(function (results) {
      results.should.eql({c: 'd', e: 'f'});
      done();
    });
  });

  it('should pass the value returned from a promise loader to the next promise loader:', function (done) {
    loaders.register('bar', ['read', 'yaml', 'data']);
    loaders.loaderPromise('bar')('fixtures/a.bar').then(function (results) {
      results.should.eql({c: 'd', e: 'f'});
      done();
    });
  });

  it('should pass the value returned from a promise loader to the next promise loader:', function (done) {
    loaders.compose('bar', ['read', 'yaml', 'data']);
    loaders.loaderPromise('bar')('fixtures/a.bar').then(function (results) {
      results.should.eql({c: 'd', e: 'f'});
      done();
    });
  });

  it('should use promise loaders passed in at load time:', function (done) {
    loaders.compose('bar', ['read', 'yaml']);
    loaders.loaderPromise('bar', ['data'])('fixtures/a.bar').then(function (results) {
      results.should.eql({c: 'd', e: 'f'});
      done();
    });
  });

  it('should compose a promise loader from other promise loaders:', function (done) {
    loaders.compose('parse', ['read', 'yaml']);
    loaders.compose('extend', ['data']);
    loaders.compose('bar', ['parse', 'extend']);
    loaders.loaderPromise('bar')('fixtures/a.bar').then(function (results) {
      results.should.eql({c: 'd', e: 'f'});
      done();
    });
  });
});


describe('loaders stream', function () {
  beforeEach(function() {
    loaders = new Loaders();

    loaders.register('yaml', es.through(function yaml(str) {
      this.emit('data', YAML.safeLoad(str));
    }));

    loaders.register('yml', es.through(function yml(str) {
      this.emit('data', YAML.safeLoad(str));
    }));

    loaders.register('json', es.through(function json(fp) {
      this.emit('data', require(path.resolve(fp)));
    }));

    loaders.register('read', es.through(function read(fp) {
      this.emit('data', fs.readFileSync(fp, 'utf8'));
    }));

    loaders.register('hbs', es.through(function hbs(fp) {
      this.emit('data', fs.readFileSync(fp, 'utf8'));
    }));

    loaders.register('data', es.through(function data(obj) {
      obj.e = 'f';
      this.emit('data', obj);
    }));
  });

  it('should register stream loaders:', function () {
    loaders.cache.should.have.properties('yaml', 'yml', 'json', 'read', 'hbs', 'data');
  });

  it('should compose a stream loader from other stream loaders with the `.compose()` method:', function () {
    loaders.compose('foo', ['read', 'yaml']);
    loaders.cache.should.have.property('foo');
  });

  it('should compose a stream loader from other stream loaders with the `.register()` method:', function () {
    loaders.register('foo', ['read', 'yaml']);
    loaders.cache.should.have.property('foo');
  });

  it('should compose a stream loader from other stream loaders and functions with the `.compose()` method:', function () {
    var bar = es.through(function bar (fp) { this.emit('data', fp); });
    var baz = es.through(function baz (contents) { this.emit('data', contents); });
    loaders.compose('foo', bar, ['read'], baz, ['yaml']);
    loaders.cache.should.have.property('foo');
    loaders.cache.foo.length.should.be.eql(4);
  });

  it('should compose a stream loader from other stream loaders and functions with the `.register()` method:', function () {
    var bar = es.through(function bar (fp) { this.emit('data', fp); });
    var baz = es.through(function baz (contents) { this.emit('data', contents); });
    loaders.register('foo', bar, ['read'], baz, ['yaml']);
    loaders.cache.should.have.property('foo');
    loaders.cache.foo.length.should.be.eql(4);
  });

  it('should pass the value from a stream loader to the next stream loader:', function (done) {
    var foo = es.through(function foo (fp) { this.emit('data', fp); });
    var baz = es.through(function baz (contents) { this.emit('data', contents); });
    loaders.register('bar', foo, ['read'], baz, ['yaml', 'data']);
    loaders.loaderStream('bar')('fixtures/a.bar')
      .on('data', function (results) {
        results.should.eql({c: 'd', e: 'f'});
      })
      .on('end', done);
  });

  it('should pass the value from a stream loader to the next stream loader:', function (done) {
    loaders.register('bar', ['read', 'yaml', 'data']);
    loaders.loaderStream('bar')('fixtures/a.bar').on('data', function (results) {
      results.should.eql({c: 'd', e: 'f'});
    }).on('end', done);
  });

  it('should pass the value from a stream loader to the next stream loader:', function (done) {
    loaders.compose('bar', ['read', 'yaml', 'data']);
    loaders.loaderStream('bar')('fixtures/a.bar')
      .on('data', function (results) {
        results.should.eql({c: 'd', e: 'f'});
      })
      .on('end', done);
    });

  it('should use stream loaders passed in at load time:', function (done) {
    loaders.compose('bar', ['read', 'yaml']);
    loaders.loaderStream('bar', ['data'])('fixtures/a.bar')
      .on('data', function (results) {
        results.should.eql({c: 'd', e: 'f'});
      })
      .on('end', done);
  });

  it('should compose a stream loader from other stream loaders:', function (done) {
    loaders.compose('parse', ['read', 'yaml']);
    loaders.compose('extend', ['data']);
    loaders.compose('bar', ['parse', 'extend']);
    loaders.loaderStream('bar')('fixtures/a.bar').on('data', function (results) {
      results.should.eql({c: 'd', e: 'f'});
    }).on('end', done);
  });
});
