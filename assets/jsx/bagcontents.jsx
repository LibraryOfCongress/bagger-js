var React = require('react/addons');

class FileRow extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        return (
            <tr>
                <td className="file-name">{this.props.name}</td>
                <td className="file-size">{this.props.size}</td>
                <td className="file-hash sha1">{this.props.hashes.sha1}</td>
                <td className="file-hash sha256">{this.props.hashes.sha256}</td>
            </tr>
        );
    }
}

class BagContents extends React.Component {
    constructor(props) {
        super(props);
        this.state = {files: props.files, hashes: props.hashes};
    }
    render() {
        var hashes = this.state.hashes;
        var files = this.state.files.map(function (file) {
            var fileHashes = hashes[file.fullPath];
            if (fileHashes === undefined) {
                fileHashes = {};
            }
            return <FileRow key={file.fullPath} name={file.fullPath} size={file.size} hashes={fileHashes} />;
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
