/* global filesize, humanizeDuration */

import { $ } from "./utils.js";

class Dashboard {
    constructor(elem) {
        this.container = elem;
    }

    formatRate(value) {
        if (isFinite(value)) {
            return filesize(value, { round: 0 }) + "/s";
        } else {
            return "—";
        }
    }

    updateDisplay(data) {
        let hashComplete = data.hashedBytes / data.totalBytes || 0;
        let uploadComplete = data.uploadedBytes / data.totalBytes || 0;

        $(".hash meter", this.container).value = (100 * hashComplete).toFixed(
            0
        );
        $(".upload meter", this.container).value = (
            100 * uploadComplete
        ).toFixed(0);

        let hashRate = data.hashedBytes / data.hashSeconds;
        let uploadRate = data.uploadedBytes / data.uploadSeconds;

        $(".hash .rate", this.container).textContent = this.formatRate(
            hashRate
        );
        $(".upload .rate", this.container).textContent = this.formatRate(
            uploadRate
        );

        let hashRemaining = (data.totalBytes - data.hashedBytes) / hashRate;
        let uploadRemaining =
            (data.totalBytes - data.uploadedBytes) / uploadRate;

        // NOTE: humanizeDuration takes times in *milliseconds*

        $(".hash .remaining", this.container).textContent = humanizeDuration(
            hashRemaining * 1000,
            { round: true }
        );
        $(".upload .remaining", this.container).textContent = humanizeDuration(
            uploadRemaining * 1000,
            { round: true }
        );
    }
}

export default Dashboard;
