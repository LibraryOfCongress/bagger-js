/* jslint browser: true, indent: 4 */
/* global self, importScripts, postMessage, CryptoJS, console */

importScripts('md5-rollup.js', 'sha256-rollup.js', 'lib-typedarrays.js');

var activeHashes = {};

function updateHashes(filename, block) {
    "use strict";

    var currentState = activeHashes[filename];

    /*
        We need to convert the input ArrayBuffer into the WordArray
        used by the CryptoJS hashers:
        See https://code.google.com/p/crypto-js/issues/detail?id=67
    */
    var words = CryptoJS.lib.WordArray.create(block);

    for (var hashName in currentState) { // jshint -W089
        currentState[hashName].update(words);
    }
}

self.addEventListener('message', function(evt) {
    "use strict";

    var d = evt.data,
        response = {'filename': d.filename, 'action': d.action};

    switch (d.action) {
        case 'start':
            activeHashes[d.filename] = {
                'md5': CryptoJS.algo.MD5.create(),
                'sha256': CryptoJS.algo.SHA256.create()
            };
            break;

        case 'update':
            updateHashes(d.filename, d.bytes);
            break;

        case 'stop':
            var output = response.output = {},
                currentState = activeHashes[d.filename];

            for (var hashName in currentState) { // jshint -W089
                var i = currentState[hashName].finalize();
                output[hashName] = i.toString(CryptoJS.enc.Hex);
            }

            delete activeHashes[d.filename];
            break;

        default:
            console.error('Unknown action', d.action);
    }

    postMessage(response);
});