/*!
 * loader-cache <https://github.com/jonschlinkert/loader-cache>
 *
 * Copyright (c) 2014 Jon Schlinkert, contributors.
 * Licensed under the MIT License
 */

'use strict';

var fs = require('fs');
var should = require('should');
var YAML = require('js-yaml');
var Loaders = require('./');
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
