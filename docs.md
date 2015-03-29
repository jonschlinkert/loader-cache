## loader

Any arbitrary name can be assigned to a loader, however, the loader will only be called when either:

  a. `ext` matches the file extension of a path passed to the `.load()` method, or
  b. `ext` is an arbitrary name passed on the loader stack of another loader. Example below.


## compose

```js
// compose a loader for parsing YAML
loaders.compose('yaml', function(fp) {
  return YAML.safeLoad(fp);
});

// generic loader to be used by other loaders
loaders.compose('read', function(fp) {
  return fs.readFileSync(fp, 'utf8');
});

// create a new loader from the `yaml` and `read` loaders.
loaders.compose('yml', ['read', 'yaml']);
```


## composeAsync

```js
// compose an async loader for parsing YAML
loaders.composeAsync('yaml', function(fp, next) {
  next(null, YAML.safeLoad(fp));
});

// compose a loader to be used in other loaders
loaders.composeAsync('read', function(fp, next) {
  fs.readFile(fp, 'utf8', next);
});

// create a new loader from the `yaml` and `read` loaders.
loaders.composeAsync('yml', ['read', 'yaml']);
```

## composePromise

```js
// compose an promise loader for parsing YAML
loaders.composePromise('yaml', function(fp) {
  var Promise = require('bluebird');
  var deferred = Promise.pending();
  process.nextTick(function () {
    deferred.fulfill(YAML.safeLoad(fp));
  });
  return deferred.promise;
});

// compose a loader to be used in other loaders
loaders.composePromise('read', function(fp) {
  var Promise = require('bluebird');
  var deferred = Promise.pending();
  fs.readFile(fp, 'utf8', function (err, content) {
    deferred.fulfill(content);
  });
  return deferred.promise;
});

// create a new loader from the `yaml` and `read` loaders.
loaders.composePromise('yml', ['read', 'yaml']);
```
## composeStream

```js
// compose an stream loader for parsing YAML
loaders.composeStream('yaml', es.through(function(fp) {
  this.emit('data', YAML.safeLoad(fp));
});

// compose a loader to be used in other loaders
loaders.composeStream('read', function(fp) {
  fs.readFile(fp, 'utf8', function (err, content) {
    this.emit('data', content);
  });
});

// create a new loader from the `yaml` and `read` loaders.
loaders.composeStream('yml', ['read', 'yaml']);
```
