import * as ActionTypes from './ActionTypes';

import WorkerPool from './worker-pool';

import * as AWS from 'aws-sdk';

export function addFiles(files) {
    return {
        type: ActionTypes.ADD_FILES,
        files
    }
}

export function updateHash(fullPath, hash) {
    return {
        type: ActionTypes.UPDATE_HASH,
        fullPath,
        hash
    }
}

export function updateBytesUploaded(fullPath, bytesUploaded) {
    return {
        type: ActionTypes.UPDATE_BYTES_UPLOADED,
        fullPath,
        bytesUploaded
    }
}

export function updateBytesHashed(fullPath, bytesHashed) {
    return {
        type: ActionTypes.UPDATE_BYTES_HASHED,
        fullPath,
        bytesHashed
    }
}

export function updateHasherStats(hasherStats) {
    return {
        type: ActionTypes.UPDATE_HASHER_STATS,
        hasherStats
    }
}

export function updateThroughput() {
    return {
        type: ActionTypes.UPDATE_THROUGHPUT
    }
}

export function configStatus(status) {
    return {
        type: ActionTypes.CONFIG_STATUS,
        status
    }
}

export function updateConfig(accessKeyId, secretAccessKey, bucket, region, keyPrefix) {
    return {
        type: ActionTypes.UPDATE_CONFIG,
        accessKeyId,
        secretAccessKey,
        bucket,
        region,
        keyPrefix
    }
}

export function updateAndTestConfiguration(accessKeyId, secretAccessKey, bucket, region, keyPrefix) {
    return dispatch => {
        dispatch(updateConfig(accessKeyId, secretAccessKey, bucket, region, keyPrefix))
        dispatch(testConfiguration(accessKeyId, secretAccessKey, bucket, region, keyPrefix))
    }
}

function configureAWS(accessKeyId, secretAccessKey, region) {
    AWS.config.update({accessKeyId, secretAccessKey, region});
}

function getS3Client(accessKeyId, secretAccessKey, region) {
    configureAWS(accessKeyId, secretAccessKey, region);
    return new AWS.S3();
}

export function testConfiguration(accessKeyId, secretAccessKey, bucket, region, keyPrefix) {
    return dispatch => {
        // We'd like to be able to list buckets but that's impossible due to Amazon's CORS constraints:
        // https://forums.aws.amazon.com/thread.jspa?threadID=179355&tstart=0

        if (accessKeyId && secretAccessKey && region) {
            var s3 = getS3Client(accessKeyId, secretAccessKey, region);

            dispatch(configStatus({
                className: 'btn btn-info',
                message: 'Waiting…'
            }));

            s3.getBucketCors({
                Bucket: bucket
            }, (isError, data) => {
                if (isError) {
                    var errMessage = 'ERROR';

                    if (data) {
                        errMessage += ' (' + data + ')';
                    }

                    dispatch(configStatus({
                        className: 'btn btn-danger',
                        message: errMessage
                    }));

                } else {
                    dispatch(configStatus({
                        className: 'btn btn-success',
                        message: 'OK'
                    }));
                }
            });
        } else {
            dispatch(configStatus({
                className: 'btn btn-default',
                message: 'Untested'
            }));
        }
    }
}

export function upload(fullPath, file, size, type, bucket, keyPrefix) {
    return dispatch => {
        var key = keyPrefix + '/data/' + fullPath;
        key = key.replace('//', '/');

        // We reset this to zero every time so our cumulative stats will be correct
        // after failures or retries:
        dispatch(updateBytesUploaded(fullPath, 0));

        var startTime = Date.now();
        var body = file;

        var size = typeof body.size !== 'undefined' ? body.size : body.length;

        console.log('Uploading %s to %s (%i bytes)', key, bucket, size);

        // TODO: set ContentMD5
        // TODO: use leavePartsOnError to allow retries?
        // TODO: make partSize and queueSize configurable
        var upload = new AWS.S3.ManagedUpload({
            maxRetries: 6,
            partSize: 8 * 1024 * 1024,
            queueSize: 4,
            params: {
                Bucket: bucket,
                Key: key,
                Body: body,
                Contenttype: ActionTypes.type
            }
        });

        upload.on('httpUploadProgress', (progressEvent) => {
            // Progress should update the status bar after each chunk for visible feedback
            // on large files:
            dispatch(updateBytesUploaded(fullPath, progressEvent.loaded));
        });

        upload.send((isError, data) => {
            if (isError) {
                console.error('Error uploading %s: %s', key, data);
                // Reset the total on error since S3 doesn't retain partials:
                dispatch(updateBytesUploaded(fullPath, 0));
            } else {
                console.log('Successfully uploaded', key);
                dispatch(updateBytesUploaded(fullPath, size));
                // var elapsedSeconds = (Date.now() - startTime) / 1000;
            }
        });
    }
}
