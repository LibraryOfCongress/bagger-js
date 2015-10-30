var React = require('react/addons');

var AWS = require('aws-sdk');

var filesize = require('filesize');

import { ServerInfo } from '../jsx/server-info.jsx';
import { BagContents } from '../jsx/bagcontents.jsx';
import { SelectFiles } from '../jsx/selectfiles.jsx';
import { Dashboard } from '../jsx/dashboard.jsx';

import { WorkerPool } from '../js/worker-pool.js';

class Bagger extends React.Component {
    constructor(props) {
        super(props);

        this.hashWorkerPool = new WorkerPool('hash-worker.js', 4, this.handleHashWorkerResponse.bind(this));

        // FIXME: allow awsConfig to be passed in using the querystring and/or data attributes:
        this.state = {
            awsConfig: {
                accessKeyId: 'Not really',
                secretAccessKey: 'Definitely Not',
                bucket: 'bagger-js-testing',
                region: 'us-east-1',
                keyPrefix: 'my-test-bag'
            },
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
            rec.hashes = new Map();
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
                var fileWrapper,
                    files = this.state.files,
                    totalBytes = this.state.totalBytes,
                    totalFilesHashed = this.state.totalFilesHashed,
                    performance = this.state.performance;

                for (var i in files) {
                    if (files[i].fullPath === fullPath) {
                        fileWrapper = files[i];
                        break;
                    }
                }

                if (!fileWrapper) {
                    console.error("Couldn't find file %s in files", fullPath, files);
                    return;
                }

                totalFilesHashed += 1;

                fileWrapper.size = fileSize;
                totalBytes += fileSize;

                console.log('Received hashes for file %s from worker %i', fullPath, workerId, d.output);

                for (var hashName in d.output) { // jshint -W089
                    fileWrapper.hashes[hashName] = d.output[hashName];
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
                    () => {
                        var key = this.state.awsConfig.keyPrefix + '/data/' + fileWrapper.fullPath;

                        // We reset this to zero every time so our cumulative stats will be correct
                        // after failures or retries:
                        fileWrapper.bytesUploaded = 0;

                        this.uploadFile(key, fileWrapper.type, fileWrapper.file,
                            () => { // Success
                                fileWrapper.bytesUploaded = fileSize;
                                this.forceUpdate();
                            },

                            () => { // Reset the total on error since S3 doesn't retain partials:
                                fileWrapper.bytesUploaded = 0;
                                this.forceUpdate();
                            },

                            (progressEvent) => {
                                // Progress should update the status bar after each chunk for visible feedback
                                // on large files:
                                fileWrapper.bytesUploaded = progressEvent.loaded;
                                this.forceUpdate();
                            }
                        );
                    }
                );

                break;

            default:
                console.error('Received unknown %s message: %s', d.action, d);
        }
    }

    finalizeBag() {
        var keyPrefix = this.state.awsConfig.keyPrefix;

        // FIXME: Bag Info UI — https://github.com/LibraryOfCongress/bagger-js/issues/13
        var bagInfo = 'Bag-Size: ' + filesize(this.state.totalBytes, {round: 0});

        bagInfo += 'Payload-Oxum: ' + this.state.totalBytes + '.' + this.state.files.length + '\n';

        this.uploadFile(keyPrefix + '/bag-info.txt', 'text/plain', bagInfo);

        this.uploadFile(keyPrefix + '/bagit.txt', 'text/plain',
                        'BagIt-Version: 0.97\nTag-File-Character-Encoding: UTF-8\n');

        var manifests = new Map();

        // Map.forEach and for…of is silently broken on Chrome 46 & behaves as if empty

        this.state.files.forEach((fileWrapper) => {

            for (var hashName in fileWrapper.hashes) {
                var hashValue = fileWrapper.hashes[hashName];

                if (!(hashName in manifests)) {
                    manifests[hashName] = [];
                }

                manifests[hashName].push(hashValue + ' data/' + fileWrapper.fullPath);
            }
        });

        for (var hashName in manifests) {
            var manifest = manifests[hashName].join('\n');
            this.uploadFile(keyPrefix + '/manifest-' + hashName + '.txt', 'text/plain', manifest);
        }

        // FIXME: refactor total bytes / files counts to account for metadata files
    }

    uploadFile(key, contentType, body, successCallback, errorCallback, progressCallback) {
        // FIXME: better management of AWS config
        AWS.config.update({
            accessKeyId: this.state.awsConfig.accessKeyId,
            secretAccessKey: this.state.awsConfig.secretAccessKey,
            region: this.state.awsConfig.region
        });

        var size = typeof body.size !== 'undefined' ? body.size : body.length;

        console.log('Uploading %s to %s (%i bytes)', key, this.state.awsConfig.bucket, size);

        // TODO: set ContentMD5
        // TODO: make partSize, queueSize configurable
        // TODO: use leavePartsOnError to allow retries?

        var startTime,
            performance = this.state.performance;

        var uploadCompletionCallback = (isError, data) => {
            var elapsedSeconds = (Date.now() - startTime) / 1000;

            if (isError) {
                console.error('Error uploading %s: %s', key, data);
                if (typeof errorCallback === 'function') {
                    errorCallback(data);
                }
            } else {
                console.log('Successfully uploaded', key);

                this.setState({
                    totalFilesUploaded: this.state.totalFilesUploaded + 1,
                    performance: React.addons.update(performance, {
                        $merge: {
                            uploadWorkers: {
                                files: performance.uploadWorkers.files + 1,
                                bytes: performance.uploadWorkers.bytes + size,
                                time: performance.uploadWorkers.time + elapsedSeconds
                            }
                        }
                    })
                });

                if (typeof successCallback === 'function') {
                    successCallback(data);
                }
            }
        };

        key = key.replace('//', '/');

        // TODO: make partSize and queueSize configurable
        var upload = new AWS.S3.ManagedUpload({
            partSize: 8 * 1024 * 1024,
            queueSize: 4,
            params: {
                Bucket: this.state.awsConfig.bucket,
                Key: key,
                Body: body,
                ContentType: contentType
            }
        });

        if (typeof progressCallback === 'function') {
            upload.on('httpUploadProgress', progressCallback);
        }

        startTime = Date.now();

        upload.send(uploadCompletionCallback);
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
                <ServerInfo updateServerInfo={this.updateServerInfo.bind(this)} {...this.state.awsConfig} />

                <p>Uploading to <code>s3://{this.state.awsConfig.bucket}/{this.state.awsConfig.keyPrefix}</code></p>

                <SelectFiles onFilesChange={this.handleFilesChanged.bind(this)} />

                <Dashboard {...stats} />

                <BagContents files={this.state.files} total={this.state.totalBytes} hashing={hashing} />

                <button className="btn btn-primary" onClick={this.finalizeBag.bind(this)}>Finalize!</button>
            </div>
        );
    }
}

export { Bagger };
