var React = require('react/addons');

class ServerInfo extends React.Component {
    constructor(props) {
        super(props);
    }

    handleChange(event) {
        this.props.updateServerInfo(event.target.id, event.target.value);
    }

    render() {
        var ConfigurationStatus = 'FIXME: implement S3 access check!';

        return (
            <div className="server-info well well-sm clearfix">
                <h3>S3 Configuration <a target="help" href="help.html#s3-cors"><i className="glyphicon glyphicon-question-sign"></i></a></h3>

                <form>
                    <div className="form-group">
                        <label htmlhtmlFor="accessKeyId">Access Key</label>
                        <input type="text" className="form-control" id="accessKeyId" onChange={this.handleChange.bind(this)} />
                    </div>

                    <div className="form-group">
                        <label htmlFor="secretAccessKey">Secret Key</label>
                        <input type="text" className="form-control" id="secretAccessKey" onChange={this.handleChange.bind(this)} />
                    </div>

                    <div className="form-group">
                        <label htmlFor="region">Region</label>
                        <input type="text" className="form-control" id="region" value="us-east-1" onChange={this.handleChange.bind(this)} />
                    </div>

                    <div className="form-group">
                        <label htmlFor="bucket">Bucket <b className="text-danger">FIXME: retrieve list after keys are set</b></label>
                        <input type="text" className="form-control" id="bucket" onChange={this.handleChange.bind(this)} />
                    </div>

                    <button type="submit" className="btn btn-default">Test Configuration</button>

                    <p className="text-warning">{ConfigurationStatus}</p>
                </form>
            </div>
        );
    }
}

export { ServerInfo };
