// @flow
import type {State, Dispatch} from './UploadTypes'

import AWS from 'aws-sdk';

function configureAWS(accessKeyId, secretAccessKey, region) {
    AWS.config.update({ accessKeyId, secretAccessKey, region });
}

function getS3Client(accessKeyId, secretAccessKey, region) {
    configureAWS(accessKeyId, secretAccessKey, region);
    return new AWS.S3();
}

export function testConfigurationAction(dispatch: Dispatch, getState: () => State): () => void {
    return () => {
        const {accessKeyId, secretAccessKey, region, bucket} = getState()
        if (accessKeyId && secretAccessKey && region) {
            var s3 = getS3Client(accessKeyId, secretAccessKey, region);

            dispatch({ type: 'upload/statusChanged', status: 'testing', message: 'Waiting…' });

            s3.getBucketCors({
                Bucket: bucket
            }, (isError, data) => {
                if (isError) {
                    var errMessage = 'ERROR';
                    if (data) {
                        errMessage += ' (' + data + ')';
                    }
                    dispatch({ type: 'upload/statusChanged', status: 'Unsuccessful',
                            message: errMessage });
                } else {
                    dispatch({ type: 'upload/statusChanged', status: 'Successful', message: 'OK' });
                }
            });
        } else {
            dispatch({ type: 'upload/statusChanged', status: 'Untested', message: 'Untested' });
        }
    }
}

export function configurationUpdatedAction(dispatch: Dispatch):
    (accessKeyId: string, secretAccessKey: string,
     bucket: string, region: string, keyPrefix: string) => void {
    return (accessKeyId, secretAccessKey, bucket, region, keyPrefix) => {
        dispatch({
            type: 'upload/configurationUpdated',
            accessKeyId,
            secretAccessKey,
            bucket,
            region,
            keyPrefix
        });
    }
}

export function uploadAction(dispatch: Dispatch, getState: () => State):
    (path: string, body: File, size: number, type: string) => void {
    return (path, body, size, type) => {
        const {bucket, keyPrefix} = getState()
        var key = keyPrefix + '/data/' + path;
        key = key.replace('//', '/');

        // We reset this to zero every time so our cumulative stats will be correct
        // after failures or retries:
        dispatch({ type: 'upload/bytesUploaded', path, bytesUploaded: 0 });

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
                Contenttype: type
            }
        });

        upload.on('httpUploadProgress', (progressEvent) => {
            // Progress should update the status bar after each chunk for visible feedback
            // on large files:
            dispatch({ type: 'upload/bytesUploaded', path, bytesUploaded: progressEvent.loaded });
        });

        upload.send((isError) => {
            if (isError) {
                // TODO: handle error
                // Reset the total on error since S3 doesn't retain partials:
                dispatch({ type: 'upload/bytesUploaded', path, bytesUploaded: 0 });
            } else {
                dispatch({ type: 'upload/bytesUploaded', path, bytesUploaded: size });
            }
        });
    }
}
