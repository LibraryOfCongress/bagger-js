// @flow
import WorkerPool from './worker-pool';

import { dispatch } from './Dispatcher';

import UploadStore from '../js/UploadStore';

import * as AWS from 'aws-sdk'; // TODO: remove use of *

const hasher = new WorkerPool('hash-worker.js', 4,
    (path, bytesHashed) => dispatch({ type: 'hash/bytesHashed', path, bytesHashed }),
    (hasherStats) => dispatch({ type: 'hash/statsUpdated', hasherStats })
);

export function filesSelected(files: Map<string, File>): void {
    dispatch({ type: 'bag/filesSelected', files })

    const {bucket, keyPrefix} = UploadStore.getState()

    Promise.all(
        // $FlowIssue - https://github.com/facebook/flow/issues/1059
        [...files].map(
            ([fullPath, file]) => hasher.hash({ fullPath, file })
            .then((result) => {
                dispatch({ type: 'bag/fileHashed', path: result.fullPath, hash: result.sha256 })
                upload(fullPath, file, file.size, file.type, bucket, keyPrefix)
            }).catch(function(error) {
                throw error
            })
        )
    );
}

function configureAWS(accessKeyId, secretAccessKey, region) {
    AWS.config.update({ accessKeyId, secretAccessKey, region });
}

function getS3Client(accessKeyId, secretAccessKey, region) {
    configureAWS(accessKeyId, secretAccessKey, region);
    return new AWS.S3();
}

export function configurationUpdated(accessKeyId:string, secretAccessKey:string,
                                     bucket:string, region:string, keyPrefix:string) {
    dispatch({type: 'upload/configurationUpdated', accessKeyId, secretAccessKey, bucket, region, keyPrefix});
}
export function testConfiguration(
    accessKeyId:string, secretAccessKey:string, bucket:string, region:string) {
    // We'd like to be able to list buckets but that's impossible due to Amazon's CORS constraints:
    // https://forums.aws.amazon.com/thread.jspa?threadID=179355&tstart=0

    if (accessKeyId && secretAccessKey && region) {
        var s3 = getS3Client(accessKeyId, secretAccessKey, region);

        dispatch({type: 'upload/statusChanged', status: 'testing', message: 'Waiting…'});

        s3.getBucketCors({
            Bucket: bucket
        }, (isError, data) => {
            if (isError) {
                var errMessage = 'ERROR';

                if (data) {
                    errMessage += ' (' + data + ')';
                }
                dispatch({type: 'upload/statusChanged', status: 'Unsuccessful', message: errMessage});
            } else {
                dispatch({type: 'upload/statusChanged', status: 'Successful', message: 'OK'});
            }
        });
    } else {
        dispatch({type: 'upload/statusChanged', status: 'Untested', message: 'Untested'});
    }
}

export function upload(path:string, body:File, size:number, type:string, bucket:string, keyPrefix:string) {
    var key = keyPrefix + '/data/' + path;
    key = key.replace('//', '/');

    // We reset this to zero every time so our cumulative stats will be correct
    // after failures or retries:
    dispatch({type: 'upload/bytesUploaded', path, bytesUploaded: 0});

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
        dispatch({type: 'upload/bytesUploaded', path, bytesUploaded: progressEvent.loaded});
    });

    upload.send((isError) => {
        if (isError) {
            // TODO: handle error
            // Reset the total on error since S3 doesn't retain partials:
            dispatch({type: 'upload/bytesUploaded', path, bytesUploaded: 0});
        } else {
            dispatch({type: 'upload/bytesUploaded', path, bytesUploaded: size});
        }
    });
}
