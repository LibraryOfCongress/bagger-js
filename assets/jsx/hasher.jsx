var React = require('react');
var filesize = require('filesize');

class Hasher extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        if (this.props.files.size < 1) {
            return null;
        }
        var completed = this.props.files.size > 0 && this.props.files.size === this.props.hashes.size;
        var res = ['progress-bar'];
        if (completed) {
            res.push('progress-bar-success');
        } else {
            res = res.concat(['progress-bar-striped', 'active']);
        }
        var hashProgressClasses = res.join(' ');
        var hashComplete = (100 * (this.props.hashes.size / this.props.files.size)).toFixed(0);

        var total = 4; // TODO: this.hashWorkerPool.workers.length;
        var active = 4; // TODO: this.hashWorkerPool.busyWorkers.size;
        var hashBytesPerSecond = 0; // TODO: this.state.bytes / this.state.time || 0;
        var hashSpeed = filesize(hashBytesPerSecond, {round: 1});

        return (
            <div className="col-sm-6 hash-stats">
                <h5>Hashing</h5>
                <div className="progress">
                    <div className={hashProgressClasses} role="progressbar" aria-valuenow={{
                        width: hashComplete + '%'
                    }} aria-valuemin="0" aria-valuemax="100" style={{
                        width: hashComplete + '%'
                    }}
                    >
                        {hashComplete}%
                    </div>
                </div>
                <p>{this.props.hashes.size} of {this.props.files.size} files hashed. average throughput: <code>{hashSpeed}</code> per second. {active} of {total} hashers are active.</p>
            </div>
        );
    }
}

Hasher.propTypes = {
    files: React.PropTypes.instanceOf(Map),
    hashes: React.PropTypes.instanceOf(Map)
}

export {Hasher};
