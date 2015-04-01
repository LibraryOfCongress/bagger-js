var React = require('react/addons');

import { BagContents } from '../jsx/bagcontents.jsx';
import { SelectFiles } from '../jsx/selectfiles.jsx';
import { Dashboard } from '../jsx/dashboard.jsx';


class Bagger extends React.Component {
    constructor(props) {
        super(props);

        this.hashWorkers = [];
        this.busyWorkers = new Set();

        this.uploaders = [];
        this.busyUploaders = new Set();

        for (var i = 0; i < 4; i++) {
            var w = new Worker('hash-worker.js');
            w.addEventListener('message', this.handleWorkerResponse.bind(this));
            this.hashWorkers.push(w);
        }

        for (i = 0; i < 4; i++) {
            w = new Worker('upload-worker.js');
            w.addEventListener('message', this.handleUploaderResponse.bind(this));
            this.uploaders.push(w);
        }

        this.state = {
            files: [],
            pendingFileHashKeys: [],
            pendingFileUploadKeys: [],
            // FIXME: this should have a less generic name:
            totalHashed: 0,
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
        var bagFiles = [].concat(this.state.files), pendingKeys = [].concat(this.state.pendingFileHashKeys),
            pendingUploadKeys = [].concat(this.state.pendingFileUploadKeys);

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
            pendingUploadKeys.push(newRowId);
        }

        this.setState({files: bagFiles, pendingFileHashKeys: pendingKeys},
                      this.checkHashQueue.bind(this));
        this.setState({pendingFileUploadKeys: pendingUploadKeys},
                      this.checkUploadQueue.bind(this));
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

    checkUploadQueue() {
        var files = this.state.files, pendingFileUploadKeys = this.state.pendingFileUploadKeys;

        if (pendingFileUploadKeys.length < 1) {
            console.debug('No pending files to upload');
            this.setState({uploading: true});
            return;
        }

        this.setState({uploading: false});

        while (pendingFileUploadKeys.length && (this.uploaders.length > this.busyUploaders.size)) {
            var nextUploadWorkerId;

            for (var i = 0; i < this.uploaders.length; i++) {
                if (!this.busyUploaders.has(i)) {
                    this.busyUploaders.add(i);
                    nextUploadWorkerId = i;
                    break;
                }
            }

            if (nextUploadWorkerId === null) {
                throw new Error('Could not find a free worker as expected');
            }

            var file = files[pendingFileUploadKeys.shift()];

            console.log('Telling worker %d to upload file %s (%d queued)', nextUploadWorkerId, file.fullPath,
                        pendingFileUploadKeys.length);

            this.uploaders[nextUploadWorkerId].postMessage({
                'workerId': nextUploadWorkerId,
                'file': file.file,
                'fullPath': file.fullPath,
                'action': 'upload'
            });
        }

        this.setState({activeUploadWorkers: this.busyUploaders.size});
        console.log('Waiting for a free upload worker; current count: %d', this.busyUploaders.size);
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
                    totalHashed = this.state.totalHashed,
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
                totalHashed += fileSize;

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
                    totalHashed: totalHashed,
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

        this.busyUploaders.delete(d.workerId);

        switch (d.action) {
            case 'upload':
                var file,
                    files = this.state.files,
                    totalUploaded = this.state.totalUploaded,
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

                console.log('Received upload for file %s from worker %d', fullPath, workerId, d.output);

                var taskPerf = d.performance;
                console.log('Uploaded %d bytes in %s seconds (%s MB/s)', fileSize,
                            taskPerf.seconds.toFixed(2),
                            ((fileSize / 1048576) / taskPerf.seconds).toFixed(1));

                this.setState({
                    files: files,
                    totalUploaded: totalUploaded,
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
                totalHashed: this.state.files.length,
                size: this.state.totalHashed
            },
            hashWorkers: {
                total: this.hashWorkers.length,
                active: this.busyWorkers.size,
                pendingFiles: this.state.pendingFileHashKeys.length,
                totalBytes: this.state.performance.hashWorkers.bytes,
                totalTime: this.state.performance.hashWorkers.time
            },
            uploadWorkers: {
                total: this.uploaders.length,
                active: this.busyUploaders.size,
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

                <BagContents files={this.state.files} total={this.state.totalHashed} hashing={this.state.hashing} />
            </div>
        );
    }
}

export { Bagger };
