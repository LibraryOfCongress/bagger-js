class WorkerPool {

    constructor(url, n, progressUpdate) {
        this.messages = [];
        this.freeWorkers = new Set();
        this.callbacks = new Map();
        var pool = this;
        for (var i = 0; i < n; i++) {
            var w = new Worker(url);
            w.addEventListener('message', evt => {
                console.log(evt);
                switch (evt.data.type) {
                case 'PROGRESS_UPDATE':
                    progressUpdate(evt.data.fullPath, evt.data.hashed)
                case 'RESULT':
                    if (pool.callbacks.has(evt.data.fullPath)) {
                        const cb = pool.callbacks.get(evt.data.fullPath);
                        cb(evt);
                        pool.callbacks.delete(evt.fullPath);
                    }
                    var message = pool.messages.shift();
                    if (message !== undefined) {
                        w.postMessage(message);
                    } else {
                        pool.freeWorkers.add(w);
                    }
                }
            });
            w.addEventListener('error', error => console.log(error));
            this.freeWorkers.add(w);
        }

    }

    postMessage(message) {
        if (this.freeWorkers.size > 0) {
            const [freeWorker, ] = this.freeWorkers;
            this.freeWorkers.delete(freeWorker);
            freeWorker.postMessage(message);
        } else {
            this.messages.push(message);
        }
    }

    hash(message) {
        return new Promise((resolve, reject) => {
            this.callbacks.set(message.fullPath, function cb(evt) {
                resolve(evt);
            });
            this.postMessage(message)
        }).catch(function (error) {
            console.log('Failed!', error);
        })
    }
}

export {
    WorkerPool
};
