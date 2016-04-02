// @flow

import { ReduceStore } from 'flux/utils';
import Dispatcher from './Dispatcher';
import Immutable from 'immutable';

import type { Action } from './Actions';

export type State = {
    bytesUploaded: Immutable.OrderedMap <string, number>,
    accessKeyId: string,
    secretAccessKey: string,
    bucket: string,
    region: string,
    keyPrefix: string,
    status: string, // TODO: 'Untested' | 'Untested' | 'Successful' | 'Unsuccessful',
    message: string
}

class UploadStore extends ReduceStore <State> {

    getInitialState(): State {
        return {
            bytesUploaded: Immutable.OrderedMap(),
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

// Export a singleton instance of the store, could do this some other way if
// you want to avoid singletons.
const instance = new UploadStore(Dispatcher);
export default instance;
