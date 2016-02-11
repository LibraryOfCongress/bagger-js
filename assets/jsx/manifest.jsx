var React = require('react');

class Manifest extends React.Component {

    constructor(props) {
        super(props);
    }

    generateManifest(evt) {
        var manifest = [];
        var hashType = this.props.hashType;

        this.props.files.map(function (file) {
            var hash = file.hashes[hashType];
            manifest.push([hash, file.fullPath].join('\t'));
        });

        var href = 'data:text/plain,' + encodeURIComponent(manifest.join('\n'));
        evt.target.href = href;
    }

    render() {
        var filename = 'manifest-' + this.props.hashType;

        return (
            <a onClick={this.generateManifest.bind(this)} target="_blank" download={filename}>{filename}</a>
        );
    }
}

export { Manifest };
