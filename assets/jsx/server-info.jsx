// @flow
import React from 'react';
import PropTypes from 'prop-types';


class ServerInfo extends React.Component {
    accessKeyIdNode: {value: string};
    secretAccessKeyNode: {value: string};
    bucketNode: {value: string};
    regionNode: {value: string};
    keyPrefixNode: {value: string};

    handleChange(event: Event) {
        event.preventDefault();
        this.props.updateConfig(
            this.accessKeyIdNode.value,
            this.secretAccessKeyNode.value,
            this.bucketNode.value,
            this.regionNode.value,
            this.keyPrefixNode.value
        );
    }

    render() {
        const {
            uploader: {
                accessKeyId,
                secretAccessKey,
                bucket,
                region,
                keyPrefix,
                message
            }
        } = this.props;

        const statusToClassName = {
            Testing: 'btn btn-info',
            Unsuccessful: 'btn btn-danger',
            Successful: 'btn btn-success',
            Untested: 'btn btn-default'
        };
        const testButtonClassName = statusToClassName[status];

        const edit = (
            <form
                className="form-horizontal"
                onSubmit={e => {
                    e.preventDefault();
                    this.props.testConfiguration(
                        accessKeyId,
                        secretAccessKey,
                        bucket,
                        region
                    );
                }}
            >
                <div className="form-group">
                    <label
                        className="col-sm-2 control-label"
                        htmlFor="accessKeyId"
                    >
                        Access Key
                    </label>
                    <div className="col-sm-10">
                        <input
                            ref={node => {
                                this.accessKeyIdNode = node;
                            }}
                            type="text"
                            className="form-control"
                            id="accessKeyId"
                            value={accessKeyId}
                            onChange={e => this.handleChange(e)}
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label
                        className="col-sm-2 control-label"
                        htmlFor="secretAccessKey"
                    >
                        Secret Key
                    </label>
                    <div className="col-sm-10">
                        <input
                            ref={node => {
                                this.secretAccessKeyNode = node;
                            }}
                            type="password"
                            className="form-control"
                            id="secretAccessKey"
                            value={secretAccessKey}
                            onChange={e => this.handleChange(e)}
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label className="col-sm-2 control-label" htmlFor="region">
                        Region
                    </label>
                    <div className="col-sm-10">
                        <input
                            ref={node => {
                                this.regionNode = node;
                            }}
                            type="text"
                            className="form-control"
                            id="region"
                            value={region}
                            onChange={e => this.handleChange(e)}
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label className="col-sm-2 control-label" htmlFor="bucket">
                        Bucket
                    </label>
                    <div className="col-sm-10">
                        <input
                            ref={node => {
                                this.bucketNode = node;
                            }}
                            type="text"
                            className="form-control"
                            id="bucket"
                            value={bucket}
                            onChange={e => this.handleChange(e)}
                        />
                    </div>
                </div>

                <div className="form-group">
                    <div className="col-sm-12 text-center">
                        <button type="submit" className={testButtonClassName}>
                            Test Configuration: {message}
                        </button>
                    </div>
                </div>

                <div className="form-group">
                    <label
                        className="col-sm-2 control-label"
                        htmlFor="keyPrefix"
                    >
                        Path Prefix
                    </label>
                    <div className="col-sm-10">
                        <input
                            ref={node => {
                                this.keyPrefixNode = node;
                            }}
                            type="text"
                            className="form-control"
                            id="keyPrefix"
                            value={keyPrefix}
                            onChange={e => this.handleChange(e)}
                        />
                    </div>
                </div>
            </form>
        );
        const view = (
            <dl className="dl-horizontal">
                <dt>Region</dt>
                <dd>{region}</dd>
                <dt>Bucket</dt>
                <dd>{bucket}</dd>
                <dt>Key Prefix</dt>
                <dd>{keyPrefix}</dd>
            </dl>
        );

        return (
            <span>
                <div className="server-info well well-sm clearfix">
                    <h3>
                        Bag Destination <small>S3 Configuration</small>
                        <a target="help" href="help.html#s3-cors">
                            <i className="glyphicon glyphicon-question-sign" />
                        </a>
                    </h3>
                    {message === 'OK' ? view : edit}
                </div>
                {message === 'OK' && this.props.children}
            </span>
        );
    }
}

ServerInfo.propTypes = {
    updateConfig: PropTypes.func.isRequired,
    testConfiguration: PropTypes.func.isRequired
};

export default ServerInfo;
