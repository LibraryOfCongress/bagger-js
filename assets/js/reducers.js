import * as ActionTypes from './ActionTypes';

// http://redux.js.org/docs/basics/Reducers.html

export function bagger(state = {
    files: new Map(),
    hashes: new Map(),
    sizes: new Map()
}, action) {
    switch (action.type) {
        case ActionTypes.UPDATE_FILES:
            {
                const files = new Map([...state.files, ...action.files])
                const sizes = new Map([...files].map(([fullPath, file]) => ([fullPath, file.size])))
                return {...state,
                    files,
                    sizes
                };
            }
        case ActionTypes.UPDATE_HASH:
            {
                return {...state,
                    hashes: new Map([...state.hashes]).set(action.fullPath, action.hash)
                }
            }
        default:
            {
                return state;
            }
    }
}

export function hasher(state = {
    hasher: undefined,
    bytesHashed: new Map(),
    hasherStats: {
        totalHashers: 0,
        activeHashers: 0
    }
}, action) {
    switch (action.type) {
        case ActionTypes.UPDATE_HASHER:
            return {...state, hasher: action.hasher}
        case ActionTypes.UPDATE_BYTES_HASHED:
            {
                return {...state,
                    bytesHashed: new Map([...state.bytesHashed]).set(action.fullPath, action.bytesHashed)
                }
            }
        case ActionTypes.UPDATE_HASHER_STATS:
            {
                return {...state,
                    hasherStats: action.hasherStats
                }
            }
        default:
            {
                return state;
            }
    }
}

export function uploader(state = {
    accessKeyId: '',
    secretAccessKey: '',
    bucket: '',
    region: '',
    keyPrefix: '',
    configStatus: {
        className: 'btn btn-default',
        message: 'Untested'
    },
    sizes: new Map(),
    bytesUploaded: new Map()
}, action) {
    switch (action.type) {
        case ActionTypes.CONFIG_STATUS:
            {
                return {...state,
                    configStatus: action.status
                };
            }
        case ActionTypes.UPDATE_CONFIG:
            {
                return {...state,
                    accessKeyId: action.accessKeyId,
                    secretAccessKey: action.secretAccessKey,
                    bucket: action.bucket,
                    region: action.region,
                    keyPrefix: action.keyPrefix
                };
            }
        case ActionTypes.UPDATE_FILES:
            {
                const newSizes = new Map([...action.files].map(([fullPath, file]) => ([fullPath, file.size])))
                const sizes = new Map([...state.sizes, ...newSizes])
                return {...state,
                    sizes
                };
            }
        case ActionTypes.UPDATE_BYTES_UPLOADED:
            {
                return {...state,
                    bytesUploaded: new Map([...state.bytesUploaded])
                        .set(action.fullPath, action.bytesUploaded)
                }
            }
        default:
            {
                return state;
            }
    }
}
