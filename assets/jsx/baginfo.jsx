import React from 'react'
import filesize from 'filesize'

class BagInfo extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        var total = this.props.sizes.valueSeq().reduce((r, n) => r + n, 0)

        // FIXME: Bag Info UI — https://github.com/LibraryOfCongress/bagger-js/issues/13
        var bagInfo = 'Bag-Size: ' + filesize(total, {round: 0});

        bagInfo += '\nPayload-Oxum: ' + total + '.' + this.props.files.length + '\n';

        return (
            <pre>{bagInfo}</pre>
        );
    }
}

export default BagInfo;
