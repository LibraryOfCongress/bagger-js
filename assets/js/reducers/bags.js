import * as ActionTypes from '../constants/ActionTypes';

export default function (state = {
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
    configStatus: {
        className: 'btn btn-default',
        message: 'Untested'
    }
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
    case ActionTypes.UPDATE_BYTES_HASHED:
        return {...state,
            bytesHashed: new Map([...state.bytesHashed]).set(action.fullPath, action.bytesHashed)
        }
    case ActionTypes.UPDATE_BYTES_UPLOADED:
        return {...state,
            bytesUploaded: new Map([...state.bytesUploaded]).set(action.fullPath, action.bytesUploaded)
    }

    default:
        return state;
    }
}
