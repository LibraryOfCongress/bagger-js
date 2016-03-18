import * as ActionTypes from './ActionTypes';

export function bag(state = {
    files: new Map(),
    hashes: new Map(),
    sizes: new Map(),
    bytesUploaded: new Map(),
    bytesHashed: new Map(),
    accessKeyId: 'Not really',
    secretAccessKey: 'Definitely Not',
    bucket: 'bagger-js-testing',
    region: 'us-east-1',
    keyPrefix: 'my-test-bag',
    hasherStats: {
        totalHashers: 0,
        activeHashers: 0
    },
    configStatus: {
        className: 'btn btn-default',
        message: 'Untested'
    },
    hashThroughput: [],
    uploadThroughput: [],
    hashBytesPerSecond: 0,
    uploadBytesPerSecond: 0
}, action) {
    switch (action.type) {
    case ActionTypes.ADD_FILES:
        const files = new Map([...state.files, ...action.files])
        const sizes = new Map([...files].map(([fullPath, file]) => ([fullPath, file.size])))
        return {...state,
            files,
            sizes
        };
    case ActionTypes.CONFIG_STATUS:
        return {...state,
                configStatus: action.status
        };
    case ActionTypes.UPDATE_CONFIG:
        return {...state,
                accessKeyId: action.accessKeyId,
                secretAccessKey: action.secretAccessKey,
                bucket: action.bucket,
                region: action.region,
                keyPrefix: action.keyPrefix
        };
    case ActionTypes.UPDATE_HASH:
        return {...state,
            hashes: new Map([...state.hashes]).set(action.fullPath, action.hash)
        }
    case ActionTypes.UPDATE_HASHER_STATS:
        return {...state,
            hasherStats: action.hasherStats
        }
    case ActionTypes.UPDATE_BYTES_HASHED:
        return {...state,
            bytesHashed: new Map([...state.bytesHashed]).set(action.fullPath, action.bytesHashed)
        }
    case ActionTypes.UPDATE_BYTES_UPLOADED:
        return {...state,
            bytesUploaded: new Map([...state.bytesUploaded]).set(action.fullPath, action.bytesUploaded)
    }
    case ActionTypes.UPDATE_THROUGHPUT:
        let newState = state;
        let hashBytesPerSecond = 0
        let uploadBytesPerSecond = 0
        const now = Date.now() / 1000.0;
        const bytesHashed = [...state.bytesHashed.values()].reduce((r, n) => r + n, 0);
        const bytesUploaded = [...state.bytesUploaded.values()].reduce((r, n) => r + n, 0);
        if (state.hashThroughput.length > 0) {
            const [t0, b0] = state.hashThroughput
            hashBytesPerSecond = (bytesHashed - b0) / (now - t0)
        }
        if (state.uploadThroughput.length > 0) {
            const [t0, b0] = state.uploadThroughput
            uploadBytesPerSecond = (bytesUploaded - b0) / (now - t0)
        }
        return {...state, hashBytesPerSecond, uploadBytesPerSecond, hashThroughput: [now, bytesHashed], uploadThroughput: [now, bytesUploaded]}
    default:
        return state;
    }
}
