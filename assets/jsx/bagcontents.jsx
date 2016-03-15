import React from 'react'
import filesize from 'filesize'

import Manifest from '../jsx/manifest.jsx';

class BagContents extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            collapsed: true
        };
    }

    render() {
        if (this.props.files.size < 1) {
            return null;
        }

        var sizes = this.props.sizes;
        var hashes = this.props.hashes;
        var files = this.props.files.keySeq().map(function(path) {
            var fileSize = '?';
            if (sizes.has(path)) {
                fileSize = filesize(sizes.get(path));
            }
            var h = hashes.get(path, new Map());
            var sha1 = h.get('sha1');
            var sha256 = h.get('sha256');
            return (
                <tr key={path}>
                    <td className="file-name">
                        {path}
                    </td>
                    <td className="file-size">
                        {fileSize}
                    </td>
                    <td className="file-hash sha1" title={sha1}>
                        {sha1}
                    </td>
                    <td className="file-hash sha256" title={sha256}>
                        {sha256}
                    </td>

                </tr>
            );
        });

        var total = this.props.sizes.valueSeq().reduce((r, n) => r + n, 0);

        // FIXME: Bag Info UI — https://github.com/LibraryOfCongress/bagger-js/issues/13
        var bagInfo = 'Bag-Size: ' + filesize(total, {round: 0});

        bagInfo += '\nPayload-Oxum: ' + total + '.' + this.props.files.length + '\n';

        var bagContentsTable = null;

        if (!this.state.collapsed) {
            var manifestSHA1 = null;
            var manifestSHA256 = null;
            if (this.props.files.size === this.props.hashes.size) {
                manifestSHA1 = <Manifest hashes={this.props.hashes} hashType="sha1"/>;
                manifestSHA256 = <Manifest hashes={this.props.hashes} hashType="sha256"/>;
            }
            bagContentsTable = (
                <table className="table table-striped">
                    <caption>
                        Current Contents
                    </caption>
                    <thead>
                        <tr>
                            <th className="file-name">Filename</th>
                            <th className="file-size">Size</th>
                            <th className="file-hash sha1">SHA-1</th>
                            <th className="file-hash sha256">SHA-256</th>
                        </tr>
                    </thead>
                    <tbody>
                        {files}
                    </tbody>
                    <tfoot>
                        <tr>
                            <th>Totals:</th>
                            <td className="file-size total">
                                {filesize(total)}
                            </td>
                            <td>
                                {manifestSHA1}
                            </td>
                            <td>
                                {manifestSHA256}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            );
        }

        return (
            <div id="bag-contents" className="well well-sm">
                <div className="pull-right">
                    <button className="btn btn-info btn-lg" onClick={this.toggleCollapse.bind(this)}>
                        {this.state.collapsed
                            ? 'Show'
                            : 'Hide'}
                        File List
                    </button>
                </div>
                <h2>
                    Contents
                    <small>
                        {this.props.files.size.toLocaleString()}
                        files ({this.props.files.size > this.props.sizes.size
                            ? 'at least '
                            : ''}{filesize(total, {round: 0})})
                    </small>
                </h2>
                <pre>{bagInfo}</pre>
                {bagContentsTable}
            </div>
        );
    }

    toggleCollapse(evt) {
        evt.preventDefault();
        this.setState({
            collapsed: !this.state.collapsed
        });
    }
}

export default BagContents;
