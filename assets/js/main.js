import React from 'react'
import { render } from 'react-dom'

import App from '../jsx/app.jsx';

render(React.createElement(App, null), document.getElementById('bagger'));

if (typeof DataTransferItemList === 'undefined') {
    document.getElementById('directory-support-warning').removeAttribute('hidden');
}
