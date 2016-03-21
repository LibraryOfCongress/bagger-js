/*eslint no-console: "off" */
/* global require, console */

var connect = require('connect');
var directory = './dist';

connect()
    .use(require('morgan')('dev'))
    .use(require('serve-static')(directory))
    .listen(8000, '0.0.0.0');

console.log('Listening on port http://localhost:8000');
