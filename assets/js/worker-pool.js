class WorkerPool {

    constructor(url, n, responseHandler) {
        this.messages = [];
        this.freeWorkers = new Set();
        this.callbacks = new Map();
        this.responseHandler = responseHandler;
        var pool = this;
        for (var i = 0; i < n; i++) {
            var w = new Worker(url);
            w.addEventListener('message', evt => {
                console.log(evt);
                pool.freeWorkers.add(w);
                //this.responseHandler(evt);
                if (pool.callbacks.has(evt.data.fullPath)) {
                    var cb = pool.callbacks.get(evt.data.fullPath);
                    pool.callbacks.delete(evt.fullPath);
                    console.log(cb);
                    cb(evt);
                }
                var message = pool.messages.shift();
                if (message !== undefined) {
                    pool.postMessage(message);
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

}

var pool = new WorkerPool('hash-worker.js', 4, null);

export function hash(message) {
    return new Promise(function (resolve, reject) {
        // TODO: create worker here to start... then grab from pool here
        pool.callbacks.set(message.fullPath, function cb(evt) {
            resolve(evt);
        });
        pool.postMessage(message)
    }).catch(function (error) {
        console.log('Failed!', error);
    })
}

export {
    hash
};
