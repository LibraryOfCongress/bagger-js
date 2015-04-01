var React = require('react/addons');

import { BagContents } from '../jsx/bagcontents.jsx';
import { SelectFiles } from '../jsx/selectfiles.jsx';
import { Dashboard } from '../jsx/dashboard.jsx';

class WorkerPool {

    constructor(url, n, responseHandler) {
        this.n = n;
        this.workers = [];

        for (var i = 0; i < n; i++) {
            var w = new Worker(url);
            w.addEventListener('message', responseHandler);
            this.workers.push(w);
        }

        this.busyWorkers = new Set();
        this.responseHandler = responseHandler;
    }

    handlerWorkerResponse(evt) {
        this.busyWorkers.delete(evt.data.workerId);
        this.responseHandler(evt);
    }

    workerFree() {
        return (this.workers.length > this.busyWorkers.size);
    }

    postMessage(message) {
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
    }
}

class Bagger extends React.Component {
    constructor(props) {
        super(props);

        this.hashWorkers = [];
        this.busyHashWorkers = new Set();

        this.uploadWorkerPool = new WorkerPool('upload-worker.js', 4, this.handleUploaderResponse.bind(this));

        for (var i = 0; i < 4; i++) {
            var w = new Worker('hash-worker.js');
            w.addEventListener('message', this.handleHashWorkerResponse.bind(this));
            this.hashWorkers.push(w);
        }

        this.state = {
            files: [],
            pendingFileHashKeys: [],
            pendingFileUploadKeys: [],
            totalBytes: 0,
            totalFilesUploaded: 0,
            hashing: false,
            performance: {
                hashWorkers: {
                    files: 0,
                    bytes: 0,
                    time: 0
                },
                uploadWorkers: {
                    files: 0,
                    bytes: 0,
                    time: 0
                }
            }
        };
    }

    handleFilesChanged(newFiles) {
        var bagFiles = [].concat(this.state.files), pendingKeys = [].concat(this.state.pendingFileHashKeys);

        var uniqueFilenames = new Set(this.state.files.map(function (i) { return i.fullPath; }));

        for (var idx in newFiles) {
            var rec = newFiles[idx];

            if (uniqueFilenames.has(rec.fullPath)) {
                console.log('Skipping duplicate file', rec.fullPath);
                continue;
            }

            rec.hashes = {};

            var newRowId = bagFiles.push(rec) - 1;
            pendingKeys.push(newRowId);
        }

        this.setState({files: bagFiles, pendingFileHashKeys: pendingKeys},
                      this.checkHashQueue.bind(this));

        return;
    }

    checkHashQueue() {
        var files = this.state.files, pendingFileHashKeys = this.state.pendingFileHashKeys;

        if (pendingFileHashKeys.length < 1) {
            console.debug('No pending files to hash');
            this.setState({hashing: true});
            return;
        }

        this.setState({hashing: false});

        while (pendingFileHashKeys.length && (this.hashWorkers.length > this.busyHashWorkers.size)) {
            var nextHashWorkerId;

            for (var i = 0; i < this.hashWorkers.length; i++) {
                if (!this.busyHashWorkers.has(i)) {
                    this.busyHashWorkers.add(i);
                    nextHashWorkerId = i;
                    break;
                }
            }

            if (nextHashWorkerId === null) {
                throw new Error('Could not find a free worker as expected');
            }

            var file = files[pendingFileHashKeys.shift()];

            console.log('Telling worker %d to process file %s (%d queued)', nextHashWorkerId, file.fullPath,
                        pendingFileHashKeys.length);

            this.hashWorkers[nextHashWorkerId].postMessage({
                'workerId': nextHashWorkerId,
                'file': file.file,
                'fullPath': file.fullPath,
                'action': 'hash'
            });
        }

        this.setState({activeHashWorkers: this.busyHashWorkers.size});
        console.log('Waiting for a free hash worker; current count: %d', this.busyHashWorkers.size);
    }

    checkUploadQueue() {
        var files = this.state.files, pendingFileUploadKeys = this.state.pendingFileUploadKeys;

        if (pendingFileUploadKeys.length < 1) {
            console.debug('No pending files to upload');
            this.setState({uploading: true});
            return;
        }

        this.setState({uploading: false});

        while (pendingFileUploadKeys.length && this.uploadWorkerPool.workerFree()) {

            var file = files[pendingFileUploadKeys.shift()];

            //console.log('Telling worker %d to upload file %s (%d queued)', nextUploadWorkerId, file.fullPath, pendingFileUploadKeys.length);

            this.uploadWorkerPool.postMessage({
                'file': file.file,
                'fullPath': file.fullPath,
                'action': 'upload'
            });
        }

        this.setState({activeUploadWorkers: this.uploadWorkerPool.busyWorkers.size});
        console.log('Waiting for a free upload worker; current count: %d', this.uploadWorkerPool.busyWorkers.size);
    }

    handleHashWorkerResponse(evt) {
        var d = evt.data,
            workerId = d.workerId,
            fullPath = d.fullPath,
            fileSize = d.fileSize;

        this.busyHashWorkers.delete(d.workerId);

        switch (d.action) {
            case 'hash':
                var file,
                    files = this.state.files,
                    totalBytes = this.state.totalBytes,
                    performance = this.state.performance;

                for (var i in files) {
                    file = files[i];
                    if (file.fullPath === fullPath) {
                        break;
                    }
                }

                if (!file) {
                    console.error("Couldn't find file %s in files", fullPath, files);
                    return;
                }

                var pendingUploadKeys = [].concat(this.state.pendingFileUploadKeys);
                pendingUploadKeys.push(i);
                this.setState({pendingFileUploadKeys: pendingUploadKeys},
                              this.checkUploadQueue.bind(this));

                file.size = fileSize;
                totalBytes += fileSize;

                console.log('Received hashes for file %s from worker %d', fullPath, workerId, d.output);

                for (var hashName in d.output) { // jshint -W089
                    file.hashes[hashName] = d.output[hashName];
                }

                var taskPerf = d.performance;
                console.log('Hashed %d bytes in %s seconds (%s MB/s)', fileSize,
                            taskPerf.seconds.toFixed(2),
                            ((fileSize / 1048576) / taskPerf.seconds).toFixed(1));

                this.setState({
                    files: files,
                    totalBytes: totalBytes,
                    performance: React.addons.update(performance, {
                        $merge: {
                            hashWorkers: {
                                files: performance.hashWorkers.files + 1,
                                bytes: performance.hashWorkers.bytes + fileSize,
                                time: performance.hashWorkers.time + taskPerf.seconds
                            }
                        }
                    })
                });
                this.checkHashQueue();
                break;

            default:
                console.error('Received unknown %s message: %s', d.action, d);
        }
    }

    handleUploaderResponse(evt) {
        var d = evt.data,
            workerId = d.workerId,
            fullPath = d.fullPath,
            fileSize = d.fileSize;

        switch (d.action) {
            case 'upload':
                var file,
                    files = this.state.files,
                    totalUploaded = this.state.totalUploaded,
                    totalFilesUploaded = this.state.totalFilesUploaded,
                    performance = this.state.performance;

                for (var i in files) {
                    file = files[i];
                    if (file.fullPath === fullPath) {
                        break;
                    }
                }

                if (!file) {
                    console.error("Couldn't find file %s in files", fullPath, files);
                    return;
                }

                //file.size = fileSize;
                totalUploaded += fileSize;
                totalFilesUploaded += 1;

                console.log('Received upload for file %s from worker %d', fullPath, workerId, d.output);

                var taskPerf = d.performance;
                console.log('Uploaded %d bytes in %s seconds (%s MB/s)', fileSize,
                            taskPerf.seconds.toFixed(2),
                            ((fileSize / 1048576) / taskPerf.seconds).toFixed(1));

                this.setState({
                    files: files,
                    totalUploaded: totalUploaded,
                    totalFilesUploaded: totalFilesUploaded,
                    performance: React.addons.update(performance, {
                        $merge: {
                            uploadWorkers: {
                                files: performance.uploadWorkers.files + 1,
                                bytes: performance.uploadWorkers.bytes + fileSize,
                                time: performance.uploadWorkers.time + taskPerf.seconds
                            }
                        }
                    })
                });
                this.checkUploadQueue();
                break;

            default:
                console.error('Received unknown %s message: %s', d.action, d);
        }
    }

    render() {
        var stats = {
            files: {
                total: this.state.files.length,
                size: this.state.totalBytes
            },
            hashWorkers: {
                total: this.hashWorkers.length,
                active: this.busyHashWorkers.size,
                pendingFiles: this.state.pendingFileHashKeys.length,
                totalBytes: this.state.performance.hashWorkers.bytes,
                totalTime: this.state.performance.hashWorkers.time
            },
            uploadWorkers: {
                total: this.uploadWorkerPool.workers.length,
                totalUploaded: this.state.totalFilesUploaded,
                active: this.uploadWorkerPool.busyWorkers.size,
                pendingFiles: this.state.pendingFileUploadKeys.length,
                totalBytes: this.state.performance.uploadWorkers.bytes,
                totalTime: this.state.performance.uploadWorkers.time
            }
        };

        return (
            <div className="bagger">
                <h1>Add files</h1>
                <SelectFiles onFilesChange={this.handleFilesChanged.bind(this)} />

                <Dashboard {...stats} />

                <BagContents files={this.state.files} total={this.state.totalBytes} hashing={this.state.hashing} />
            </div>
        );
    }
}

export { Bagger };
