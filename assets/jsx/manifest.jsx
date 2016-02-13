var React = require('react');

class Manifest extends React.Component {

    constructor(props) {
        super(props);
    }

    generateManifest(evt) {
        var manifest = [];
        var hashType = this.props.hashType;
        var hashes = this.props.hashes;
        hashes.keySeq().forEach(function(path) {
            var hash = hashes.get(path).get(hashType);
            manifest.push([hash, path].join('\t'));
            return true;
        });

        var href = 'data:text/plain,' + encodeURIComponent(manifest.join('\n'));
        evt.target.href = href;
    }

    render() {
        var filename = 'manifest-' + this.props.hashType;

        return (
            <a onClick={this.generateManifest.bind(this)} target="_blank" download={filename}>
                {filename}
            </a>
        );
    }
}

export {Manifest};
