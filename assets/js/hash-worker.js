/* global self, postMessage, FileReaderSync */

import asmCrypto from 'asmcrypto.js';

const BLOCK_SIZE = 1048576;

self.addEventListener('message', ({data: {file, fullPath}}) => {
    const sha256 = new asmCrypto.SHA256();
    const startTime = Date.now();
    const fileSize = file.size;

    for (
        let reader = new FileReaderSync(), start = 0, end;
        start < fileSize;
        start = end
    ) {
        end = start + Math.min(BLOCK_SIZE, fileSize - start);
        let slice = file.slice(start, end);
        let bytes = reader.readAsArrayBuffer(slice);
        sha256.process(bytes);
        postMessage({type: 'PROGRESS_UPDATE', fullPath, hashed: end});
    }

    postMessage({
        type: 'RESULT',
        fullPath,
        sha256: asmCrypto.bytes_to_hex(sha256.finish().result),
        elapsedSeconds: (Date.now() - startTime) / 1000
    });
});
