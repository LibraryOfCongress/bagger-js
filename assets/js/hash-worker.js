/* jslint browser: true, indent: 4 */
/* global self, require, postMessage, asmCrypto, console, FileReaderSync */

require('asmcrypto.js');

var blockSize = 1048576;

self.addEventListener('message', function(evt) {
    var d = evt.data,
        response = {'file': d.file, 'action': d.action, 'workerId': d.workerId};

    switch (d.action) {
        case 'hash':
            var reader = new FileReaderSync();
            var hashes = {
                'sha1': new asmCrypto.SHA1(),
                'sha256': new asmCrypto.SHA256()
            };

            var currentOffset = 0;

            while (currentOffset < d.file.size) {
                var sliceStart = currentOffset;
                var sliceEnd = sliceStart + Math.min(blockSize, d.file.size - sliceStart);
                var slice = d.file.slice(sliceStart, sliceEnd);
                if (sliceStart <= d.file.size) {
                    currentOffset = sliceEnd;
                    var bytes = reader.readAsArrayBuffer(slice);

                    for (var alg in hashes) { // jshint -W089
                        hashes[alg].process(bytes);
                    }
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
