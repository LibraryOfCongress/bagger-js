import React from 'react';
import {Provider} from 'react-redux';
import configureStore from '../js/store/configureStore';
import Bagger from '../jsx/bagger.jsx';

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
