// @flow

import React, {Component} from 'react'; // eslint-disable-line no-unused-vars
import {Container} from 'flux/utils';

import type {Action} from '../js/Actions';

import {Dispatcher} from 'flux';

const dispatcher: Dispatcher<Action> = new Dispatcher();

export function dispatch(action: Action): void {
    return dispatcher.dispatch(action)
}

import BagStore from '../js/BagStore';
import HashStore from '../js/HashStore';
import UploadStore from '../js/UploadStore';

import type {State as UploadState} from '../js/UploadTypes'

import {actions as UploadActions} from '../js/UploadActions'

const bagStore = new BagStore(dispatcher)
const hashStore = new HashStore(dispatcher)
const uploadStore = new UploadStore(dispatcher)

const hashFile = hashFileAction(dispatch)
const uploadActions = UploadActions(dispatch)
const upload = uploadActions.upload(() => uploadStore.getState())

import {hashFileAction} from '../js/HashActions'

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

function filesSelected(files: Map<string, File>): void {
    dispatch({ type: 'bag/filesSelected', files });
    // $FlowIssue - https://github.com/facebook/flow/issues/1059
    [...files].map(
        ([fullPath, file]) => hashFile(fullPath, file)
        .then((result) => {
            const {fullPath: path, sha256: hash} = result
            dispatch({ type: 'bag/fileHashed', path, hash });
            upload(path, file, file.size, file.type)
        }).catch(function(error) {
            throw error
        })
    )
}

class BaggerApp extends Component<any, any, BaggerState> {

    state: BaggerState;

    static getStores(): Array<Store> {
        return [bagStore, hashStore, uploadStore];
    }

    static calculateState(prevState: ?BaggerState): BaggerState { // eslint-disable-line no-unused-vars
        return {
            bagFiles: bagStore.getState(),
            bytesHashed: hashStore.getState(),
            upload: uploadStore.getState()
        };
    }

    componentDidMount() {
        const b = document.getElementById('bagger');
        const dataset = b.dataset
        const args = [dataset.accessKeyId, dataset.secretAccessKey, dataset.bucket, dataset.region,
                        dataset.keyPrefix]
        if (args.some(arg => arg !== undefined)) {
            uploadActions.configurationUpdated(...args)
        }
        uploadActions.testConfiguration(() => uploadStore.getState())()
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
                    updateConfig={(...args) => uploadActions.configurationUpdated(...args)}
                    testConfiguration={uploadActions.testConfiguration(() => uploadStore.getState())}
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
