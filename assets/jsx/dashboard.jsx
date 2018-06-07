// @flow
import React from 'react';

import Progress from './progress.jsx';
import Throughput from './throughput.jsx';

class Dashboard extends React.Component {
    render() {
        const {bagFiles, bytesHashed, bytesUploaded} = this.props;

        // TODO: move calculations into stores
        const totalBytes = [...bagFiles.values()].reduce(
            (r, f) => r + f.fileSize,
            0
        );

        if (totalBytes > 0) {
            const hashed = [...bytesHashed.values()].reduce((r, n) => r + n, 0);
            const uploaded = [...bytesUploaded.values()].reduce(
                (r, n) => r + n,
                0
            );
            return (
                <div className="dashboard well well-sm clearfix">
                    <div className="col-sm-6">
                        <h5>Hashing</h5>
                        <Progress current={hashed} total={totalBytes} />
                        <Throughput current={hashed} total={totalBytes} />
                    </div>
                    <div className="col-sm-6">
                        <h5>Uploading</h5>
                        <Progress current={uploaded} total={totalBytes} />
                        <Throughput current={uploaded} total={totalBytes} />
                    </div>
                </div>
            );
        } else {
            return null;
        }
    }
}

export default Dashboard;
