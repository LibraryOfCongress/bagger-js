/* jslint browser: true, indent: 4 */
/* global self, require, postMessage, asmCrypto, console, FileReaderSync */

require('asmcrypto.js');

var blockSize = 1048576;

self.addEventListener('message', function(evt) {
    // Unpack some variables for clarity below:
    var d = evt.data,
        workerId = d.workerId,
        action = d.action,
        fileInfo = d.fileInfo,
        response = {'fileInfo': fileInfo, 'action': action, 'workerId': workerId};

    switch (action) {
        case 'hash':
            var reader = new FileReaderSync();
            var hashes = {
                'sha1': new asmCrypto.SHA1(),
                'sha256': new asmCrypto.SHA256()
            };

            var file = fileInfo.file,
                currentOffset = 0;

            console.log('Processing %s (%d bytes)', fileInfo.fullPath, file.size);

            var startTime = Date.now();

            while (currentOffset < file.size) {
                var sliceStart = currentOffset;
                var sliceEnd = sliceStart + Math.min(blockSize, file.size - sliceStart);
                var slice = file.slice(sliceStart, sliceEnd);

                if (sliceStart <= file.size) {
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

            console.log('Hashed %d bytes in %f seconds (%s MB/s)', file.size, elapsedSeconds.toFixed(2),
                        ((file.size / 1048576) / elapsedSeconds).toFixed(1));

            break;

        default:
            console.error('Unknown action', d.action);
    }

    console.log('Worker %d: returning %s response:', workerId, action, response);
    postMessage(response);
});
