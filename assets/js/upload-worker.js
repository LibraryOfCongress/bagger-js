/* jslint browser: true, indent: 4 */
/* global self, require, postMessage, console, FileReaderSync */

var AWS = require('aws-sdk');

console.log('AWS version: ' + AWS.VERSION);

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
        case 'upload':
            var reader = new FileReaderSync();

            var currentOffset = 0;

            var fileSize = file.size;
            response.fileSize = fileSize;

            console.log('Uploading %s (%d bytes)', fullPath, fileSize);

            var startTime = Date.now();

            while (currentOffset < fileSize) {
                var sliceStart = currentOffset;
                var sliceEnd = sliceStart + Math.min(blockSize, fileSize - sliceStart);
                var slice = file.slice(sliceStart, sliceEnd);

                if (sliceStart <= fileSize) {
                    currentOffset = sliceEnd;
                    reader.readAsArrayBuffer(slice); // var bytes =
                    // actually upload the bytes
                } else {
                    console.error('Attempted to read past end of file!');
                }
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
