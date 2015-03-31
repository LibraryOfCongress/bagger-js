/* jslint browser: true, indent: 4 */
/* global self, require, postMessage, asmCrypto, console, FileReaderSync */

require('asmcrypto.js');

var blockSize = 1048576;

self.addEventListener('message', function(evt) {
    // Unpack some variables for clarity below:
    var d = evt.data,
        workerId = d.workerId,
        action = d.action,
        file = d.file,
        fullPath = d.fullPath,
        response = {'file': file, 'fullPath': fullPath, 'action': action, 'workerId': workerId};

    switch (action) {
        case 'hash':
            var reader = new FileReaderSync();
            var hashes = {
                'sha1': new asmCrypto.SHA1(),
                'sha256': new asmCrypto.SHA256()
            };

            var currentOffset = 0;

            // Access size once so we can avoid paying the cost of repeated access in the future:
            var fileSize = file.size;
            response.fileSize = fileSize;
            console.log('Processing %s (%d bytes)', fullPath, fileSize);

            var startTime = Date.now();

            while (currentOffset < fileSize) {
                var sliceStart = currentOffset;
                var sliceEnd = sliceStart + Math.min(blockSize, fileSize - sliceStart);
                var slice = file.slice(sliceStart, sliceEnd);

                if (sliceStart <= fileSize) {
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

            // Stop counter & convert from milliseconds:
            var elapsedSeconds = (Date.now() - startTime) / 1000;
            response.performance = {
                'seconds': elapsedSeconds,
                'startMilliseconds': startTime
            };

            break;

        default:
            console.error('Unknown action: %s', action, d);
    }

    console.log('Worker %d: returning %s response: %O', workerId, action, response);
    postMessage(response);
});
