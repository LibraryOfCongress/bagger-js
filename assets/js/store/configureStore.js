import {
    createStore,
    applyMiddleware,
    combineReducers,
    compose
} from 'redux';
import thunkMiddleware from 'redux-thunk';
import createLogger from 'redux-logger'
import * as reducers from '../reducers/index';

const loggerMiddleware = createLogger()

let createStoreWithMiddleware;

createStoreWithMiddleware = applyMiddleware(thunkMiddleware, loggerMiddleware)(createStore);

const rootReducer = combineReducers(reducers);

export default function configureStore(initialState) {
    return createStoreWithMiddleware(rootReducer, initialState);
}
