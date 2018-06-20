export default class UploadQueue {
    constructor(maxActiveUploads, uploadFunction) {
        this.maxActiveUploads = maxActiveUploads;
        this.active = false;
        this.activeUploads = 0;
        this.queue = [];
        this.uploadFunction = uploadFunction;
    }

    start() {
        this.active = true;
        this.run();
    }

    stop() {
        this.active = false;
    }

    add(path, file) {
        this.queue.push([path, file]);
        this.run();
    }

    delete(path) {
        this.queue.forEach((elem, idx) => {
            if (elem[0] == path) {
                this.queue.splice(idx, 1);
            }
        });
    }

    run() {
        if (
            !this.active ||
            this.queue.length < 1 ||
            this.activeUploads > this.maxActiveUploads
        ) {
            return;
        }

        let [path, file] = this.queue.shift();

        this.activeUploads++;
        this.uploadFunction(path, file, file.size, file.type).then(() => {
            this.activeUploads--;
            this.run();
        });
    }
}
