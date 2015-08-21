'use strict';

/* deps: mocha */
require('should');
var fs = require('fs');
var path = require('path');
var glob = require('glob');
var assert = require('assert');
var extend = require('extend-shallow');
var Promise = require('bluebird');
var es = require('event-stream');
var YAML = require('js-yaml');
var LoaderCache = require('./');
var loaders;

describe('loader-cache', function () {
  beforeEach(function() {
    loaders = new LoaderCache();
  });

  describe('iterators', function() {
    it('should store an iterator:', function () {
      loaders.iterator('sync', function() {});
      loaders.sync.should.have.property('iterator');
    });

    it('should store iterators as a function:', function () {
      loaders.iterator('sync', function() {});
      assert.equal(typeof loaders.sync.iterator.fn, 'function');
    });
  });
});

describe('loaders (sync)', function () {
  beforeEach(function() {
    loaders = new LoaderCache();
    loaders.iterator('sync', require('iterator-sync'));

    loaders.loader('yaml', function yaml(str) {
      return YAML.safeLoad(str);
    });

    loaders.loader('yml', ['yaml']);
    loaders.loader('json', function json(fp) {
      return require(path.resolve(fp));
    });

    loaders.loader('read', function read(fp) {
      return fs.readFileSync(fp, 'utf8');
    });

    loaders.loader('hbs', ['read']);

    loaders.loader('data', function data(obj) {
      obj.e = 'f';
      return obj;
    });
  });

  it('should register loaders:', function () {
    loaders.should.have.property('sync');
    loaders.sync.should.have.properties('yaml', 'yml', 'json', 'read', 'hbs', 'data');
  });

  it('should resolve loaders:', function () {
    loaders.loader('a', function () {});
    loaders.loader('b', ['a'], function () {});
    loaders.loader('c', ['b'], function () {});
    loaders.loader('d', ['c'], function () {});

    var res = loaders.resolve('d')
    assert.equal(Array.isArray(res), true);

    res.forEach(function(fn) {
      assert.equal(typeof fn, 'function');
    });
  });

  it('should compose a function from a loader stack:', function () {
    loaders.loader('foo', ['read', 'yaml']);
    var fn = loaders.compose('foo');
    assert.equal(typeof fn, 'function');
  });

  it('should register a loader created from other loaders:', function () {
    loaders.loader('foo', ['read', 'yaml']);
    loaders.sync.should.have.property('foo');
  });

  it('should register a loader created from other loaders:', function () {
    loaders.loader('foo', ['read', 'yaml']);
    loaders.sync.should.have.property('foo');
  });

  it('should register a loader created from other loaders and functions:', function () {
    function bar (fp) { return fp; }
    function baz (contents) { return contents; }
    loaders.loader('foo', [bar, 'read', baz, 'yaml']);
    loaders.sync.should.have.property('foo');
    loaders.sync.foo.length.should.be.eql(4);
  });

  it('should pass the value returned from a loader to the next loader:', function () {
    loaders.loader('bar', ['read', 'yaml', 'data']);
    loaders.compose('bar')('fixtures/a.bar').should.eql({c: 'd', e: 'f'});
  });

  it('should pass the value returned from a loader to the next loader:', function () {
    function foo(fp) {
      return fp;
    }
    function baz(contents) {
      return contents;
    }
    loaders.loader('bar', [foo, 'read', baz, 'yaml', 'data']);
    loaders.compose('bar')('fixtures/a.bar').should.eql({c: 'd', e: 'f'});
  });

  it('should expose the loader instance as `this` in loaders:', function () {
    loaders.loader('a', function a(fp) {
      return fs.readFileSync(fp, 'utf8');
    });
    loaders.loader('b', function b(fp) {
      return YAML.load(this.app.compose('a')(fp));
    });
    loaders.loader('c', function c(pattern) {
      return glob.sync(pattern);
    });
    loaders.loader('d', ['c'], function d(files) {
      var fn = this.app.compose('a');
      return files.map(function e(fp) {
        return fn(fp);
      });
    });
    loaders.loader('e', function e(arr) {
      return extend.apply(extend, [{}].concat(arr));
    });
    loaders.loader('parse', ['d', 'e']);
  });

  it('should register a loader from other loaders and the given function:', function () {
    loaders.loader('foo', ['read', 'yaml'], function foo(val) {
      return val;
    });
    loaders.sync.should.have.property('foo');
  });

  it('should pass the value returned from a loader to the next loader:', function () {
    loaders.loader('bar', ['read', 'yaml', 'data']);
    loaders.compose('bar')('fixtures/a.bar').should.eql({c: 'd', e: 'f'});
  });

  it('should use loaders passed in at load time:', function () {
    loaders.loader('a', function (a) {
      return a;
    });
    var fn = loaders.compose('a', function (pattern) {
      return glob.sync(pattern).map(function (fp) {
        return fs.readFileSync(fp, 'utf8');
      })
    })

    fn('fixtures/a.bar').should.eql(["c: d"]);
  });

  it('should register a loader from other loaders:', function () {
    loaders.loader('parse', ['read', 'yaml']);
    loaders.loader('extend', ['data']);
    loaders.loader('bar', ['parse', 'extend']);
    loaders.compose('bar')('fixtures/a.bar').should.eql({c: 'd', e: 'f'});
  });
});

describe('loaders async:', function () {
  beforeEach(function() {
    loaders = new LoaderCache({defaultType: 'async'});
    loaders.iterator('async', require('iterator-async'));

    loaders.loader('yaml', function yaml(str, next) {
      next(null, YAML.safeLoad(str));
    });

    loaders.loader('yml', function yml(str, next) {
      next(null, YAML.safeLoad(str));
    });

    loaders.loader('json', function json(fp, next) {
      next(null, require(path.resolve(fp)));
    });

    loaders.loader('read', function read(fp, next) {
      fs.readFile(fp, 'utf8', next);
    });

    loaders.loader('hbs', function hbs(fp, next) {
      fs.readFile(fp, 'utf8', next);
    });

    loaders.loader('data', function data(obj, next) {
      obj.e = 'f';
      next(null, obj);
    });
  });

  it('should register async loaders:', function () {
    loaders.async.should.have.properties('yaml', 'yml', 'json', 'read', 'hbs', 'data');
  });

  it('should register an async loader from other async loaders:', function () {
    loaders.loader('foo', ['read', 'yaml']);
    loaders.async.should.have.property('foo');
  });

  it('should register an async loader from other async loaders:', function () {
    loaders.loader('foo', ['read', 'yaml']);
    loaders.async.should.have.property('foo');
  });

  it('should register an async loader from other async loaders and functions:', function () {
    function bar (fp, next) { next(null, fp); }
    function baz (contents, next) { next(null, contents); }
    loaders.loader('foo', bar, ['read'], baz, ['yaml']);
    loaders.async.should.have.property('foo');
    loaders.async.foo.length.should.be.eql(4);
  });

  it('should register an async loader from other async loaders and functions:', function () {
    function bar (fp, next) { next(null, fp); }
    function baz (contents, next) { next(null, contents); }
    loaders.loader('foo', bar, ['read'], baz, ['yaml']);
    loaders.async.should.have.property('foo');
    // console.log(loaders.async)
    loaders.async.foo.length.should.be.eql(4);
  });


  it('should pass the value returned from an async loader to the next async loader:', function (done) {
    loaders.loader('bar', ['read', 'yaml', 'data']);

    loaders.compose('bar')('fixtures/a.bar', function (err, obj) {
      if (err) return done(err);

      obj.should.eql({c: 'd', e: 'f'});
      done();
    });
  });

  it('should pass the value returned from an async loader to the next async loader:', function (done) {
    function foo (fp, next) { next(null, fp); }
    function baz (contents, next) { next(null, contents); }
    loaders.loader('bar', foo, ['read'], baz, ['yaml', 'data']);
    loaders.compose('bar')('fixtures/a.bar', function (err, obj) {
      obj.should.eql({c: 'd', e: 'f'});
      done();
    });
  });

  it('should pass the value returned from an async loader to the next async loader:', function (done) {
    loaders.loader('bar', ['read', 'yaml', 'data']);
    loaders.compose('bar')('fixtures/a.bar', function (err, obj) {
      obj.should.eql({c: 'd', e: 'f'});
      done();
    });
  });

  it('should use async loaders passed in at load time:', function (done) {
    loaders.loader('bar', ['read', 'yaml']);
    loaders.compose('bar', ['data'])('fixtures/a.bar', function (err, obj) {
      obj.should.eql({c: 'd', e: 'f'});
      done();
    });
  });

  it('should register an async loader from other async loaders:', function (done) {
    loaders.loader('parse', ['read', 'yaml']);
    loaders.loader('extend', ['data']);
    loaders.loader('bar', ['parse', 'extend']);
    loaders.compose('bar')('fixtures/a.bar', function (err, obj) {
      obj.should.eql({c: 'd', e: 'f'});
      done();
    });
  });
});

describe('loaders promise', function () {
  beforeEach(function() {
    loaders = new LoaderCache({defaultType: 'promise'});
    loaders.iterator('promise', require('iterator-promise'));

    loaders.loader('yaml', Promise.method(function yaml(str) {
      return YAML.safeLoad(str);
    }));

    loaders.loader('yml', Promise.method(function yml(str) {
      return YAML.safeLoad(str);
    }));

    loaders.loader('json', Promise.method(function json(fp) {
      return require(path.resolve(fp));
    }));

    loaders.loader('read', Promise.method(function read(fp) {
      return fs.readFileSync(fp, 'utf8');
    }));

    loaders.loader('hbs', Promise.method(function hbs(fp) {
      return fs.readFileSync(fp, 'utf8');
    }));

    loaders.loader('data', Promise.method(function data(obj) {
      obj.e = 'f';
      return obj;
    }));
  });

  it('should register promise loaders:', function () {
    loaders.promise.should.have.properties('yaml', 'yml', 'json', 'read', 'hbs', 'data');
  });

  it('should register a promise loader from other promise loaders:', function () {
    loaders.loader('foo', ['read', 'yaml']);
    loaders.promise.should.have.property('foo');
  });

  it('should register a promise loader from other promise loaders:', function () {
    loaders.loader('foo', ['read', 'yaml']);
    loaders.promise.should.have.property('foo');
  });

  it('should register a promise loader from other promise loaders and functions:', function () {
    var bar = Promise.method(function bar (fp) { return fp; });
    var baz = Promise.method(function baz (contents) { return contents; });
    loaders.loader('foo', bar, ['read'], baz, ['yaml']);
    loaders.promise.should.have.property('foo');
    loaders.promise.foo.length.should.be.eql(4);
  });

  it('should register a promise loader from other promise loaders and functions:', function () {
    var bar = Promise.method(function bar (fp) { return fp; });
    var baz = Promise.method(function baz (contents) { return contents; });
    loaders.loader('foo', bar, ['read'], baz, ['yaml']);
    loaders.promise.should.have.property('foo');
    loaders.promise.foo.length.should.be.eql(4);
  });

  it('should pass the returned value to the next promise loader:', function (done) {
    var foo = Promise.method(function foo (fp) { return fp; });
    var baz = Promise.method(function baz (contents) { return contents; });
    loaders.loader('bar', foo, ['read'], baz, ['yaml', 'data']);
    loaders.compose('bar')('fixtures/a.bar').then(function (results) {
      results.should.eql({c: 'd', e: 'f'});
      done();
    });
  });

  it('should pass the returned value to the next promise loader:', function (done) {
    loaders.loader('bar', ['read', 'yaml', 'data']);
    loaders.compose('bar')('fixtures/a.bar').then(function (results) {
      results.should.eql({c: 'd', e: 'f'});
      done();
    });
  });

  it('should pass the returned value to the next promise loader:', function (done) {
    loaders.loader('bar', ['read', 'yaml', 'data']);
    loaders.compose('bar')('fixtures/a.bar').then(function (results) {
      results.should.eql({c: 'd', e: 'f'});
      done();
    });
  });

  it('should use promise loaders passed in at load time:', function (done) {
    loaders.loader('bar', ['read', 'yaml']);
    loaders.compose('bar', ['data'])('fixtures/a.bar').then(function (results) {
      results.should.eql({c: 'd', e: 'f'});
      done();
    });
  });

  it('should register a promise loader from other promise loaders:', function (done) {
    loaders.loader('parse', ['read', 'yaml']);
    loaders.loader('extend', ['data']);
    loaders.loader('bar', ['parse', 'extend']);
    loaders.compose('bar')('fixtures/a.bar').then(function (results) {
      results.should.eql({c: 'd', e: 'f'});
      done();
    });
  });
});

describe('loaders stream', function () {
  beforeEach(function() {
    loaders = new LoaderCache({ defaultType: 'stream' });
    loaders.iterator('stream', require('iterator-streams'));

    loaders.loader('yaml', es.through(function yaml(str) {
      this.emit('data', YAML.safeLoad(str));
    }));

    loaders.loader('yml', es.through(function yml(str) {
      this.emit('data', YAML.safeLoad(str));
    }));

    loaders.loader('json', es.through(function json(fp) {
      this.emit('data', require(path.resolve(fp)));
    }));

    loaders.loader('read', es.through(function read(fp) {
      this.emit('data', fs.readFileSync(fp, 'utf8'));
    }));

    loaders.loader('hbs', es.through(function hbs(fp) {
      this.emit('data', fs.readFileSync(fp, 'utf8'));
    }));

    loaders.loader('data', es.through(function data(obj) {
      obj.e = 'f';
      this.emit('data', obj);
    }));
  });

  it('should register stream loaders:', function () {
    loaders.stream.should.have.properties('yaml', 'yml', 'json', 'read', 'hbs', 'data');
  });

  it('should register a stream loader from other stream loaders:', function () {
    loaders.loader('foo', ['read', 'yaml']);
    loaders.stream.should.have.property('foo');
  });

  it('should register a stream loader from other stream loaders:', function () {
    loaders.loader('foo', ['read', 'yaml']);
    loaders.stream.should.have.property('foo');
  });

  it('should create a loader from other loaders and functions:', function () {
    var bar = es.through(function bar (fp) { this.emit('data', fp); });
    var baz = es.through(function baz (contents) { this.emit('data', contents); });
    loaders.loader('foo', bar, ['read'], baz, ['yaml']);
    loaders.stream.should.have.property('foo');
    loaders.stream.foo.length.should.be.eql(4);
  });

  it('should create a loader from other loaders and functions:', function () {
    var bar = es.through(function bar (fp) { this.emit('data', fp); });
    var baz = es.through(function baz (contents) { this.emit('data', contents); });
    loaders.loader('foo', bar, ['read'], baz, ['yaml']);
    loaders.stream.should.have.property('foo');
    loaders.stream.foo.length.should.be.eql(4);
  });

  it('should pass the value from a stream loader to the next stream loader:', function (done) {
    var foo = es.through(function foo (fp) { this.emit('data', fp); });
    var baz = es.through(function baz (contents) { this.emit('data', contents); });
    loaders.loader('bar', foo, ['read'], baz, ['yaml', 'data']);
    loaders.compose('bar')('fixtures/a.bar')
      .on('data', function (results) {
        results.should.eql({c: 'd', e: 'f'});
      })
      .on('end', done);
  });

  it('should pass the value to the next stream loader:', function (done) {
    loaders.loader('bar', ['read', 'yaml', 'data']);
    loaders.compose('bar')('fixtures/a.bar').on('data', function (results) {
      results.should.eql({c: 'd', e: 'f'});
    }).on('end', done);
  });

  it('should pass the value to the next stream loader:', function (done) {
    loaders.loader('bar', ['read', 'yaml', 'data']);
    loaders.compose('bar')('fixtures/a.bar')
      .on('data', function (results) {
        results.should.eql({c: 'd', e: 'f'});
      })
      .on('end', done);
    });

  it('should use stream loaders passed in at load time:', function (done) {
    loaders.loader('bar', ['read', 'yaml']);
    loaders.compose('bar', ['data'])('fixtures/a.bar')
      .on('data', function (results) {
        results.should.eql({c: 'd', e: 'f'});
      })
      .on('end', done);
  });

  it('should register a stream loader from other stream loaders:', function (done) {
    loaders.loader('parse', ['read', 'yaml']);
    loaders.loader('extend', ['data']);
    loaders.loader('bar', ['parse', 'extend']);
    loaders.compose('bar')('fixtures/a.bar')
      .on('error', console.error)
      .on('data', function (results) {
        results.should.eql({c: 'd', e: 'f'});
      })
      .on('end', done);
  });
});
