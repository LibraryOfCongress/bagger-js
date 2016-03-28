import React from 'react'

class ServerInfo extends React.Component {

    handleChange(event) {
        event.preventDefault()
        this.props.updateConfig(
            this.accessKeyId.value,
            this.secretAccessKey.value,
            this.bucket.value,
            this.region.value,
            this.keyPrefix.value
        )
    }

    render() {
        const {uploader} = this.props
        const configStatus = uploader.configStatus;
        return (
            <div className="server-info well well-sm clearfix">
                <h3>
                    S3 Configuration
                    <a target="help" href="help.html#s3-cors">
                        <i className="glyphicon glyphicon-question-sign"></i>
                    </a>
                </h3>

                <form className="form-horizontal" onSubmit={e => {
                    e.preventDefault()
                    this.props.testConfiguration()
                }}
                >
                    <div className="form-group">
                        <label className="col-sm-2 control-label" htmlFor="accessKeyId">
                            Access Key
                        </label>
                        <div className="col-sm-10">
                            <input
                                ref={node => {this.accessKeyId = node}}
                                type="text"
                                className="form-control"
                                id="accessKeyId"
                                value={uploader.accessKeyId}
                                onChange={(e) => this.handleChange(e)}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="col-sm-2 control-label" htmlFor="secretAccessKey">
                            Secret Key
                        </label>
                        <div className="col-sm-10">
                            <input
                                ref={node => {this.secretAccessKey = node}}
                                type="password"
                                className="form-control"
                                id="secretAccessKey"
                                value={uploader.secretAccessKey}
                                onChange={(e) => this.handleChange(e)}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="col-sm-2 control-label" htmlFor="region">Region</label>
                        <div className="col-sm-10">
                            <input
                                ref={node => {this.region = node}}
                                type="text"
                                className="form-control"
                                id="region"
                                value={uploader.region}
                                onChange={(e) => this.handleChange(e)}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="col-sm-2 control-label" htmlFor="bucket">Bucket</label>
                        <div className="col-sm-10">
                            <input
                                ref={node => {this.bucket = node}}
                                type="text"
                                className="form-control"
                                id="bucket"
                                value={uploader.bucket}
                                onChange={(e) => this.handleChange(e)}
                            />
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
                        <label className="col-sm-2 control-label" htmlFor="keyPrefix">
                            Path Prefix
                        </label>
                        <div className="col-sm-10">
                            <input
                                ref={node => {this.keyPrefix = node}}
                                type="text"
                                className="form-control"
                                id="keyPrefix"
                                value={uploader.keyPrefix}
                                onChange={(e) => this.handleChange(e)}
                            />
                        </div>
                    </div>
                </form>

            </div>
        );
    }
}

export default ServerInfo;
