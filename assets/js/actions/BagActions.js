import {
    ADD_FILES,
    CONFIG_STATUS,
    CONFIG_UPDATE,
    UPDATE_FILE_INFO,
    UPDATE_BYTES_UPLOADED
} from '../constants/ActionTypes';

import {
    hash
} from '../worker-pool.js';

import * as AWS from 'aws-sdk';

export function addFiles(files) {
    return {
        type: ADD_FILES,
        files
    }
}

export function updateFileInfo(fullPath, size, hashes) {
    return {
        type: UPDATE_FILE_INFO,
        fullPath,
        size,
        hashes
    }
}

export function updateBytesUploaded(fullPath, bytesUploaded) {
    return {
        type: UPDATE_BYTES_UPLOADED,
        fullPath,
        bytesUploaded
    }
}

export function configStatus(status) {
    return {
        type: CONFIG_STATUS,
        status
    }
}

export function configUpdate(accessKeyId, secretAccessKey, bucket, region, keyPrefix) {
    return {
        type: CONFIG_UPDATE,
        accessKeyId,
        secretAccessKey,
        bucket,
        region,
        keyPrefix
    }
}

export function updateAndTestConfiguration(accessKeyId, secretAccessKey, bucket, region, keyPrefix) {
    return dispatch => {
        dispatch(configUpdate(accessKeyId, secretAccessKey, bucket, region, keyPrefix))
        dispatch(testConfiguration())
    }
}

export function addFilesAndHash(files) {
    return (dispatch, getState) => {
        dispatch(addFiles(files));
        return Promise.all([...files].map(([fullPath, file]) => hash({
            file,
            fullPath,
            'action': 'hash'
        })
        .then(result => {
            dispatch(updateFileInfo(fullPath, file.size, new Map([
            ['sha256', result.data.sha256]
            ])))
            dispatch(upload(fullPath, file, file.size, file.type))
        })
        .catch(function (error) {
            console.log('Failed!', error);
        })));
    }
}

function configureAWS(state) {
    AWS.config.update({
        accessKeyId: state.accessKeyId,
        secretAccessKey: state.secretAccessKey,
        region: state.region
    });
}

function getS3Client(state) {
    configureAWS(state);
    return new AWS.S3();
}

export function testConfiguration() {
    return (dispatch, getState) => {
        const state = getState().Bag;
            // We'd like to be able to list buckets but that's impossible due to Amazon's CORS constraints:
            // https://forums.aws.amazon.com/thread.jspa?threadID=179355&tstart=0

        if (state.accessKeyId && state.secretAccessKey && state.region) {
            var s3 = getS3Client(state);

            dispatch(configStatus({
                className: 'btn btn-info',
                message: 'Waiting…'
            }));

            s3.getBucketCors({
                Bucket: state.bucket
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

export function upload(fullPath, file, size, type) {
    return (dispatch, getState) => {
        const state = getState().Bag;
        var key = state.keyPrefix + '/data/' + fullPath;
        key = key.replace('//', '/');

        // We reset this to zero every time so our cumulative stats will be correct
        // after failures or retries:
        dispatch(updateBytesUploaded(fullPath, 0));

        var startTime = Date.now();
        var body = file;

        var size = typeof body.size !== 'undefined' ? body.size : body.length;

        console.log('Uploading %s to %s (%i bytes)', key, state.bucket, size);

        //this.configureAWS();

        // TODO: set ContentMD5
        // TODO: use leavePartsOnError to allow retries?
        // TODO: make partSize and queueSize configurable
        var upload = new AWS.S3.ManagedUpload({
            maxRetries: 6,
            partSize: 8 * 1024 * 1024,
            queueSize: 4,
            params: {
                Bucket: state.bucket,
                Key: key,
                Body: body,
                ContentType: type
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
