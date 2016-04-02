// @flow

import {ReduceStore} from 'flux/utils';
import Dispatcher from './Dispatcher';
import Immutable from 'immutable';

import type {Action} from './Actions';

type State = Immutable.OrderedMap<string, number>;

class HashStore extends ReduceStore<State> {

    getInitialState(): State {
        return Immutable.OrderedMap();
    }

    reduce (state: State, action: Action): State {
        switch (action.type) {
            case 'hash/bytesHashed':
                return state.set(action.path, action.bytesHashed)
            default:
                return state;
        }
    }

}

// Export a singleton instance of the store, could do this some other way if
// you want to avoid singletons.
const instance = new HashStore(Dispatcher);
export default instance;
