/* eslint-env worker */
/* global asmCrypto */

self.importScripts(
    "https://cdnjs.cloudflare.com/ajax/libs/asmCrypto/2.0.1/asmcrypto.all.es5.min.js"
);

const BLOCK_SIZE = 1048576;

self.addEventListener("message", ({ data: { file, fullPath } }) => {
    const fileSize = file.size;
    const sha256 = new asmCrypto.Sha256();
    const startMilliseconds = performance.now();

    for (
        let reader = new FileReaderSync(), start = 0, end;
        start < fileSize;
        start = end
    ) {
        end = start + Math.min(BLOCK_SIZE, fileSize - start);
        let slice = file.slice(start, end);
        let bytes = reader.readAsArrayBuffer(slice);

        // There was an undocumented API change at some point which requires this to be a Uint8Array rather than an ArrayBuffer:
        sha256.process(new Uint8Array(bytes));

        postMessage({
            type: "PROGRESS_UPDATE",
            fullPath,
            bytesHashed: end,
            elapsedMilliseconds: performance.now() - startMilliseconds,
        });
    }

    let hashResult = asmCrypto.bytes_to_hex(sha256.finish().result);

    // This is a sanity check against
    if (
        file.size > 0 &&
        hashResult ==
            "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    ) {
        throw `ASMCrypto hashed ${file.size} bytes as an empty result!`;
    }

    postMessage({
        type: "RESULT",
        fullPath,
        sha256: hashResult,
        bytesHashed: fileSize,
        elapsedMilliseconds: performance.now() - startMilliseconds,
    });
});
