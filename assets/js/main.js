/* global DataTransferItemList */
// @flow
import React from 'react' // eslint-disable-line no-unused-vars
import {render} from 'react-dom'

import Bagger from '../jsx/bagger.jsx';

render(<Bagger />, document.getElementById('bagger'));

if (typeof DataTransferItemList === 'undefined') {
    document.getElementById('directory-support-warning').removeAttribute('hidden');
}
