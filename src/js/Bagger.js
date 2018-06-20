/* global filesize, asmCrypto */

import { $ } from "./utils.js";
import BagEntry from "./BagEntry.js";
import BagInfo from "./BagInfo.js";
import Dashboard from "./Dashboard.js";
import SelectFiles from "./SelectFiles.js";
import StorageManager from "./StorageManager.js";
import UploadQueue from "./UploadQueue.js";
import WorkerPool from "./worker-pool.js";

export default class Bagger {
    constructor(elem) {
        this.container = elem;

        // This tracks the size + hash information we'll need to generate the
        // manifests after a successful upload:
        this.bagEntries = new Map();

        this.uploadQueue = new UploadQueue(
            8,
            this.uploadPayloadFile.bind(this)
        );

        this.uploadQueueControl = elem.querySelector("#upload-queue-active");
        this.uploadQueueControl.addEventListener("change", evt => {
            let isActive = evt.target.checked;
            evt.target.classList.toggle("active", isActive);
            if (isActive) {
                this.uploadQueue.start();
            } else {
                this.uploadQueue.stop();
            }
        });

        this.bagInfo = new BagInfo($(".bag-info", elem));

        this.dashboard = new Dashboard($(".dashboard", elem));

        this.storage = new StorageManager($(".server-info", elem), status => {
            if (status == "successful") {
                this.validateBagName();
            }
        });

        this.fileSelector = new SelectFiles($(".dropzone", elem), files => {
            return this.addSelectedFiles(files);
        });

        this.hashPool = new WorkerPool(
            "js/hash-worker.js",
            4,
            // Hash result callback:
            evt => {
                this.dispatch({
                    type: "hash/progress",
                    path: evt.fullPath,
                    bytes: evt.bytesHashed,
                    elapsedMilliseconds: evt.elapsedMilliseconds
                });
            },
            // Worker Pool stats callback:
            stats => {
                this.container.dataset.activeHashes = stats.activeHashers;
            }
        );
        this.container.dataset.activeHashes = 0;

        this.finalizeControl = this.container.querySelector("#finalize-bag");

        this.finalizeControl.addEventListener("change", () => {
            this.finalizeIfReady();
        });

        this.bagContents = $(".bag-contents", elem);
        this.bagEntryTemplate = $("template", this.bagContents);

        $("#bagName").addEventListener(
            "input",
            this.updateBagUrlDisplay.bind(this)
        );
        $("#bagName").addEventListener(
            "change",
            this.validateBagName.bind(this)
        );

        this.validateBagName();
        this.updateDisplay();
    }

    dispatch(evt) {
        let m = evt.type.match(/^(hash|upload)\/(progress|complete)$/);
        if (m) {
            let entry = this.bagEntries.get(evt.path);
            // TODO: refactor the payload vs. tag file upload paths so we don't need to check here:
            if (entry) {
                let metric = entry.statistics[m[1]];
                if (!isFinite(evt.bytes)) {
                    throw "Malformed event: " + evt;
                }
                metric.bytes = evt.bytes;
                metric.seconds = evt.elapsedMilliseconds / 1000;
            } else {
                console.warn(`Couldn't match ${evt.path} to a payload entry`);
            }

            this.finalizeIfReady();
        } else if (evt.type == "upload/failure") {
            let entry = this.bagEntries.get(evt.path);
            if (entry) {
                // Since object stores don't save partial files we'll zero out the upload statistics:
                entry.statistics.upload.bytes = 0;
                entry.statistics.upload.seconds = 0;
            }
        }

        // We'll use rAF to throttle updates as preferred by the browser:
        window.requestAnimationFrame(() => {
            this.updateDisplay();
        });
    }

    updateDisplay() {
        this.container.dataset.entries = this.bagEntries.size;
        this.container.dataset.pendingHashes = this.getPendingHashCount();
        this.container.dataset.pendingUploads = this.getPendingUploadCount();

        this.updateDashboard();
    }

    getPendingHashCount() {
        let incompleteHashes = 0;

        for (let entry of this.bagEntries.values()) {
            if (entry.size > entry.statistics.hash.bytes) {
                incompleteHashes += 1;
            }
        }

        return incompleteHashes;
    }

    getPendingUploadCount() {
        let incompleteUploads = 0;

        for (let entry of this.bagEntries.values()) {
            if (entry.size > entry.statistics.upload.bytes) {
                incompleteUploads += 1;
            }
        }

        return incompleteUploads;
    }

    updateDashboard() {
        let totalFiles = 0,
            totalBytes = 0;
        let hashedFiles = 0,
            hashedBytes = 0,
            hashSeconds = 0.0;
        let uploadedFiles = 0,
            uploadedBytes = 0,
            uploadSeconds = 0.0;

        for (let entry of this.bagEntries.values()) {
            totalFiles++;
            totalBytes += entry.size;

            hashSeconds += entry.statistics.hash.seconds;
            hashedBytes += entry.statistics.hash.bytes;

            if (entry.statistics.hash.bytes == entry.size) {
                hashedFiles++;
            }

            uploadSeconds += entry.statistics.upload.seconds;
            uploadedBytes += entry.statistics.upload.bytes;

            if (entry.statistics.upload.bytes == entry.size) {
                uploadedFiles++;
            }
        }

        this.dashboard.updateDisplay({
            totalFiles,
            totalBytes,
            hashedFiles,
            hashedBytes,
            hashSeconds,
            uploadedFiles,
            uploadedBytes,
            uploadSeconds
        });
    }

    getBagName() {
        let bagName = this.container.querySelector('input[id="bagName"]').value;
        bagName = bagName.trim();

        bagName = bagName.replace(/[/+;]+/g, "_");

        return bagName;
    }

    getBagUrl() {
        return new URL(this.getBagName(), this.storage.getBaseUrl());
    }

    updateBagUrlDisplay() {
        let bagUrl = this.getBagUrl();
        let bagUrlLink = $(".bag-url", this.container);
        bagUrlLink.href = bagUrl;
        bagUrlLink.textContent = bagUrl;
    }

    setInvalidBagName(isInvalid) {
        this.container.dataset.invalidBagName = this.invalidBagName = isInvalid;
    }

    updateBagNameDisplay() {
        this.container.dataset.invalidBagName = this.invalidBagName;
    }

    validateBagName() {
        let bagName = this.getBagName();

        this.container.dataset.bagName = bagName;

        if (!bagName || !this.storage.ready()) {
            this.setInvalidBagName(true);
            this.updateBagNameDisplay();
            return;
        }

        this.updateBagUrlDisplay();

        this.storage
            .getObject(`${bagName}/bagit.txt`)
            .catch(err => {
                // We expect a 404 but probably want to let the user know if we
                // get some other error which could indicate a problem with
                // their network configuration
                if (err.statusCode != 404) {
                    alert(
                        `Unexpected error checking status of bagit.txt: ${err}`
                    );
                }
            })
            .then(response => {
                if (!response) {
                    // No object by that name:
                    this.setInvalidBagName(false);
                } else if (
                    confirm(
                        "A bag with that name already exists. Do you want to DELETE it and upload a replacement?"
                    )
                ) {
                    // We'll trigger deletion of all existing files with this prefix and disable the upload queue until it completes:
                    this.setInvalidBagName(false);

                    this.uploadQueue.stop();
                    this.uploadQueueControl.setAttribute(
                        "disabled",
                        "disabled"
                    );
                    this.storage.deleteObjectsWithPrefix(bagName + "/", () => {
                        this.uploadQueueControl.removeAttribute("disabled");
                    });
                } else {
                    this.setInvalidBagName(true);
                }
            })
            .finally(() => {
                this.updateBagNameDisplay();
                this.updateBagUrlDisplay();
            });
    }

    displayBagEntry(fullPath) {
        let entryTemplate = document.importNode(
            this.bagEntryTemplate.content,
            true
        );

        let elem = entryTemplate.querySelector("tr");
        elem.id = fullPath;

        $("tbody", this.bagContents).appendChild(entryTemplate);

        return elem;
    }

    updateBagEntryDisplay(bagEntry) {
        let elem = bagEntry.element;

        $(".file-name", elem).textContent = bagEntry.path;
        $(".file-size", elem).textContent = filesize(bagEntry.size, {
            round: 1
        });

        for (let [name, hash] of bagEntry.hashes) {
            let e = $(`.file-hash.${name}`, elem);
            if (e) {
                e.textContent = hash;
            }
        }
    }

    updateBagContentsDisplay() {
        let totalCount = this.bagEntries.size;
        let totalSize = 0;
        for (let entry of this.bagEntries.values()) {
            totalSize += entry.size;
        }

        let formattedCount = `${totalCount.toLocaleString()} files`; // Flag for i18n

        this.container.dataset.entries = totalCount;

        $(".file-count.total", this.bagContents).textContent = formattedCount;

        $(".file-size.total", this.bagContents).textContent = filesize(
            totalSize,
            { round: 1 }
        );
    }

    addSelectedFiles(files) {
        // TODO: we should reconcile the bag name form field and/or detect a common prefix on dropped directories before starting any uploads

        for (let [fullPath, file] of files) {
            let elem = this.displayBagEntry(fullPath);

            let bagEntry = new BagEntry(elem, fullPath, file);

            this.bagEntries.set(fullPath, bagEntry);

            this.updateBagEntryDisplay(bagEntry);

            this.hashPool
                .hash({ fullPath, file })
                .then(result => {
                    const {
                        fullPath: path,
                        sha256: hash,
                        bytesHashed,
                        elapsedMilliseconds
                    } = result;

                    bagEntry.hashes.set("sha256", hash);

                    this.dispatch({
                        type: "hash/complete",
                        path,
                        bytes: bytesHashed,
                        elapsedMilliseconds
                    });

                    this.updateBagEntryDisplay(bagEntry);
                })
                .catch(function(error) {
                    this.dispatch({
                        type: "hash/failure",
                        path: fullPath,
                        message: error
                    });
                    throw error;
                });

            this.uploadQueue.add(fullPath, file);
        }

        this.updateBagContentsDisplay();
    }

    uploadFile(path, body, size, type, progressCallback) {
        // Upload a bag-relative path using the user-specified bag name prefix
        let bagName = this.getBagName();

        path = `${bagName}/${path}`;

        return this.storage.uploadObject(
            path,
            body,
            size,
            type,
            progressCallback
        );
    }

    uploadPayloadFile(payloadPath, file) {
        /*
            Upload a payload file

            The provided payload-relative path will be rewritten to use the
            BagIt layout (e.g. prefixing with "data/" for BagIt 1.0).

            The dispatcher will be called as each chunk is processes and when
            the upload finally succeeds or fails.
        */

        // We reset this to zero every time so our cumulative stats will be correct
        // after failures or retries:
        this.dispatch({
            type: "upload/progress",
            path: payloadPath,
            bytes: 0,
            elapsedMilliseconds: 0
        });

        let uploadStartTime = performance.now();

        let progressCallback = progressEvent => {
            this.dispatch({
                type: "upload/progress",
                path: payloadPath,
                bytes: progressEvent.loaded,
                elapsedMilliseconds: performance.now() - uploadStartTime
            });
        };

        return this.uploadFile(
            `data/${payloadPath}`,
            file,
            file.size,
            file.type,
            progressCallback
        )
            .then(() => {
                this.dispatch({
                    type: "upload/complete",
                    path: payloadPath,
                    elapsedMilliseconds: performance.now() - uploadStartTime,
                    bytes: file.size
                });
            })

            .catch(err => {
                this.dispatch({
                    type: "upload/failure",
                    path: payloadPath,
                    elapsedMilliseconds: performance.now() - uploadStartTime,
                    message: err
                });
            });
    }

    finalizeIfReady() {
        let pendingUploads = this.getPendingUploadCount();
        let pendingHashes = this.getPendingHashCount();

        if (
            this.bagEntries.size > 0 &&
            pendingHashes == 0 &&
            pendingUploads == 0 &&
            this.finalizeControl.checked
        ) {
            this.finalizeBag();
        }
    }

    finalizeBag() {
        this.container.classList.add("finalizing");

        let uploadPromises = [];

        let totalBytes = 0;
        let totalFiles = this.bagEntries.size;

        let manifests = new Map();
        let tagManifestItems = [];

        for (let [fullPath, bagEntry] of this.bagEntries) {
            if (bagEntry.statistics.upload.bytes != bagEntry.size) {
                throw `Cannot finalize bag before ${fullPath} has been uploaded!`;
            }

            totalBytes += bagEntry.size;

            for (let [hashName, hashDigest] of bagEntry.hashes) {
                if (!manifests.has(hashName)) {
                    manifests.set(hashName, []);
                }

                let manifest = manifests.get(hashName);
                manifest.push(`${hashDigest} data/${fullPath}`);
            }
        }

        for (let [hashName, entries] of manifests) {
            let body = entries.join("\n") + "\n";
            let bodyHash = this.sha256(body);
            tagManifestItems.push(`${bodyHash} manifest-${hashName}.txt`);
            uploadPromises.push(
                this.uploadFile(
                    "manifest-" + hashName + ".txt",
                    body,
                    body.length,
                    "text/plain"
                )
            );
        }

        let bagInfo = "Bag-Size: " + filesize(totalBytes, { round: 1 });
        bagInfo += "\nPayload-Oxum: " + totalBytes + "." + totalFiles + "\n";

        this.bagInfo.getValues().forEach(([label, value]) => {
            bagInfo += `${label}: ${value}\n`;
        });

        let bagIt = "BagIt-Version: 1.0\nTag-File-Character-Encoding: UTF-8\n";

        uploadPromises.push(
            this.uploadFile(
                "bag-info.txt",
                bagInfo,
                bagInfo.length,
                "text/plain"
            )
        );

        uploadPromises.push(
            this.uploadFile("bagit.txt", bagIt, bagIt.length, "text/plain")
        );

        tagManifestItems.push(`${this.sha256(bagIt)} bagit.txt`);
        tagManifestItems.push(`${this.sha256(bagInfo)} bag-info.txt`);

        let tagManifest = tagManifestItems.join("\n") + "\n";
        uploadPromises.push(
            this.uploadFile(
                "tagmanifest-sha256.txt",
                tagManifest,
                tagManifest.length,
                "text/plain"
            )
        );

        Promise.all(uploadPromises).then(() => {
            this.container.classList.add("finalized");
            this.container.querySelectorAll("form,input,button").forEach(i => {
                i.setAttribute("readonly", "readonly");
                i.setAttribute("disabled", "disabled");
            });
            this.container.querySelectorAll(".btn").forEach(i => {
                i.classList.add("disabled");
            });
        });
    }

    sha256(inputString) {
        let inputBytes = new TextEncoder().encode(inputString);
        let sha256 = new asmCrypto.Sha256();
        sha256.process(inputBytes);
        return asmCrypto.bytes_to_hex(sha256.finish().result);
    }
}
