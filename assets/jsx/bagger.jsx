var React = require('react/addons');

import { BagContents } from '../jsx/bagcontents.jsx';
import { SelectFiles } from '../jsx/selectfiles.jsx';
import { Dashboard } from '../jsx/dashboard.jsx';


class Bagger extends React.Component {
    constructor(props) {
        super(props);

        this.uploadWorker = new Worker('upload-worker.js');

        this.hashWorkers = [];
        this.busyWorkers = new Set();

        for (var i = 0; i < 4; i++) {
            var w = new Worker('hash-worker.js');
            w.addEventListener('message', this.handleWorkerResponse.bind(this));
            this.hashWorkers.push(w);
        }

        this.state = {
            files: [],
            pendingFileHashKeys: [],
            // FIXME: this should have a less generic name:
            total: 0,
            bagging: false,
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
            this.setState({bagging: true});
            return;
        }

        this.setState({bagging: false});

        while (pendingFileHashKeys.length && (this.hashWorkers.length > this.busyWorkers.size)) {
            var nextHashWorkerId;

            for (var i = 0; i < this.hashWorkers.length; i++) {
                if (!this.busyWorkers.has(i)) {
                    this.busyWorkers.add(i);
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

        this.setState({activeHashWorkers: this.busyWorkers.size});
        console.log('Waiting for a free hash worker; current count: %d', this.busyWorkers.size);
    }

    handleWorkerResponse(evt) {
        var d = evt.data,
            workerId = d.workerId,
            fullPath = d.fullPath,
            fileSize = d.fileSize;

        this.busyWorkers.delete(d.workerId);

        switch (d.action) {
            case 'hash':
                var file,
                    files = this.state.files,
                    total = this.state.total,
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

                file.size = fileSize;
                total += fileSize;

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
                    total: total,
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

    render() {
        var stats = {
            files: {
                total: this.state.files.length,
                size: this.state.total
            },
            hashWorkers: {
                total: this.hashWorkers.length,
                active: this.busyWorkers.size,
                pendingFiles: this.state.pendingFileHashKeys.length,
                totalBytes: this.state.performance.hashWorkers.bytes,
                totalTime: this.state.performance.hashWorkers.time
            },
            uploadWorkers: {
                total: 2,
                active: 2,
                pendingFiles: 1234,
                totalBytes: this.state.performance.uploadWorkers.bytes,
                totalTime: this.state.performance.uploadWorkers.time
            }
        };

        return (
            <div className="bagger">
                <h1>Add files</h1>
                <SelectFiles onFilesChange={this.handleFilesChanged.bind(this)} />

                <Dashboard {...stats} />

                <BagContents files={this.state.files} total={this.state.total} bagging={this.state.bagging} />
            </div>
        );
    }
}

export { Bagger };
