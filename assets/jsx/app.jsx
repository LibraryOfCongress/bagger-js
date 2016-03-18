import React from 'react';
import {Provider} from 'react-redux';
import {
    createStore,
    applyMiddleware,
    combineReducers,
    compose
} from 'redux';
import thunkMiddleware from 'redux-thunk';
import createLogger from 'redux-logger'

import {bagger, hasher, uploader} from '../js/reducers';
import Bagger from '../jsx/bagger.jsx';

const loggerMiddleware = createLogger()

let createStoreWithMiddleware;

createStoreWithMiddleware = applyMiddleware(thunkMiddleware, loggerMiddleware)(createStore);

const rootReducer = combineReducers({bagger, hasher, uploader});

function configureStore(initialState) {
    return createStoreWithMiddleware(rootReducer, initialState);
}

const store = configureStore();

export default React.createClass({
    render() {
        return (
            <div>
                <Provider store={store}>
                    <Bagger/>
                </Provider>
            </div>
        );
    }
});
