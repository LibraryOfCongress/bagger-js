// @flow

import {ReduceStore} from 'flux/utils';
import type {Action, State} from './HashTypes';
import {OrderedMap} from 'immutable';

class HashStore extends ReduceStore<State> {
    getInitialState(): State {
        return new OrderedMap();
    }

    reduce(state: State, action: Action): State {
        switch (action.type) {
            case 'hash/bytesHashed':
                return state.set(action.path, action.bytesHashed);
            default:
                return state;
        }
    }
}

export default HashStore;
