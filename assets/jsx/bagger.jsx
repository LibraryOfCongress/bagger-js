// @flow
import React, {Component} from 'react'; // eslint-disable-line no-unused-vars
import {Dispatcher} from 'flux';
import {Container} from 'flux/utils';
import type {Store} from 'flux/utils';

import type {Action, State} from '../js/BaggerTypes'

import BagStore from '../js/BagStore';
import HashStore from '../js/HashStore';
import UploadStore from '../js/UploadStore';

import {hashFileAction} from '../js/HashActions'
import {actions as UploadActions} from '../js/UploadActions'

import SelectFiles from './selectfiles.jsx';
import Dashboard from './dashboard.jsx'
import Bag from './bag.jsx';
import ServerInfo from './server-info.jsx';

const dispatcher: Dispatcher<Action> = new Dispatcher();
function dispatch(action: Action): void {
    return dispatcher.dispatch(action)
}

const bagStore = new BagStore(dispatcher)
const hashStore = new HashStore(dispatcher)
const uploadStore = new UploadStore(dispatcher)

const hashFile = hashFileAction(dispatch)
const uploadActions = UploadActions(dispatch)
const upload = uploadActions.upload(() => uploadStore.getState())

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

class BaggerApp extends Component<any, any, State> {

    state: State;

    static getStores(): Array<Store> {
        return [bagStore, hashStore, uploadStore];
    }

    static calculateState(prevState: ?State): State { // eslint-disable-line no-unused-vars
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
        const {upload, bagFiles, bytesHashed, upload: {bytesUploaded}} = this.state
        return (
            <div className="bagger">
                <ServerInfo uploader={upload}
                    updateConfig={(...args) => uploadActions.configurationUpdated(...args)}
                    testConfiguration={uploadActions.testConfiguration(() => uploadStore.getState())}
                >
                    <SelectFiles onFilesSelected={(files) => filesSelected(files)} />
                    <Dashboard bagFiles={bagFiles} bytesHashed={bytesHashed} bytesUploaded={bytesUploaded} />
                    <Bag files={bagFiles} />
                </ServerInfo>
            </div>
        );
    }
}

const BaggerAppContainer = Container.create(BaggerApp);
export default BaggerAppContainer;
