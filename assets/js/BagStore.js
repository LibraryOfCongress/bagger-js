// @flow

import type {Action} from './Actions';

import Immutable from 'immutable';
import {ReduceStore} from 'flux/utils';
import BagFile from './BagFile';
import Dispatcher from './Dispatcher';

type State = Immutable.OrderedMap<string, BagFile>;

class BagStore extends ReduceStore<State> {

    getInitialState(): State {
        return Immutable.OrderedMap();
    }

    reduce (state: State, action: Action): State {
        switch (action.type) {
            case 'bag/filesSelected':
                {
                    for (const [path, file] of action.files) {
                        var newBagFile = new BagFile(path, file);
                        state = state.set(newBagFile.path, newBagFile)
                    }
                    return state
                }
            case 'bag/fileHashed':
                {
                    return state.setIn([action.path, 'hash'], action.hash)
                }
            default:
                return state;
        }
    }

}

// Export a singleton instance of the store, could do this some other way if
// you want to avoid singletons.
const instance = new BagStore(Dispatcher);
export default instance;
