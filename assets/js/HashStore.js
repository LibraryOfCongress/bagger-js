// @flow

import {ReduceStore} from 'flux/utils';

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

export default HashStore;
