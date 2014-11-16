/*!
 * loader-cache <https://github.com/jonschlinkert/loader-cache>
 *
 * Copyright (c) 2014 Jon Schlinkert, contributors.
 * Licensed under the MIT License
 */

'use strict';

var should = require('should');
var YAML = require('js-yaml');
var Loaders = require('./');
var loaders;

describe('loaders', function () {
  beforeEach(function() {
    loaders = new Loaders();
  });

  it('should register a loader:', function () {
    loaders.register('yaml', function yaml(fp, options) {
      return YAML.safeLoad(fp, options);
    });

    loaders.register('yml', function yml(fp, options) {
      return YAML.safeLoad(fp, options);
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

    loaders.register('hbs', function hbs(fp) {
      return fs.readFileSync(fp, 'utf8');
    });

    loaders.compose('foo', ['txt', 'yaml']);

    console.log(loaders.cache)
    loaders.cache.should.have.properties('yaml', 'yml');
  });

});
