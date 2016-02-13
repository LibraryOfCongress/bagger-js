/* jslint browser: true, indent: 4 */
/* global require */

var React = require('react');
var ReactDOM = require('react-dom');

import App from '../jsx/app.jsx';

import {
    Bagger
}
from '../jsx/bagger.jsx'

ReactDOM.render(React.createElement(App, null), document.getElementById('bagger'));

if (typeof DataTransferItemList === 'undefined') {
    document.getElementById('directory-support-warning').removeAttribute('hidden');
}
