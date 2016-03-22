import React from 'react'
import filesize from 'filesize'
import humanizeDuration from 'humanize-duration'


class Dashboard extends React.Component {

    constructor(props) {
        super(props);
    }

    getProgressBarClasses(completed) {
        let res = ['progress-bar'];

        if (completed) {
            res.push('progress-bar-success');
        } else { // TODO: add back active bit
            res = res.concat(['progress-bar-striped', 'active']);
        }

        return res.join(' ');
    }

    render() {
        const {bagger: {files, hashes, sizes}, hasher, uploader} = this.props

        if (files.size < 1) {
            return null;
        }

        const {totalHashers, activeHashers} = hasher.hasherStats
        const bytesUploaded = [...uploader.bytesUploaded.values()].reduce((r, n) => r + n, 0);
        const bytesHashed = [...hasher.bytesHashed.values()].reduce((r, n) => r + n, 0);
        const totalBytes = [...sizes.values()].reduce((r, n) => r + n, 0);

        const hashComplete = (100 * (bytesHashed / totalBytes)).toFixed(0);
        const hashProgressClasses = this.getProgressBarClasses(files.size === hashes.size);

        const uploadComplete = (100 * (bytesUploaded / totalBytes)).toFixed(0);
        const uploadProgressClasses = this.getProgressBarClasses(bytesUploaded === totalBytes);

        return (
            <div className="dashboard well well-sm clearfix">
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
                    <p>
                        {hashes.size} of {files.size} files hashed.
                        average throughput:
                        <code>{filesize(hasher.hashBytesPerSecond, {round: 1})}</code> per second.
                        {activeHashers} of {totalHashers} hashers are active.
                    </p>
                </div>
                <div className="col-sm-6 upload-stats">
                    <h5>Uploads</h5>
                    <div className="progress">
                        <div
                            className={uploadProgressClasses}
                            role="progressbar"
                            aria-valuenow={uploadComplete}
                            aria-valuemin="0"
                            aria-valuemax="100"
                            style={{
                                width: uploadComplete + '%'
                            }}
                        >
                            {uploadComplete}%
                        </div>
                    </div>
                    <p>Completed:
                        <code>{filesize(bytesUploaded, {round: 0})}</code>. Effective upload speed:
                        <code>{filesize(uploader.uploadBytesPerSecond, {round: 1})}</code>/s
                        Time remaining:
                        <code>{humanizeDuration(uploader.timeRemaining * 1000, {round: true})}</code>
                    </p>
                </div>
            </div>
        );
    }
}

Dashboard.propTypes = {
    files: React.PropTypes.instanceOf(Map),
    hashes: React.PropTypes.instanceOf(Map),
    sizes: React.PropTypes.instanceOf(Map),
    bytesUploaded: React.PropTypes.instanceOf(Map)
}

export default Dashboard;
