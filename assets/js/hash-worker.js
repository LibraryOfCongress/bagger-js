/* jslint browser: true, indent: 4 */
/* global self, require, postMessage, asmCrypto, console */

require('asmcrypto.js');

var blockSize = 1048576;

self.addEventListener('message', function(evt) {
    var d = evt.data,
        response = {'file': d.file, 'action': d.action};

    switch (d.action) {
    case 'hash':
        var reader = new FileReader();
        var hashes = {
            'sha1': new asmCrypto.SHA1(),
            'sha256': new asmCrypto.SHA256()
        };

        reader.onload = function(e) {
            for (var name in hashes) { // jshint -W089
                hashes[name].process(e.target.result);
            }
        };

        var currentOffset = 0;
        while (currentOffset < d.file.size) {
            var sliceStart = currentOffset;
            var sliceEnd = sliceStart + Math.min(blockSize, d.file.size - sliceStart);
            var slice = d.file.slice(sliceStart, sliceEnd);
            if (sliceStart <= d.file.size) {
                currentOffset = sliceEnd;
                reader.readAsArrayBuffer(slice);
            } else {
                console.error('Attempted to read past end of file!');
            }
        }

        var output = response.output = {};

        for (var hashName in hashes) { // jshint -W089
            var i = hashes[hashName].finish();
            // jshint -W106
            output[hashName] = asmCrypto.bytes_to_hex(i.result);
            // jshint +W106
        }
        break;

    default:
        console.error('Unknown action', d.action);

    }

    postMessage(response);
});
