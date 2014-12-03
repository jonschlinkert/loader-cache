# loader-cache [![NPM version](https://badge.fury.io/js/loader-cache.svg)](http://badge.fury.io/js/loader-cache)

> Register loader functions that dynamically read, parse or otherwise transform file contents when the name of the loader matches a file extension. You can also compose loaders from other loaders.

## Install
## Install with [npm](npmjs.org)

```bash
npm i loader-cache --save
```

## Example

```js
// register a loader for parsing YAML
loaders.register('yaml', function(fp) {
  return YAML.safeLoad(fp);
});

// register a loader to be used in other loaders
loaders.register('read', function(fp) {
  return fs.readFileSync(fp, 'utf8');
});

// create a new loader from the `yaml` and `read` loaders.
loaders.register('yml', ['read', 'yaml']);

// the `.load()` method calls any loaders registered
// to the `ext` on the given filepath
loaders.load('config.yml');
```

## Run tests

```bash
npm test
```

## Usage

```js
var loaders = require('loader-cache');
```

## API
### [Loaders](index.js#L30)

Create a new instance of `Loaders`

```js
var Loaders = require('loader-cache');
var loaders = new Loaders();
```

### [.loaderTypes](index.js#L48)

Array of supported loader types as a convenience for creating utility functions to dynamically choose loaders. Currently supported types are:

  - `sync`
  - `async`
  - `promise`
  - `stream`

### [.register](index.js#L105)

Register the given loader callback `fn` as `ext`. Any arbitrary name can be assigned to a loader, however, the loader will only be called when either:   a. `ext` matches the file extension of a path passed to the `.load()` method, or   b. `ext` is an arbitrary name passed on the loader stack of another loader. Example below.

* `ext` **{String|Array}**: File extension or name of the loader.    
* `fn` **{Function|Array}**: A loader function, or create a loader from other others by passing an array of names.    
* `returns` **{Object}** `Loaders`: to enable chaining  

**Examples**

```js
// register a loader for parsing YAML
loaders.register('yaml', function(fp) {
  return YAML.safeLoad(fp);
});

// register a loader to be used in other loaders
loaders.register('read', function(fp) {
  return fs.readFileSync(fp, 'utf8');
});

// create a new loader from the `yaml` and `read` loaders.
loaders.register('yml', ['read', 'yaml']);
```

### [.registerAsync](index.js#L139)

Register the given async loader callback `fn` as `ext`. Any arbitrary name can be assigned to a loader, however, the loader will only be called when either:   a. `ext` matches the file extension of a path passed to the `.load()` method, or   b. `ext` is an arbitrary name passed on the loader stack of another loader. Example below.

* `ext` **{String|Array}**: File extension or name of the loader.    
* `fn` **{Function|Array}**: A loader function with a callback parameter, or create a loader from other others by passing an array of names.    
* `returns` **{Object}** `Loaders`: to enable chaining  

**Examples**

```js
// register an async loader for parsing YAML
loaders.registerAsync('yaml', function(fp, next) {
   next(null, YAML.safeLoad(fp));
});

// register a loader to be used in other loaders
loaders.registerAsync('read', function(fp, next) {
  fs.readFile(fp, 'utf8', next);
});

// create a new loader from the `yaml` and `read` loaders.
loaders.registerAsync('yml', ['read', 'yaml']);
```

### [.registerPromise](index.js#L184)

Register the given promise loader callback `fn` as `ext`. Any arbitrary name can be assigned to a loader, however, the loader will only be called when either:   a. `ext` matches the file extension of a path passed to the `.load()` method, or   b. `ext` is an arbitrary name passed on the loader stack of another loader. Example below.

* `ext` **{String|Array}**: File extension or name of the loader.    
* `fn` **{Function|Array}**: A loader function that returns a promise, or create a loader from other others by passing an array of names.    
* `returns` **{Object}** `Loaders`: to enable chaining  

**Examples**

```js
var Promise = require('bluebird');

// register an promise loader for parsing YAML
loaders.registerPromise('yaml', function(fp) {
   var deferred = Promise.pending();
   process.nextTick(function () {
     deferred.fulfill(YAML.safeLoad(fp));
   });
   return deferred.promise;
});

// register a loader to be used in other loaders
loaders.registerPromise('read', function(fp) {
   var Promise = require('bluebird');
   var deferred = Promise.pending();
   fs.readFile(fp, 'utf8', function (err, content) {
     deferred.fulfill(content);
   });
   return deferred.promise;
});

// create a new loader from the `yaml` and `read` loaders.
loaders.registerPromise('yml', ['read', 'yaml']);
```

### [.registerStream](index.js#L220)

Register the given stream loader callback `fn` as `ext`. Any arbitrary name can be assigned to a loader, however, the loader will only be called when either:   a. `ext` matches the file extension of a path passed to the `.load()` method, or   b. `ext` is an arbitrary name passed on the loader stack of another loader. Example below.

* `ext` **{String|Array}**: File extension or name of the loader.    
* `fn` **{Stream|Array}**: A stream loader, or create a loader from other others by passing an array of names.    
* `returns` **{Object}** `Loaders`: to enable chaining  

**Examples**

```js
// register an stream loader for parsing YAML
loaders.registerStream('yaml', es.through(function(fp) {
  this.emit('data', YAML.safeLoad(fp));
});

// register a loader to be used in other loaders
loaders.registerStream('read', function(fp) {
  fs.readFile(fp, 'utf8', function (err, content) {
    this.emit('data', content);
  });
});

// create a new loader from the `yaml` and `read` loaders.
loaders.registerStream('yml', ['read', 'yaml']);
```

### [.createTypeStack](index.js#L276)

* `loaders` **{Array}**: Names of stored loaders to add to the stack.    
* `type=sync` **{String}**    
* `returns` **{Array}**: Array of loaders  

Create a loader stack of the given `type` from an
array of `loaders`.

### [.load](index.js#L316)

Run loaders associated with `ext` of the given filepath.

* `fp` **{String}**: File path to load.    
* `options` **{String}**: Options to pass to whatever loaders are defined.    
* `returns`: {String}  

**Example**

```js
// this will run the `yml` loader from the `.compose()` example
loaders.load('config.yml');
```

### [.loadAsync](index.js#L351)

Run async loaders associated with `ext` of the given filepath.

* `fp` **{String}**: File path to load.    
* `options` **{Object}**: Options to pass to whatever loaders are defined.    
* `cb` **{Function}**: Callback to indicate loading has finished    
* `returns`: {String}  

**Example**

```js
// this will run the `yml` async loader from the `.compose()` example
loaders.loadAsync('config.yml', function (err, obj) {
  // do some async stuff
});
```

### [.loadPromise](index.js#L393)

Run promise loaders associated with `ext` of the given filepath.

* `fp` **{String}**: File path to load.    
* `options` **{Object}**: Options to pass to whatever loaders are defined.    
* `returns` **{Promise}**: a promise that will be fulfilled later  

**Example**

```js
// this will run the `yml` promise loader from the `.compose()` example
loaders.loadPromise('config.yml')
  .then(function (results) {
    // do some promise stuff
  });
```

### [.loadStream](index.js#L431)

Run stream loaders associated with `ext` of the given filepath.

* `fp` **{String}**: File path to load.    
* `options` **{Object}**: Options to pass to whatever loaders are defined.    
* `returns` **{Stream}**: a stream that will be fulfilled later  

**Example**

```js
// this will run the `yml` stream loader from the `.compose()` example
loaders.LoadStream('config.yml')
  .pipe(foo())
  .on('data', function (results) {
    // do stuff
  });
```


## Contributing
Pull requests and stars are always welcome. For bugs and feature requests, [please create an issue](https://github.com/jonschlinkert/loader-cache/issues)

## Author

**Jon Schlinkert**
 
+ [github/jonschlinkert](https://github.com/jonschlinkert)
+ [twitter/jonschlinkert](http://twitter.com/jonschlinkert) 

## License
Copyright (c) 2014 Jon Schlinkert  
Released under the MIT license

***

_This file was generated by [verb](https://github.com/assemble/verb) on December 03, 2014._