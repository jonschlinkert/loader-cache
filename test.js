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

    loaders.register('yaml', function yaml(fp) {
      return YAML.safeLoad(fp);
    });

    loaders.register('yml', function yml(fp) {
      return YAML.safeLoad(fp);
    });

    loaders.register('json', function json(fp) {
      return require(path.resolve(fp));
    });

    loaders.register('txt', function txt(fp) {
      return fs.readFileSync(fp, 'utf8');
    });

    loaders.register('hbs', function hbs(fp) {
      return fs.readFileSync(fp, 'utf8');
    });
  });

  it('should register loaders:', function () {
    loaders.cache.should.have.properties('yaml', 'yml', 'json', 'txt', 'hbs');
  });

  it('should compose a loader from other loaders:', function () {
    loaders.compose('foo', ['txt', 'yaml']);
    loaders.cache.should.have.property('foo');
  });

  it('should run a loader stack on the given filepath:', function () {
    loaders.compose('foo', ['txt', 'yaml']);
    loaders.load('fixtures/a.foo').should.eql({a: 'b'});
  });
});
