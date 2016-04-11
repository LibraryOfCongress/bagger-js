// @flow
import type {Action} from './HashTypes'

import WorkerPool from '../js/worker-pool';

export function hashFileAction(dispatch: (action: Action) => void): (path: string, file: File) => Promise {
    const hasher = new WorkerPool('hash-worker.js', 4,
        (path, bytesHashed) => dispatch({ type: 'hash/bytesHashed', path, bytesHashed }),
        (hasherStats) => dispatch({ type: 'hash/statsUpdated', hasherStats })
    )
    return (path, file) => hasher.hash({ fullPath: path, file })
}
