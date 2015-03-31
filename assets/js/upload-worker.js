/* jslint browser: true, indent: 4 */
/* global self, require, postMessage, console */

var AWS = require('aws-sdk');

console.log('AWS version: ' +AWS.VERSION);

self.addEventListener('message', function(evt) {
    console.log('TODO: ' + evt);
});
