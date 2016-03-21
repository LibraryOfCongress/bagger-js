import * as ActionTypes from './ActionTypes';

// http://redux.js.org/docs/basics/Reducers.html

export function bagger(state = {
    files: new Map(),
    hashes: new Map(),
    sizes: new Map()
}, action) {
    switch (action.type) {
    case ActionTypes.ADD_FILES: {
        const files = new Map([...state.files, ...action.files])
        const sizes = new Map([...files].map(([fullPath, file]) => ([fullPath, file.size])))
        return {...state,
            files,
            sizes
        };
    }
    case ActionTypes.UPDATE_HASH: {
        return {...state,
            hashes: new Map([...state.hashes]).set(action.fullPath, action.hash)
        }
    }
    default: {
        return state;
    }
    }
}

export function hasher(state = {
    bytesHashed: new Map(),
    hashBytesPerSecond: 0,
    hashThroughput: [],
    hasherStats: {
        totalHashers: 0,
        activeHashers: 0
    }
}, action) {
    switch (action.type) {
    case ActionTypes.UPDATE_BYTES_HASHED: {
        return {...state,
            bytesHashed: new Map([...state.bytesHashed]).set(action.fullPath, action.bytesHashed)
        }
    }
    case ActionTypes.UPDATE_THROUGHPUT: {
        let hashBytesPerSecond = 0
        const now = Date.now() / 1000.0;
        const bytesHashed = [...state.bytesHashed.values()].reduce((r, n) => r + n, 0);
        if (state.hashThroughput.length > 0) {
            const [t0, b0] = state.hashThroughput
            hashBytesPerSecond = (bytesHashed - b0) / (now - t0)
        }
        return {...state,
            hashBytesPerSecond,
            hashThroughput: [now, bytesHashed]
        }
    }
    case ActionTypes.UPDATE_HASHER_STATS: {
        return {...state,
            hasherStats: action.hasherStats
        }
    }
    default: {
        return state;
    }
    }
}

export function uploader(state = {
    accessKeyId: 'Not really',
    secretAccessKey: 'Definitely Not',
    bucket: 'bagger-js-testing',
    region: 'us-east-1',
    keyPrefix: 'my-test-bag',
    configStatus: {
        className: 'btn btn-default',
        message: 'Untested'
    },
    bytesUploaded: new Map(),
    uploadThroughput: [],
    uploadBytesPerSecond: 0
}, action) {
    switch (action.type) {
    case ActionTypes.CONFIG_STATUS: {
        return {...state,
            configStatus: action.status
        };
    }
    case ActionTypes.UPDATE_CONFIG: {
        return {...state,
            accessKeyId: action.accessKeyId,
            secretAccessKey: action.secretAccessKey,
            bucket: action.bucket,
            region: action.region,
            keyPrefix: action.keyPrefix
        };
    }
    case ActionTypes.UPDATE_BYTES_UPLOADED: {
        return {...state,
            bytesUploaded: new Map([...state.bytesUploaded]).set(action.fullPath, action.bytesUploaded)
        }
    }
    case ActionTypes.UPDATE_THROUGHPUT: {
        let uploadBytesPerSecond = 0
        const now = Date.now() / 1000.0;
        const bytesUploaded = [...state.bytesUploaded.values()].reduce((r, n) => r + n, 0);
        if (state.uploadThroughput.length > 0) {
            const [t0, b0] = state.uploadThroughput
            uploadBytesPerSecond = (bytesUploaded - b0) / (now - t0)
        }
        return {...state,
            uploadBytesPerSecond,
            uploadThroughput: [now, bytesUploaded]
        }
    }
    default: {
        return state;
    }
    }
}
