export default class BagEntry {
    constructor(element, path, file) {
        this.element = element;
        this.path = path;
        this.file = file;
        this.size = file.size;

        this.hashes = new Map();

        this.statistics = {
            hash: { bytes: 0, seconds: 0.0 },
            upload: { bytes: 0, seconds: 0.0 }
        };
    }
}
