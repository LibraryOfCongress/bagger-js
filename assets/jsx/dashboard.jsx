var React = require('react/addons'),
    filesize = require('filesize');

class Dashboard extends React.Component {
    render() {
        var files = this.props.files,
            hashWorkers = this.props.hashWorkers,
            uploadWorkers = this.props.uploadWorkers;

        if (files.total < 1) {
            return null;
        }

        var hashComplete = (100 * (1 - (hashWorkers.pendingFiles / files.total))).toFixed(0),
            hashBytesPerSecond = hashWorkers.totalBytes / hashWorkers.totalTime || 0,
            hashSpeed = filesize(hashBytesPerSecond, {round: 1}),
            uploadComplete = (100 * (uploadWorkers.totalUploaded / files.total)).toFixed(0),
            uploadCompleteStyle = {width: uploadComplete + '%'},
            uploadBytesPerSecond = uploadWorkers.totalBytes / uploadWorkers.totalTime || 0,
            uploadSpeed = filesize(uploadBytesPerSecond, {round: 1});

            var hashProgressClasses = 'progress-bar',
                uploadProgressClasses = 'progress-bar';

            if (hashWorkers.active > 0) {
                hashProgressClasses += ' progress-bar-striped active';
            } else if (hashWorkers.totalBytes > 0) {
                hashProgressClasses += ' progress-bar-success';
            }

            if (uploadWorkers.active > 0) {
                uploadProgressClasses += ' progress-bar-striped active';
            }

        return (
            <div className="dashboard well well-sm clearfix">
                <div className="col-sm-6 hash-stats">
                    <h5>Hashing</h5>
                    <div className="progress">
                        <div className={hashProgressClasses} role="progressbar" aria-valuenow={{width: hashComplete + '%'}} aria-valuemin="0" aria-valuemax="100" style={{width: hashComplete + '%'}}>
                            {hashComplete}%
                        </div>
                    </div>

                    <p>{hashWorkers.active} / {hashWorkers.total} active, average throughput: {hashSpeed}/s</p>
                </div>
                <div className="col-sm-6 upload-stats">
                    <h5>Uploads</h5>

                    <div className="progress">
                        <div className={uploadProgressClasses} role="progressbar" aria-valuenow="{uploadComplete}" aria-valuemin="0" aria-valuemax="100" style={uploadCompleteStyle}>
                            {uploadComplete}%
                        </div>
                    </div>

                    <p>{uploadWorkers.active} / {uploadWorkers.total} active, average throughput: {uploadSpeed}/s</p>
                </div>
            </div>
        );
    }
}

export { Dashboard };
