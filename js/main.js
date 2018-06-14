import Bagger from "./Bagger.js";

// Preseed form fields with values from the query string or hash:
for (let source of [document.location.search, document.location.hash]) {
    for (let [k, v] of new URLSearchParams(source).entries()) {
        let elem = document.getElementById(k);
        if (elem && "value" in elem) {
            elem.value = v;
        }
    }
}

window.baggerApp = new Bagger(document.getElementById("bagger"));

if (typeof DataTransferItemList === "undefined") {
    document
        .getElementById("directory-support-warning")
        .classList.remove("hidden");
}
