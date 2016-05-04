// @flow

import { ReduceStore } from 'flux/utils';
import type {Action, State} from './UploadTypes'
import {Map} from 'immutable';

class UploadStore extends ReduceStore <State> {

    getInitialState(): State {
        return {
            bytesUploaded: Map(),
            accessKeyId: '',
            secretAccessKey: '',
            bucket: '',
            region: '',
            keyPrefix: '',
            status: 'Untested',
            message: ''
        }
    }

    reduce(state: State, action: Action): State {
        switch (action.type) {
            case 'upload/bytesUploaded':
                {
                    const bytesUploaded = state.bytesUploaded.set(action.path, action.bytesUploaded)
                    return {...state, bytesUploaded }
                }
            case 'upload/statusChanged':
                {
                    return {...state, status: action.status, message: action.message}
                }
            case 'upload/configurationUpdated':
                {
                    return {...state,
                        accessKeyId: action.accessKeyId,
                        secretAccessKey: action.secretAccessKey,
                        bucket: action.bucket,
                        region: action.region,
                        keyPrefix: action.keyPrefix
                    };
                }
            default:
                return state;
        }
    }

}

export default UploadStore;
