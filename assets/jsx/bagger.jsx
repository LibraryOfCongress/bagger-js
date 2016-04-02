// @flow

import React, {Component} from 'react'; // eslint-disable-line no-unused-vars
import {Container} from 'flux/utils';

import BagStore from '../js/BagStore';
import HashStore from '../js/HashStore';
import UploadStore from '../js/UploadStore';
import type {State as UploadState} from '../js/UploadStore'

import {filesSelected, configurationUpdated, testConfiguration} from '../js/ActionCreators'

import SelectFiles from './selectfiles.jsx';
import Progress from './progress.jsx';
import Throughput from './throughput.jsx';
import Bag from './bag.jsx';
import ServerInfo from './server-info.jsx';

import type Immutable from 'immutable';
import type {Store} from 'flux/utils';
import type BagFile from '../js/BagFile';

type BaggerState = {
    bagFiles: Immutable.Map<string, BagFile>,
    bytesHashed: Immutable.Map<string, number>,
    upload: UploadState
};

class BaggerApp extends Component<any, any, BaggerState> {

    state: BaggerState;

    static getStores(): Array<Store> {
        return [BagStore, HashStore, UploadStore];
    }

    static calculateState(prevState: ?BaggerState): BaggerState { // eslint-disable-line no-unused-vars
        return {
            bagFiles: BagStore.getState(),
            bytesHashed: HashStore.getState(),
            upload: UploadStore.getState()
        };
    }

    componentDidMount() {
        const b = document.getElementById('bagger');
        const dataset = b.dataset
        const args = [dataset.accessKeyId, dataset.secretAccessKey, dataset.bucket, dataset.region,
                        dataset.keyPrefix]
        if (args.some(arg => arg !== undefined)) {
            configurationUpdated(...args)
        }
        testConfiguration(...args)
    }

    render(): ?React.Element {
        // TODO: move calculations into stores
        const bytesHashed = [...this.state.bytesHashed.values()].reduce((r, n) => r + n, 0);
        const totalBytes = [...this.state.bagFiles.values()].reduce((r, f) => r + f.fileSize, 0);
        const {upload, bagFiles} = this.state
        const bytesUploaded = [...this.state.upload.bytesUploaded.values()].reduce((r, n) => r + n, 0);

        return (
            <div className="bagger">
                <ServerInfo uploader={upload}
                    updateConfig={configurationUpdated}  testConfiguration={testConfiguration}
                />
                {upload.message === 'OK' && (
                    <div>
                        <SelectFiles onFilesSelected={(files) => filesSelected(files)} />
                        {bagFiles.size > 0 && (
                            <div>
                                <div className="dashboard well well-sm clearfix">
                                    <div className="col-sm-6">
                                        <h5>Hashing</h5>
                                        <Progress current={bytesHashed} total={totalBytes} />
                                        <Throughput current={bytesHashed} total={totalBytes} />
                                    </div>
                                    <div className="col-sm-6">
                                        <h5>Uploading</h5>
                                        <Progress current={bytesUploaded} total={totalBytes} />
                                        <Throughput current={bytesUploaded} total={totalBytes} />
                                    </div>
                                </div>
                                <Bag files={bagFiles} />
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }
}

const BaggerAppContainer = Container.create(BaggerApp);
export default BaggerAppContainer;
