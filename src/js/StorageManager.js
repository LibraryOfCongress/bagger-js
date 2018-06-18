/* global AWS */

import {$, $$} from "./utils.js";

export default class StorageManager {
    constructor(elem, serverStatusChangeCallback) {
        this.config = new Map();
        this.serverStatusChangeCallback = serverStatusChangeCallback;
        this.status = "untested";

        this.container = elem;
        this.statusButton = $(".configuration-status", elem);

        let form = $("form", elem);

        form.addEventListener("change", () => {
            this.getStateFromDOM();
        });

        form.addEventListener("submit", evt => {
            evt.preventDefault();
            this.testConfiguration();
            return false;
        });

        this.getStateFromDOM();
        this.testConfiguration();
    }

    getStateFromDOM() {
        $$("input", this.container).forEach(elem => {
            this.config.set(elem.id, elem.value);
        });

        AWS.config.update({
            accessKeyId: this.config.get("accessKeyId"),
            secretAccessKey: this.config.get("secretAccessKey"),
            region: this.config.get("region")
        });

        delete this.s3;
    }

    setStatus(status, message) {
        this.status = status;

        let classesForStatus = {
            untested: "btn btn-default",
            testing: "btn btn-info",
            unsuccessful: "btn btn-danger",
            successful: "btn btn-success"
        };

        let newClass = classesForStatus[status] || classesForStatus["untested"];

        this.statusButton.className = newClass;
        $(
            ".configuration-status-message",
            this.statusButton
        ).textContent = message;

        this.container.dataset.status = status;

        if (status == "successful") {
            let summary = $(".configuration-summary", this.container);
            let bucket = this.config.get("bucket"),
                keyPrefix = this.config.get("keyPrefix"),
                region = this.config.get("region");
            summary.textContent = `✅ ${bucket}${keyPrefix} (${region})`;

            if (this.serverStatusChangeCallback) {
                this.serverStatusChangeCallback(status);
            }
        }
    }

    getBaseUrl() {
        let bucket = this.config.get("bucket") || "";
        let keyPrefix = this.config.get("keyPrefix") || "";

        let basePath = `${bucket}/${keyPrefix}`;

        return new URL(
            basePath.replace(/[/]+/g, "/"),
            this.getS3Client().endpoint.href
        );
    }

    getS3Client() {
        if (!this.s3) {
            this.s3 = new AWS.S3({
                signatureVersion: "v4",
                params: {
                    Bucket: this.config.get("bucket")
                }
            });
        }
        return this.s3;
    }

    testConfiguration() {
        if ([...this.config.entries()].filter(([, v]) => !v).length > 0) {
            this.setStatus("untested", "");
            return false;
        }

        let s3 = this.getS3Client();

        this.setStatus("testing", "Waiting…");

        let errLog = this.container.querySelector(".configuration-status-test-result");
        errLog.classList.add("hidden");
        errLog.textContent = "";

        s3.getBucketCors({ Bucket: this.config.get("bucket") })
            .promise()
            .then(() => {
                this.setStatus("successful", "OK");
            })
            .catch(err => {
                this.setStatus("unsuccessful", err.message);

                errLog.classList.remove("hidden");

                errLog.textContent = [
                    `${err.code}: ${err.message}`,
                    `Region: ${err.region}`,
                    `Hostname: ${err.hostname}`,
                    `Stack: ${err.stack}`
                ].join("\n");
            });
    }

    ready() {
        return this.status == "successful";
    }

    ensureConfig() {
        if (!this.ready()) {
            throw "Test the configuration before calling getObject!";
        }
    }

    keyFromPath(path) {
        // Takes a path, adds the configured key prefix, and normalizes the result

        let keyPrefix = this.config.get("keyPrefix");

        let key = `${keyPrefix}/${path}`;

        // Trim any leading slash from the key prefix or doubled slashes to
        // avoid S3 creating an empty “folder” and confusing clients:
        key = key.replace(/\/+/g, "/");
        key = key.replace(/^\/+/, "");

        return key;
    }

    getObject(key) {
        this.ensureConfig();

        return this.getS3Client()
            .getObject({
                Key: this.keyFromPath(key)
            })
            .promise();
    }

    uploadObject(path, body, size, type, progressCallback) {
        this.ensureConfig();

        let key = this.keyFromPath(path);

        // TODO: use leavePartsOnError to allow retries?
        // TODO: make partSize and queueSize configurable
        var upload = new AWS.S3.ManagedUpload({
            service: this.getS3Client(),
            maxRetries: 6,
            partSize: 8 * 1024 * 1024,
            queueSize: 4,
            params: {
                Key: key,
                Body: body,
                ContentType: type,
                computeChecksums: true
            }
        });

        if (progressCallback) {
            upload.on("httpUploadProgress", progressCallback);
        }

        return upload.promise();
    }

    listObjectsWithPrefix(pathPrefix, payloadCallback, completionCallback) {
        this.ensureConfig();

        if (!pathPrefix) {
            throw "Path prefix must be non-empty!";
        }

        pathPrefix = this.keyFromPath(pathPrefix);

        let params = {Prefix: pathPrefix, MaxKeys: 1000};
        let s3 = this.getS3Client();

        let errHandler = err => {
            console.error("listObjectsWithPrefix", pathPrefix, err);
        };

        let listObjectsV2 = params => {
            return s3
                .listObjectsV2(params)
                .promise()
                .catch(errHandler);
        };

        let wrappedCallback = resp => {
            payloadCallback(resp.Contents);

            if (resp.IsTruncated) {
                listObjectsV2({
                    ...params,
                    ContinuationToken: resp.NextContinuationToken
                }).then(wrappedCallback);
            } else {
                completionCallback();
            }
        };

        return listObjectsV2(params).then(wrappedCallback);
    }

    deleteObjectsWithPrefix(pathPrefix, completionCallback) {
        // In the absence of https://github.com/aws/aws-sdk-js/issues/1654 this
        // is tedious given the cumbersome design of the AWS JS SDK around
        // pagination. At some point this should be rewritten to use async
        // generators so the caller isn't forced to know about the internal
        // details.

        this.ensureConfig();

        if (!pathPrefix) {
            throw "Path prefix must be non-empty!";
        }

        pathPrefix = this.keyFromPath(pathPrefix);

        if (!pathPrefix.endsWith("/")) {
            throw "The prefix to delete must end with a /!";
        }

        let s3 = this.getS3Client();

        this.listObjectsWithPrefix(
            pathPrefix,
            objects => {
                let objectsToDelete = objects.map(i => {
                    return {
                        Key: i.Key
                    };
                });

                if (objectsToDelete.length < 1) {
                    console.debug("Not deleting empty object list", objects);
                    return;
                }

                s3.deleteObjects({
                    Delete: {
                        Objects: objectsToDelete
                    }
                })
                    .promise()
                    .catch(err => {
                        console.error(
                            "deleteObjectsWithPrefix",
                            pathPrefix,
                            err
                        );
                    })
                    .then(data => {
                        if ("Errors" in data && data.Errors.length > 0) {
                            console.error(
                                `Error while deleting prefix ${pathPrefix}:`,
                                data.Errors
                            );
                        }
                    });
            },
            completionCallback
        );
    }
}
