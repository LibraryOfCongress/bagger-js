/*eslint no-console: "off" */
/* global require, console */

var connect = require('connect');
var directory = './dist';
var port = process.env.PORT || 8000;

connect()
    .use(require('morgan')('dev'))
    .use(require('serve-static')(directory))
    .listen(port, '0.0.0.0');

console.log('Listening on port http://localhost:8000');
