export type Actions = {
    type: 'hash/bytesHashed',
    path: string,
    bytesHashed: number
} | {
    type: 'hash/statsUpdated',
    hasherStats: any
}
