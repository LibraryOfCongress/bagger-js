// @flow
import Immutable from 'immutable';

export type Action = {
    type: 'hash/bytesHashed',
    path: string,
    bytesHashed: number
} | {
    type: 'hash/statsUpdated',
    hasherStats: any
}

export type State = Immutable.Map<string, number>
