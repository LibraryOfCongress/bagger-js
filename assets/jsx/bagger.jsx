var React = require('react/addons');

import { BagContents } from '../jsx/bagcontents.jsx';
import { SelectFiles } from '../jsx/selectfiles.jsx';
import { Dashboard } from '../jsx/dashboard.jsx';

import { WorkerPool } from '../js/worker-pool.js';

class Bagger extends React.Component {
    constructor(props) {
        super(props);

        this.hashWorkerPool = new WorkerPool('hash-worker.js', 4, this.handleHashWorkerResponse.bind(this));

        this.uploadWorkerPool = new WorkerPool('upload-worker.js', 4, this.handleUploadWorkerResponse.bind(this));

        this.state = {
            files: [],
            totalBytes: 0,
            totalFilesHashed: 0,
            totalFilesUploaded: 0,
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
        var bagFiles = [].concat(this.state.files);

        var uniqueFilenames = new Set(this.state.files.map(function (i) { return i.fullPath; }));

        for (var idx in newFiles) {
            var rec = newFiles[idx];

            if (uniqueFilenames.has(rec.fullPath)) {
                console.log('Skipping duplicate file', rec.fullPath);
                continue;
            }

            rec.hashes = {};

            bagFiles.push(rec);
        }

        this.setState({files: bagFiles}, function() {
            for (var i in this.state.files) {
                var file = this.state.files[i];
                this.hashWorkerPool.postMessage(
                    {
                        'file': file.file,
                        'fullPath': file.fullPath,
                        'action': 'hash'
                    }
                );

            }
        });

        return;
    }

    handleHashWorkerResponse(evt) {
        var d = evt.data,
            workerId = d.workerId,
            fullPath = d.fullPath,
            fileSize = d.fileSize;

        switch (d.action) {
            case 'hash':
                var file,
                    files = this.state.files,
                    totalBytes = this.state.totalBytes,
                    totalFilesHashed = this.state.totalFilesHashed,
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

                this.uploadWorkerPool.postMessage(
                    {
                        'file': file.file,
                        'fullPath': file.fullPath,
                        'action': 'upload'
                    });

                totalFilesHashed += 1;

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
                    totalFilesHashed: totalFilesHashed,
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

                break;

            default:
                console.error('Received unknown %s message: %s', d.action, d);
        }
    }

    handleUploadWorkerResponse(evt) {
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

                totalUploaded += fileSize;
                totalFilesUploaded += 1;

                console.log('Received upload for file %s from worker %d', fullPath, workerId);

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
                total: this.hashWorkerPool.workers.length,
                active: this.hashWorkerPool.busyWorkers.size,
                pendingFiles: this.state.files.length - this.state.totalFilesHashed,
                totalBytes: this.state.performance.hashWorkers.bytes,
                totalTime: this.state.performance.hashWorkers.time,
                completed: this.hashWorkerPool.busyWorkers.size === 0 && this.state.files.length > 0 && this.state.files.length === this.state.totalFilesHashed
            },
            uploadWorkers: {
                total: this.uploadWorkerPool.workers.length,
                totalUploaded: this.state.totalFilesUploaded,
                active: this.uploadWorkerPool.busyWorkers.size,
                pendingFiles: this.state.files.length - this.state.totalFilesUploaded,
                totalBytes: this.state.performance.uploadWorkers.bytes,
                totalTime: this.state.performance.uploadWorkers.time,
                completed: this.uploadWorkerPool.busyWorkers.size === 0 && this.state.files.length > 0 && this.state.files.length === this.state.totalFilesUploaded
            }
        };
        var hashing = this.state.files.length - this.state.totalFilesHashed > 0;

        return (
            <div className="bagger">
                <h1>Add files</h1>
                <SelectFiles onFilesChange={this.handleFilesChanged.bind(this)} />

                <Dashboard {...stats} />

                <BagContents files={this.state.files} total={this.state.totalBytes} hashing={hashing} />
            </div>
        );
    }
}

export { Bagger };
