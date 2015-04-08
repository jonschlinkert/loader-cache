'use strict';

var fs = require('fs');
var path = require('path');
var util = require('util');
var Loaders = require('./');
var app = new Loaders();

function App() {
  Loaders.call(this);
}
util.inherits(App, Loaders);

App.prototype.init = function() {
  this.register('file', function (fp) {
    return {path: fp, content: fs.readFileSync(fp, 'utf8')};
  });

  this.register('file', function (fp) {
    return {path: fp, content: fs.readFileSync(fp, 'utf8')};
  });

  this.register('helper', function (name, fn) {
    this.helpers[name] = fn;
  });

  this.register('vinyl', function (file) {
    file.contents = new Buffer(file.content);
    return file;
  });

  this.register('template', function (file) {
    var template = {};
    file.name = path.basename(file.path, path.extname(file.path));
    template[file.name] = file;
    return template;
  });
};


var app = new App();




app.compose('data', ['init', 'file', 'parse']);
