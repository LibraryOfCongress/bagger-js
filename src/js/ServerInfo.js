/* global AWS */

import {$, $$} from "./utils.js";

export default class ServerInfo {
    constructor(elem, serverReadyCallback) {
        this.config = new Map();
        this.serverReadyCallback = serverReadyCallback;

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
    }

    setStatus(status, message) {
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
            this.serverReadyCallback(status);
        }
    }

    getS3Client() {
        AWS.config.update({
            accessKeyId: this.config.get("accessKeyId"),
            secretAccessKey: this.config.get("secretAccessKey"),
            region: this.config.get("region")
        });
        return new AWS.S3({signatureVersion: "v4"});
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
}
