var React = require('react/addons'),
    filesize = require('filesize');

import { Manifest } from '../jsx/manifest.jsx';

class FileRow extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        var fileSize = this.props.file.size ? filesize(this.props.file.size) : '?';

        return (
            <tr>
                <td className="file-name">{this.props.file.fullPath}</td>
                <td className="file-size">{fileSize}</td>
                <td className="file-hash sha1" title={this.props.file.hashes.sha1}>{this.props.file.hashes.sha1}</td>
                <td className="file-hash sha256" title={this.props.file.hashes.sha256}>{this.props.file.hashes.sha256}</td>
            </tr>
        );
    }
}

class BagContents extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            collapsed: true
        };
    }

    render() {
        if (this.props.files.length < 1) {
            return null;
        }

        var files = this.props.files.map(function (file) {
            return <FileRow file={file} key={file.fullPath} />;
        });

        var manifestSHA1 = null;
        var manifestSHA256 = null;

        if (this.props.hashing) {
            manifestSHA1 = <Manifest files={this.props.files} hashType="sha1" />;
            manifestSHA256 = <Manifest files={this.props.files} hashType="sha256" />;
        }

        var inProgress = this.props.hashing;

        var bagContentsTable = null;

        if (!this.state.collapsed) {
            bagContentsTable = (
                <table className="table table-striped">
                    <caption>Current Contents</caption>
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
                            <td className="file-size total">{filesize(this.props.total)}</td>
                            <td>{manifestSHA1}</td>
                            <td>{manifestSHA256}</td>
                        </tr>
                    </tfoot>
                </table>
            );
        }

        return (
            <div id="bag-contents" className="well well-sm">
                <div className="pull-right">
                    <button className="btn btn-info btn-lg" onClick={this.toggleCollapse.bind(this)}>
                        {this.state.collapsed ? 'Show' : 'Hide'} File List
                    </button>
                </div>

                <h2>
                    Contents <small>{this.props.files.length.toLocaleString()} files
                                    ({inProgress ? 'at least ': ''}{filesize(this.props.total, {round: 0})})</small>
                </h2>

                {bagContentsTable}
            </div>
        );
    }

    toggleCollapse(evt) {
        evt.preventDefault();
        this.setState({collapsed: !this.state.collapsed});
    }
}

export { BagContents };
