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
            this.s3 = new AWS.S3({signatureVersion: "v4"});
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

        s3.getBucketCors(
            {
                Bucket: this.config.get("bucket")
            },
            (isError, data) => {
                if (isError) {
                    var errMessage = "ERROR";
                    if (data) {
                        errMessage += " (" + data + ")";
                    }
                    this.setStatus("unsuccessful", errMessage);
                } else {
                    this.setStatus("successful", "OK");
                    return true;
                }
            }
        );
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
                Bucket: this.config.get("bucket"),
                Key: this.keyFromPath(key)
            })
            .promise();
    }

    uploadObject(path, body, size, type, progressCallback) {
        this.ensureConfig();

        let bucket = this.config.get("bucket");

        let key = this.keyFromPath(path);

        // TODO: use leavePartsOnError to allow retries?
        // TODO: make partSize and queueSize configurable
        var upload = new AWS.S3.ManagedUpload({
            maxRetries: 6,
            partSize: 8 * 1024 * 1024,
            queueSize: 4,
            params: {
                Bucket: bucket,
                Key: key,
                Body: body,
                ContentType: type,
            }
        });

        if (progressCallback) {
            upload.on("httpUploadProgress", progressCallback);
        }

        return upload.promise();
    }
}
