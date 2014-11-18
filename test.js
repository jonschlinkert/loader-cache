/*!
 * loader-cache <https://github.com/jonschlinkert/loader-cache>
 *
 * Copyright (c) 2014 Jon Schlinkert, contributors.
 * Licensed under the MIT License
 */

'use strict';

var Promise = require('bluebird');
var should = require('should');
var YAML = require('js-yaml');
var Loaders = require('./');
var fs = require('fs');

var loaders;

describe('loaders', function () {
  beforeEach(function() {
    loaders = new Loaders();

    loaders.register('yaml', function yaml(str) {
      return YAML.safeLoad(str);
    });

    loaders.register('yml', function yml(str) {
      return YAML.safeLoad(str);
    });

    loaders.register('json', function json(fp) {
      return require(path.resolve(fp));
    });

    loaders.register('read', function read(fp) {
      return fs.readFileSync(fp, 'utf8');
    });

    loaders.register('hbs', function hbs(fp) {
      return fs.readFileSync(fp, 'utf8');
    });

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

  it('should pass the value returned from a loader to the next loader:', function () {
    loaders.register('bar', ['read', 'yaml', 'data']);
    loaders.load('fixtures/a.bar').should.eql({c: 'd', e: 'f'});
  });

  it('should pass the value returned from a loader to the next loader:', function () {
    loaders.compose('bar', ['read', 'yaml', 'data']);
    loaders.load('fixtures/a.bar').should.eql({c: 'd', e: 'f'});
  });

  it('should compose a loader from other loaders:', function () {
    loaders.compose('parse', ['read', 'yaml']);
    loaders.compose('extend', ['data']);
    loaders.compose('bar', ['parse', 'extend']);
    loaders.load('fixtures/a.bar').should.eql({c: 'd', e: 'f'});
  });
});

describe('loaders async', function () {
  beforeEach(function() {
    loaders = new Loaders();

    loaders.registerAsync('yaml', function yaml(str, options, next) {
      next(null, YAML.safeLoad(str));
    });

    loaders.registerAsync('yml', function yml(str, options, next) {
      next(null, YAML.safeLoad(str));
    });

    loaders.registerAsync('json', function json(fp, options, next) {
      next(null, require(path.resolve(fp)));
    });

    loaders.registerAsync('read', function read(fp, options, next) {
      fs.readFile(fp, 'utf8', next);
    });

    loaders.registerAsync('hbs', function hbs(fp, options, next) {
      fs.readFile(fp, 'utf8', next);
    });

    loaders.registerAsync('data', function data(obj, options, next) {
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
    loaders.registerAsync('foo', ['read', 'yaml']);
    loaders.cache.should.have.property('foo');
  });

  it('should pass the value returned from an async loader to the next async loader:', function (done) {
    loaders.registerAsync('bar', ['read', 'yaml', 'data']);
    loaders.loadAsync('fixtures/a.bar', function (err, obj) {
      obj.should.eql({c: 'd', e: 'f'});
      done();
    });
  });

  it('should pass the value returned from an async loader to the next async loader:', function (done) {
    loaders.compose('bar', ['read', 'yaml', 'data']);
    loaders.loadAsync('fixtures/a.bar', function (err, obj) {
      obj.should.eql({c: 'd', e: 'f'});
      done();
    });
  });

  it('should compose an async loader from other async loaders:', function (done) {
    loaders.compose('parse', ['read', 'yaml']);
    loaders.compose('extend', ['data']);
    loaders.compose('bar', ['parse', 'extend']);
    loaders.loadAsync('fixtures/a.bar', function (err, obj) {
      obj.should.eql({c: 'd', e: 'f'});
      done();
    });
  });
});

describe('loaders promise', function () {
  beforeEach(function() {
    loaders = new Loaders();

    loaders.registerPromise('yaml', Promise.method(function yaml(str) {
      return YAML.safeLoad(str);
    }));

    loaders.registerPromise('yml', Promise.method(function yml(str) {
      return YAML.safeLoad(str);
    }));

    loaders.registerPromise('json', Promise.method(function json(fp) {
      return require(path.resolve(fp));
    }));

    loaders.registerPromise('read', Promise.method(function read(fp) {
      return fs.readFileSync(fp, 'utf8');
    }));

    loaders.registerPromise('hbs', Promise.method(function hbs(fp) {
      return fs.readFileSync(fp, 'utf8');
    }));

    loaders.registerPromise('data', Promise.method(function data(obj) {
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
    loaders.registerPromise('foo', ['read', 'yaml']);
    loaders.cache.should.have.property('foo');
  });

  it('should pass the value returned from a promise loader to the next promise loader:', function () {
    loaders.registerPromise('bar', ['read', 'yaml', 'data']);
    loaders.loadPromise('fixtures/a.bar').then(function (results) {
      results.should.eql({c: 'd', e: 'f'});
    });
  });

  it('should pass the value returned from a promise loader to the next promise loader:', function () {
    loaders.compose('bar', ['read', 'yaml', 'data']);
    loaders.loadPromise('fixtures/a.bar').then(function (results) {
      results.should.eql({c: 'd', e: 'f'});
    });
  });

  it('should compose a promise loader from other promise loaders:', function () {
    loaders.compose('parse', ['read', 'yaml']);
    loaders.compose('extend', ['data']);
    loaders.compose('bar', ['parse', 'extend']);
    loaders.loadPromise('fixtures/a.bar').then(function (results) {
      results.should.eql({c: 'd', e: 'f'});
    });
  });
});
