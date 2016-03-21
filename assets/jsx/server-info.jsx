import React from 'react'

class ServerInfo extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        const {uploader} = this.props
        const configStatus = uploader.configStatus;
        let accessKeyId, secretAccessKey, region, bucket, keyPrefix
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
                    this.props.updateAndTestConfiguration(accessKeyId.value,
                    secretAccessKey.value,
                    bucket.value,
                    region.value,
                    keyPrefix.value
                    )
                }}
                >
                    <div className="form-group">
                        <label className="col-sm-2 control-label" htmlFor="accessKeyId">
                            Access Key
                        </label>
                        <div className="col-sm-10">
                            <input ref={node => {accessKeyId = node}} type="text" className="form-control" id="accessKeyId" defaultValue={uploader.accessKeyId} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="col-sm-2 control-label" htmlFor="secretAccessKey">
                            Secret Key
                        </label>
                        <div className="col-sm-10">
                            <input ref={node => {secretAccessKey = node}} type="password" className="form-control" id="secretAccessKey" defaultValue={uploader.secretAccessKey} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="col-sm-2 control-label" htmlFor="region">Region</label>
                        <div className="col-sm-10">
                            <input ref={node => {region = node}} type="text" className="form-control" id="region" defaultValue={uploader.region} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="col-sm-2 control-label" htmlFor="bucket">Bucket</label>
                        <div className="col-sm-10">
                            <input ref={node => {bucket = node}} type="text" className="form-control" id="bucket" defaultValue={uploader.bucket} />
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
                            <input ref={node => {keyPrefix = node}} type="text" className="form-control" id="keyPrefix" defaultValue={uploader.keyPrefix} />
                        </div>
                    </div>
                </form>



            </div>
        );
    }
}

export default ServerInfo;
