import React from 'react';

import SelectFiles from '../jsx/selectfiles.jsx';
import Progress from '../jsx/progress.jsx';
import Throughput from '../jsx/throughput.jsx';
import Bag from '../jsx/bag.jsx';
import ServerInfo from '../jsx/server-info.jsx';

class Bagger extends React.Component {

    componentDidMount() {
        const {actions} = this.props;

        const b = document.getElementById('bagger');
        const dataset = b.dataset
        const args = [dataset.accessKeyId, dataset.secretAccessKey, dataset.bucket, dataset.region,
                        dataset.keyPrefix]
        if (args.some(arg => arg !== undefined)) {
            actions.updateConfig(...args)
        }
        actions.testConfiguration()

        actions.createHasher()
    }

    render() {
        const {bagger, hasher, uploader, actions} = this.props;

        const bytesUploaded = [...uploader.bytesUploaded.values()].reduce((r, n) => r + n, 0);
        const bytesHashed = [...hasher.bytesHashed.values()].reduce((r, n) => r + n, 0);
        const totalBytes = [...bagger.sizes.values()].reduce((r, n) => r + n, 0);

        const {totalHashers, activeHashers} = hasher.hasherStats

        return (
            <div className="bagger">
                <ServerInfo
                    uploader={uploader}
                    updateConfig={actions.updateConfig}
                    testConfiguration={actions.testConfiguration}
                />
                {uploader.configStatus.message === 'OK' && (
                    <div>
                        <SelectFiles onFilesChange={(files) => actions.addFiles(files)} />
                        {bagger.files.size > 0 && (
                            <div className="dashboard well well-sm clearfix">
                                <div className="col-sm-6 hash-stats">
                                    <h5>Hashing</h5>
                                    <Progress current={bytesHashed} total={totalBytes} />
                                    <Throughput current={bytesHashed} total={totalBytes} />
                                    {activeHashers} of {totalHashers} hashers are active.
                                </div>
                                <div className="col-sm-6 upload-stats">
                                    <h5>Uploads</h5>
                                    <Progress current={bytesUploaded} total={totalBytes} />
                                    <Throughput current={bytesUploaded} total={totalBytes} />
                                </div>
                            </div>
                        )}
                        {bagger.files.size > 0 && bagger.files.size === bagger.hashes.size && (
                            <Bag bagger={bagger} />
                        )}
                    </div>
                )}
            </div>
        )
    }
}

export default Bagger
