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

import {bag} from '../js/reducers';
import Bagger from '../jsx/bagger.jsx';

const loggerMiddleware = createLogger()

let createStoreWithMiddleware;

createStoreWithMiddleware = applyMiddleware(thunkMiddleware, loggerMiddleware)(createStore);

const rootReducer = combineReducers({bag});

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
