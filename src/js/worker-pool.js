export default class WorkerPool {
    constructor(url, n, progressUpdate, hasherStatsUpdate) {
        this.n = n;
        this.hasherStatsUpdate = hasherStatsUpdate;
        this.messages = [];
        this.workers = new Set();
        this.activeWorkers = new Set();
        this.callbacks = new Map();
        var pool = this;
        for (var i = 0; i < n; i++) {
            let w = new Worker(url);
            w.addEventListener("message", (evt) => {
                switch (evt.data.type) {
                    case "PROGRESS_UPDATE":
                        progressUpdate(evt.data);
                        break;
                    case "RESULT":
                        pool.activeWorkers.delete(w);
                        if (pool.callbacks.has(evt.data.fullPath)) {
                            const cb = pool.callbacks.get(evt.data.fullPath);
                            cb(evt.data);
                            pool.callbacks.delete(evt.fullPath);
                        }
                        this.dispatch();
                }
            });
            w.addEventListener("error", (error) => {
                // These events have very limited information by design and are
                // thus minimally useful for debugging so we'll make sure our
                // error message at least includes some context:
                throw `Web worker fatal error: ${error}`;
            });
            this.workers.add(w);
        }
    }

    postMessage(message) {
        this.messages.push(message);
        this.dispatch();
    }

    dispatch() {
        const idleWorkers = new Set(
            [...this.workers].filter((w) => !this.activeWorkers.has(w))
        );
        for (var w of idleWorkers) {
            var message = this.messages.shift();
            if (message !== undefined) {
                this.activeWorkers.add(w);
                w.postMessage(message);
            } else {
                break;
            }
        }
        this.hasherStatsUpdate({
            activeHashers: this.activeWorkers.size,
            totalHashers: this.n,
        });
    }

    hash(message) {
        return new Promise((resolve) => {
            this.callbacks.set(message.fullPath, function cb(evt) {
                resolve(evt);
            });
            this.postMessage(message);
        });
    }
}
