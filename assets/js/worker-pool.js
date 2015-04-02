class WorkerPool {

    constructor(url, n, responseHandler) {
        this.n = n;
        this.workers = [];
        this.messages = [];

        for (var i = 0; i < n; i++) {
            var w = new Worker(url);
            w.addEventListener('message', this.handleWorkerResponse.bind(this));
            this.workers.push(w);
        }

        this.busyWorkers = new Set();
        this.responseHandler = responseHandler;
    }

    handleWorkerResponse(evt) {
        this.busyWorkers.delete(evt.data.workerId);
        this.responseHandler(evt);
        var message = this.messages.shift();
        if (message !== undefined) {
            this.postMessage(message);
        }
    }

    postMessage(message) {
        if (this.workers.length > this.busyWorkers.size) {
            var nextWorkerId;

            for (var i = 0; i < this.workers.length; i++) {
                if (!this.busyWorkers.has(i)) {
                    this.busyWorkers.add(i);
                    nextWorkerId = i;
                    break;
                }
            }
            if (nextWorkerId === null) {
                throw new Error('Could not find a free worker as expected');
            }
            message.workerId = nextWorkerId;
            this.workers[nextWorkerId].postMessage(message);
        } else {
            this.messages.push(message);
        }
    }
}

export { WorkerPool };
