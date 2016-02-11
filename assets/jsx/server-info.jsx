var React = require('react');

class ServerInfo extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            configStatus: {
                className: 'btn btn-default',
                message: 'Untested'
            }
        };
    }

    handleChange(event) {
        var key = event.target.id,
            value = event.target.value;
        this.props.updateServerInfo(key, value);
        this.setState({key: value});
    }

    hasCredentials() {
        return this.props.accessKeyId && this.props.secretAccessKey && this.props.region;
    }

    testConfiguration(evt) {
        // We'd like to be able to list buckets but that's impossible due to Amazon's CORS constraints:
        // https://forums.aws.amazon.com/thread.jspa?threadID=179355&tstart=0

        if (this.hasCredentials()) {
            var s3 = this.props.getS3Client();

            this.setState({configStatus: {
                className: 'btn btn-info',
                message: 'Waiting…'
            }});

            s3.getBucketCors({Bucket: this.props.bucket}, (isError, data) => {
                if (isError) {
                    var errMessage = 'ERROR';

                    if (data) {
                        errMessage += ' (' + data + ')';
                    }

                    this.setState({
                        configStatus: {
                            className: 'btn btn-danger',
                            message: errMessage
                        }
                    });
                } else {
                    this.setState({
                        configStatus: {
                            className: 'btn btn-success',
                            message: 'OK'
                        }
                    });
                }
            });
        } else {
            this.setState({configStatus: {className: 'btn btn-default', message: 'Untested'}});
        }

        if (evt) {
            evt.preventDefault();
        }
    }

    render() {
        var configStatus = this.state.configStatus;

        return (
            <div className="server-info well well-sm clearfix">
                <h3>S3 Configuration <a target="help" href="help.html#s3-cors"><i className="glyphicon glyphicon-question-sign"></i></a></h3>

                <form className="form-horizontal" onSubmit={this.testConfiguration.bind(this)}>
                    <div className="form-group">
                        <label className="col-sm-2 control-label" htmlFor="accessKeyId">Access Key</label>
                        <div className="col-sm-10">
                            <input type="text" className="form-control" id="accessKeyId" value={this.props.accessKeyId} onChange={this.handleChange.bind(this)} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="col-sm-2 control-label" htmlFor="secretAccessKey">Secret Key</label>
                        <div className="col-sm-10">
                            <input type="password" className="form-control" id="secretAccessKey" value={this.props.secretAccessKey} onChange={this.handleChange.bind(this)} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="col-sm-2 control-label" htmlFor="region">Region</label>
                        <div className="col-sm-10">
                            <input type="text" className="form-control" id="region" value={this.props.region} onChange={this.handleChange.bind(this)} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="col-sm-2 control-label" htmlFor="bucket">Bucket</label>
                        <div className="col-sm-10">
                            <input type="text" className="form-control" id="bucket" value={this.props.bucket} onChange={this.handleChange.bind(this)} />
                        </div>
                    </div>

                    <div className="form-group">
                        <div className="col-sm-12 text-center">
                            <button type="submit" className={configStatus.className}>
                                Test Configuration: {configStatus.message}
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="col-sm-2 control-label" htmlFor="keyPrefix">Path Prefix</label>
                        <div className="col-sm-10">
                            <input type="text" className="form-control" id="keyPrefix" value={this.props.keyPrefix} onChange={this.handleChange.bind(this)} />
                        </div>
                    </div>
                </form>
            </div>
        );
    }
}

export { ServerInfo };
