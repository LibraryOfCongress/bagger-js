var React = require('react/addons');

import { Manifest } from '../jsx/manifest.jsx';

class FileRow extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        return (
            <tr>
                <td className="file-name">{this.props.file.fullPath}</td>
                <td className="file-size">{this.props.file.file.size}</td>
                <td className="file-hash sha1" title={this.props.file.hashes.sha1}>{this.props.file.hashes.sha1}</td>
                <td className="file-hash sha256" title={this.props.file.hashes.sha256}>{this.props.file.hashes.sha256}</td>
            </tr>
        );
    }
}

class BagContents extends React.Component {
    constructor(props) {
        super(props);
        this.state = {files: props.files};
    }
    render() {
        var files = this.state.files.map(function (file) {
            return <FileRow file={file} key={file.fullPath} />;
        });

        var manifestSHA1 = null;
        var manifestSHA256 = null;

        if (this.props.bagging) {
            manifestSHA1 = <Manifest files={this.props.files} hashType="sha1" />;
            manifestSHA256 = <Manifest files={this.props.files} hashType="sha256" />;
        }

        return (
            <table id="bag-contents" className="table table-striped">
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
                        <td className="file-size total">{this.props.total}</td>
                        <td>{manifestSHA1}</td>
                        <td>{manifestSHA256}</td>
                    </tr>
                </tfoot>
            </table>
        );
    }
}

export { BagContents };
