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
        var total = 0;
        var hashTypes = ['sha1', 'sha256'];
        var manifest = {'sha1': [], 'sha256': []};
        var href = {'sha1': null, 'sha256': null};
        var files = this.state.files.map(function (file) {
            total += file.file.size;
            hashTypes.forEach(function (hashType) {
                var hash = file.hashes[hashType];
                manifest[hashType].push([hash, file.fullPath].join('\t'));
            });
            return <FileRow file={file} key={file.fullPath} />;
        });
        hashTypes.forEach(function (hashType) {
            href[hashType] = 'data:text/plain,' + encodeURIComponent(manifest[hashType].join('\n'));
        });

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
                        <td className="file-size total">{total}</td>
                        <td><a id="manifest-sha1" href={href.sha1} target="_blank" download="manifest-sha1.txt">manifest-sha1</a></td>
                        <td><a id="manifest-sha256" href={href.sha256} target="_blank" download="manifest-sha256.txt">manifest-sha256</a></td>
                    </tr>
                </tfoot>
            </table>
        );
    }
}

export { BagContents };
