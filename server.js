/* global require, console */

var connect = require('connect');
var directory = './dist';

connect()
  .use(require('morgan')('dev'))
  .use(require('serve-static')(directory))  
  .listen(8000);

console.log('Listening on port 8000.');
