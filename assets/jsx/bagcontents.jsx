var React = require('react/addons');

class FileRow extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        return (
            <tr>
                <td className="file-name">{this.props.file.fullPath}</td>
                <td className="file-size">{this.props.file.file.size}</td>
                <td className="file-hash sha1">{this.props.file.hashes.sha1}</td>
                <td className="file-hash sha256">{this.props.file.hashes.sha256}</td>
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

        return (
            <table id="bag-contents" className="table table-striped">
                <caption>Current Contents</caption>
                <thead>
                    <tr>
                        <th className="file-name">Filename</th>
                        <th className="file-size">Size</th>
                        <th className="file-hash">SHA-1</th>
                        <th className="file-hash">SHA-256</th>
                    </tr>
                </thead>
                <tbody>
                {files}
                </tbody>
                <tfoot>
                    <tr>
                        <th>Totals:</th>
                        <td className="file-size total"></td>
                        <td><a id="manifest-sha1" download="manifest-sha1.txt">manifest-sha1</a></td>
                        <td><a id="manifest-sha256" download="manifest-sha256.txt">manifest-sha256</a></td>
                    </tr>
                </tfoot>
            </table>
        );
    }
}

export { BagContents };
