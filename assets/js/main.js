/* jslint browser: true, indent: 4 */
/* global require */

var React = require('react');
var ReactDOM = require('react-dom');

import { Bagger } from '../jsx/bagger.jsx';

ReactDOM.render(React.createElement(Bagger, null), document.getElementById('bagger'));

if (typeof DataTransferItemList === 'undefined') {
    document.getElementById('directory-support-warning').removeAttribute('hidden');
}

