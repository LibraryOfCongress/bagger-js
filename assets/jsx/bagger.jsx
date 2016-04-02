import React from 'react';

import SelectFiles from '../jsx/selectfiles.jsx';
import Dashboard from '../jsx/dashboard.jsx';
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

        setInterval(() => actions.updateThroughput(), 1000)

        actions.createHasher()
    }

    render() {
        const {bagger, hasher, uploader, actions} = this.props;

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
                            <Dashboard
                                bagger={bagger}
                                hasher={hasher}
                                uploader={uploader}
                            />
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
