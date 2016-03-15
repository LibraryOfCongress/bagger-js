/* global self, require, postMessage, asmCrypto, FileReaderSync */

require('asmcrypto.js'); // TODO: import

const BLOCK_SIZE = 1048576;

self.addEventListener('message', ({data: {file, fullPath}}) => {
    const sha256 = new asmCrypto.SHA256();
    const startTime = Date.now();
    const fileSize = file.size;

    for (let reader = new FileReaderSync(), sliceStart = 0, sliceEnd; sliceStart < fileSize; sliceStart = sliceEnd) {
        sliceEnd = sliceStart + Math.min(BLOCK_SIZE, fileSize - sliceStart);
        let slice = file.slice(sliceStart, sliceEnd);
        let bytes = reader.readAsArrayBuffer(slice);
        sha256.process(bytes);
    }

    postMessage({
        file,
        fullPath,
        fileSize,
        sha256: asmCrypto.bytes_to_hex(sha256.finish().result),
        elapsedSeconds: (Date.now() - startTime) / 1000
    });
});
