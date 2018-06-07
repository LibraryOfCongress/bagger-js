import React from 'react';
import {render} from 'react-dom';

import Bagger from '../jsx/bagger.jsx';

render(<Bagger />, document.getElementById('bagger'));

if (typeof DataTransferItemList === 'undefined') {
    document
        .getElementById('directory-support-warning')
        .removeAttribute('hidden');
}
