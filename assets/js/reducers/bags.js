import * as ActionTypes from '../constants/ActionTypes';

export default function (state = {
    files: new Map(),
    hashes: new Map(),
    sizes: new Map(),
    accessKeyId: 'Not really',
    secretAccessKey: 'Definitely Not',
    bucket: 'bagger-js-testing',
    region: 'us-east-1',
    keyPrefix: 'my-test-bag',
    configStatus: {
        className: 'btn btn-default',
        message: 'Untested'
    },
    pool: null
}, action) {
    switch (action.type) {
    case ActionTypes.ADD_FILES:
        return {...state,
            files: new Map([...state.files, ...action.files])
        };
    case ActionTypes.CONFIG_STATUS:
        return {...state,
                configStatus: action.status
        };
    case ActionTypes.CONFIG_UPDATE:
        return {...state,
                accessKeyId: action.accessKeyId,
                secretAccessKey: action.secretAccessKey,
                bucket: action.bucket,
                region: action.region,
                keyPrefix: action.keyPrefix
        };
    case ActionTypes.UPDATE_FILE_INFO:
        return {...state,
            hashes: new Map([...state.hashes]).set(action.fullPath, action.hashes),
            sizes: new Map([...state.sizes]).set(action.fullPath, action.size)
        }
    case ActionTypes.UPDATE_BYTES_UPLOADED:
        return {...state,
            bytesUploaded: new Map([...state.bytesUploaded]).set(action.fullPath, action.bytesUploaded)
        }
    case ActionTypes.SET_HASH_WORKERPOOL:
        return {...state,
            pool: action.pool
        }
    default:
        return state;
    }
}
