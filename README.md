# loader-cache [![NPM version](https://badge.fury.io/js/loader-cache.svg)](http://badge.fury.io/js/loader-cache)  [![Build Status](https://travis-ci.org/jonschlinkert/loader-cache.svg)](https://travis-ci.org/jonschlinkert/loader-cache)

> Register loader functions that dynamically read, parse or otherwise transform file contents when the name of the loader matches a file extension. You can also compose loaders from other loaders.

## Example usage

```js
var LoaderCache = require('loader-cache');
var loaders = new LoaderCache();

// register a loader for reading files
loaders.register('read', function(fp) {
  return fs.readFileSync(fp, 'utf8');
});

// register a loader for parsing YAML
loaders.register('yaml', function(fp) {
  return YAML.safeLoad(fp);
});

// create a loader from any combination of other
// registered loaders and functions.
loaders.register('dataLoader', ['read', 'yaml'], function(data) {
  if (!data) throw new Error('no data!');
  return data;
});

// pass a loader stack or the name of a loader to `.compose()` 
// to create the actual function to be used for loading
var fn = loaders.compose('dataLoader');
var data = fn('config.yml');
```

## Install

Install with [npm](https://www.npmjs.com/)

```sh
$ npm i loader-cache --save
```

## API

### [LoaderCache](index.js#L20)

Create a new instance of `LoaderCache`

**Example**

```js
var LoaderCache = require('loader-cache');
var loaders = new LoaderCache();
```

### [.iterator](index.js#L78)

Register an iterator function of the given `type`. Types typically represent a kind of flow-control, like `sync`, `promise`, `stream`, `async` etc.

**Params**

* `type` **{String}**
* `options` **{Object}**
* `fn` **{Function}**: The actual iterator function.
* `returns` **{Object}**

**Example**

```js
loader.iterator('sync', function(stack) {
  // `stack` is the loader stack (array) to iterate over
  // each item in array is a loader function
  return function(args) {
    // `args` is the arguments passed to the loaders
  }
});
```

### [.loader](index.js#L115)

Register a loader. The first argument is the name of the loader to register.

**Params**

* `name` **{String}**
* `options` **{Object}**
* `fns` **{Function|Array}**: One or more loader functions or names of other registered loaders.
* `returns` **{Array}**

**Example**

```js
// create a loader from other loaders.
loaders.loader('foo', ['bar', 'baz']);
// pass a function
loaders.loader('foo', function(patterns, options) {
  return glob.sync(patterns, options);
});
// combination
loaders.loader('foo', ['bar', 'baz'], function(patterns, options) {
  return glob.sync(patterns, options);
});
```

### [.compose](index.js#L161)

Compose the actual `load` function from a loader stack.

**Params**

* `name` **{String}**: The name of the loader stack to use.
* `options` **{Object}**
* `stack` **{Array|Function}**: Additional loader names or functions.
* `returns` **{Function}**

**Example**

```js
var fn = loaders.compose('foo');
// load some files
var files = fn('*.txt');
```

## Related libs

* [config-cache](https://github.com/jonschlinkert/config-cache): General purpose JavaScript object storage methods.
* [cache-base](https://github.com/jonschlinkert/cache-base): Generic object cache for node.js/javascript projects.
* [engine-cache](https://github.com/jonschlinkert/engine-cache): express.js inspired template-engine manager.
* [helper-cache](https://github.com/jonschlinkert/helper-cache): Easily register and get helper functions to be passed to any template engine or node.js… [more](https://github.com/jonschlinkert/helper-cache)
* [option-cache](https://github.com/jonschlinkert/option-cache): Simple API for managing options in JavaScript applications.
* [parser-cache](https://github.com/jonschlinkert/parser-cache): Cache and load parsers, similiar to consolidate.js engines.

## Running tests

Install dev dependencies:

```sh
$ npm i -d && npm test
```

## Code coverage

Please help improve code coverage by [adding unit tests](#contributing).

```js
-----------------|-----------|-----------|-----------|-----------|
File             |   % Stmts |% Branches |   % Funcs |   % Lines |
-----------------|-----------|-----------|-----------|-----------|
   loader-cache/ |     91.27 |     82.35 |     85.71 |      92.5 |
      index.js   |     91.27 |     82.35 |     85.71 |      92.5 |
-----------------|-----------|-----------|-----------|-----------|
All files        |     91.27 |     82.35 |     85.71 |      92.5 |
-----------------|-----------|-----------|-----------|-----------|
```

## Contributing

Pull requests and stars are always welcome. For bugs and feature requests, [please create an issue](https://github.com/jonschlinkert/loader-cache/issues/new)

## Author

**Jon Schlinkert**

+ [github/jonschlinkert](https://github.com/jonschlinkert)
+ [twitter/jonschlinkert](http://twitter.com/jonschlinkert)

## License

Copyright © 2015 Jon Schlinkert
Released under the MIT license.

***

_This file was generated by [verb-cli](https://github.com/assemble/verb-cli) on June 29, 2015._

<!-- deps:mocha -->