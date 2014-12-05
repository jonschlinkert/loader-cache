{{#apidoc "register"}}
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
{{/apidoc}}

{{#apidoc "registerAsync"}}
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
{{/apidoc}}

{{#apidoc "registerPromise"}}
**Examples**

```js
// register an promise loader for parsing YAML
loaders.registerPromise('yaml', function(fp) {
  var Promise = require('bluebird');
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
{{/apidoc}}


{{#apidoc "registerStream"}}
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
{{/apidoc}}


{{#apidoc "compose"}}
**Example**

```js
// arbitrary name, so it won't match file extensions. This
// loader will be used in other loaders for reading files
loaders.register('read', function(fp) {
  return fs.readFileSync(fp, 'utf8');
});

// Parse a string of YAML
loaders.register('yaml', function(fp) {
  return YAML.safeLoad(fp);
});

// Compose a new loader that will read a file, then parse it as YAML
loaders.compose('yml', ['read', 'yaml']);

// you can alternatively do the same thing with the register method, e.g.
loaders.register('yml', ['read', 'yaml']);
```
{{/apidoc}}