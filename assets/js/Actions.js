// @flow

export type Action = {
    type: 'bag/filesSelected',
    files: Map <string, File> ,
} | {
    type: 'bag/fileHashed',
    path: string,
    hash: string,
} | {
    type: 'hash/bytesHashed',
    path: string,
    bytesHashed: number
} | {
    type: 'hash/statsUpdated',
    hasherStats: any
} | {
    type: 'upload/bytesUploaded',
    path: string,
    bytesUploaded: number
} | {
    type: 'upload/statusChanged',
    status: string,
    message: string
} | {
    type: 'upload/configurationUpdated',
    accessKeyId: string,
    secretAccessKey: string,
    bucket: string,
    region: string,
    keyPrefix: string,
};
