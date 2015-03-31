var React = require('react/addons');

class Manifest extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        var manifest = [];
        var hashType = this.props.hashType;

        this.props.files.map(function (file) {
            var hash = file.hashes[hashType];
            manifest.push([hash, file.fullPath].join('\t'));
        });

        var href = 'data:text/plain,' + encodeURIComponent(manifest.join('\n'));
        var filename = 'manifest-' + hashType;

        return (
            <a id={'manifest-'+hashType} href={href} target="_blank" download={filename}>{filename}</a>
        );
    }
}

export { Manifest };
