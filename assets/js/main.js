import React from 'react'  // eslint-disable-line no-unused-vars
import { render } from 'react-dom'

import {applyMiddleware, bindActionCreators, combineReducers, createStore} from 'redux';

// http://redux.js.org/docs/basics/UsageWithReact.html
import {connect} from 'react-redux';

import thunkMiddleware from 'redux-thunk';
import createLogger from 'redux-logger'

import Bagger from '../jsx/bagger.jsx';
import {bagger, hasher, uploader} from '../js/reducers';
import * as BagActions from '../js/actions';

const loggerMiddleware = createLogger()

const createStoreWithMiddleware = applyMiddleware(thunkMiddleware, loggerMiddleware)(createStore);

const rootReducer = combineReducers({bagger, hasher, uploader});

function configureStore(initialState) {
    return createStoreWithMiddleware(rootReducer, initialState);
}

const store = configureStore();

const ConnectedBagger = connect(state => state)(Bagger)
const actions = bindActionCreators(BagActions, store.dispatch);

render(<ConnectedBagger store={store} actions={actions}/>, document.getElementById('bagger'));

if (typeof DataTransferItemList === 'undefined') {
    document.getElementById('directory-support-warning').removeAttribute('hidden');
}
