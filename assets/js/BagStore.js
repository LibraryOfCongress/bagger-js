// @flow
import type {Action, State} from './BagTypes';

import {OrderedMap} from 'immutable';
import {ReduceStore} from 'flux/utils';
import BagFile from './BagFile';

class BagStore extends ReduceStore<State> {
    getInitialState(): State {
        return OrderedMap();
    }

    reduce(state: State, action: Action): State {
        switch (action.type) {
            case 'bag/filesSelected': {
                for (const [path, file] of action.files) {
                    var newBagFile = new BagFile(path, file);
                    state = state.set(newBagFile.path, newBagFile);
                }
                return state;
            }
            case 'bag/fileHashed': {
                return state.setIn([action.path, 'hash'], action.hash);
            }
            default:
                return state;
        }
    }
}

export default BagStore;
