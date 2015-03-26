/* jslint browser: true, indent: 4 */
/* global require */

var React = require('react');

import { Bagger } from '../jsx/bagger.jsx';

React.render(React.createElement(Bagger, null), document.getElementById('bagger'));
