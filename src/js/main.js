import Bagger from "./Bagger.js";

window.baggerApp = new Bagger(document.getElementById("bagger"));

if (typeof DataTransferItemList === "undefined") {
    document
        .getElementById("directory-support-warning")
        .classList.remove("hidden");
}
