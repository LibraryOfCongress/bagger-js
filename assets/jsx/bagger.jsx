var React = require('react/addons');

var AWS = require('aws-sdk');

import { ServerInfo } from '../jsx/server-info.jsx';
import { BagContents } from '../jsx/bagcontents.jsx';
import { SelectFiles } from '../jsx/selectfiles.jsx';
import { Dashboard } from '../jsx/dashboard.jsx';

import { WorkerPool } from '../js/worker-pool.js';

class Bagger extends React.Component {
    constructor(props) {
        super(props);

        this.hashWorkerPool = new WorkerPool('hash-worker.js', 4, this.handleHashWorkerResponse.bind(this));

        this.state = {
            awsConfig: {},
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

    updateServerInfo(k, v) {
        var newConfig = {};
        newConfig[k] = v;

        this.setState({awsConfig: React.addons.update(this.state.awsConfig, {$merge: newConfig})});
    }

    handleFilesChanged(newFiles) {
        var bagFiles = this.state.files;
        var newBagFiles = [];

        var uniqueFilenames = new Set(this.state.files.map(function (i) { return i.fullPath; }));

        for (var idx in newFiles) {
            var rec = newFiles[idx];

            if (uniqueFilenames.has(rec.fullPath)) {
                console.log('Skipping duplicate file', rec.fullPath);
                continue;
            }
            rec.hashes = {};
            newBagFiles.push(rec);
        }

        bagFiles = bagFiles.concat(newBagFiles);

        this.setState({files: bagFiles}, function() {
            for (var i in newBagFiles) {
                var file = newBagFiles[i];
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

                totalFilesHashed += 1;

                file.size = fileSize;
                totalBytes += fileSize;

                console.log('Received hashes for file %s from worker %i', fullPath, workerId, d.output);

                file.hashes = {};
                for (var hashName in d.output) { // jshint -W089
                    file.hashes[hashName] = d.output[hashName];
                }

                var taskPerf = d.performance;
                console.log('Hashed %i bytes in %s seconds (%s MB/s)', fileSize,
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
                    },
                    this.uploadFile.bind(this, file)
                );

                break;

            default:
                console.error('Received unknown %s message: %s', d.action, d);
        }
    }

    uploadFile(fileWrapper) {
        var file = fileWrapper.file,
            fullPath = fileWrapper.fullPath;

        // FIXME: make this configurable!
        AWS.config.update({
            accessKeyId: this.state.awsConfig.accessKeyId,
            secretAccessKey: this.state.awsConfig.secretAccessKey,
            region: this.state.awsConfig.region
        });

        console.log('Uploading %s (%i bytes)', fullPath, file.size);

        // TODO: set ContentMD5
        // TODO: make partSize, queueSize configurable
        // TODO: use leavePartsOnError to allow retries?

        var startTime,
            performance = this.state.performance;

        var uploadCompletionCallback = function (isError, data) {
            var elapsedSeconds = (Date.now() - startTime) / 1000;

            if (isError) {
                console.error('Error uploading %s: %s', fullPath, data);
                fileWrapper.bytesUploaded = 0;
                this.forceUpdate();
            } else {
                fileWrapper.bytesUploaded = file.size;

                this.setState({
                    totalFilesUploaded: this.state.totalFilesUploaded + 1,
                    performance: React.addons.update(performance, {
                        $merge: {
                            uploadWorkers: {
                                files: performance.uploadWorkers.files + 1,
                                bytes: performance.uploadWorkers.bytes + file.size,
                                time: performance.uploadWorkers.time + elapsedSeconds
                            }
                        }
                    })
                });
                console.log('Successfully uploaded', fullPath);
            }
        };

        var uploadProgressCallback = function (evt) {
            fileWrapper.bytesUploaded = evt.loaded;
            this.forceUpdate();
        };

        // We reset this to zero every time so our cumulative stats will be correct
        // after failures or retries:
        fileWrapper.bytesUploaded = 0;

        // TODO: make partSize and queueSize configurable
        var upload = new AWS.S3.ManagedUpload({
            partSize: 8 * 1024 * 1024,
            queueSize: 4,
            params: {
                Bucket: this.state.awsConfig.bucket,
                Key: fullPath,
                Body: file,
                ContentType: file.type
            }
        });

        upload.on('httpUploadProgress', uploadProgressCallback.bind(this));

        startTime = Date.now();

        upload.send(uploadCompletionCallback.bind(this));
    }

    render() {
        var bytesUploaded = 0;
        this.state.files.forEach(function (i) {
            bytesUploaded += i.bytesUploaded || 0;
        });

        var stats = {
            files: {
                total: this.state.files.length,
                size: this.state.totalBytes,
                bytesUploaded: bytesUploaded
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
                totalUploaded: this.state.performance.uploadWorkers.files,
                pendingFiles: this.state.files.length - this.state.totalFilesUploaded,
                totalBytes: this.state.performance.uploadWorkers.bytes,
                totalTime: this.state.performance.uploadWorkers.time,
                completed: this.state.files.length > 0 && this.state.files.length === this.state.totalFilesUploaded
            }
        };
        var hashing = this.state.files.length - this.state.totalFilesHashed > 0;

        return (
            <div className="bagger">
                <ServerInfo updateServerInfo={this.updateServerInfo.bind(this)} />

                <SelectFiles onFilesChange={this.handleFilesChanged.bind(this)} />

                <Dashboard {...stats} />

                <BagContents files={this.state.files} total={this.state.totalBytes} hashing={hashing} />
            </div>
        );
    }
}

export { Bagger };
