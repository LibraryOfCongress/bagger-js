import React from 'react';

import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import * as BagActions from '../js/actions/BagActions';

import SelectFiles from '../jsx/selectfiles.jsx';
import Hasher from '../jsx/hasher.jsx';
import Uploader from '../jsx/uploader.jsx';
import Bag from '../jsx/bag.jsx';
import ServerInfo from '../jsx/server-info.jsx';

class Bagger extends React.Component {
    constructor(props) {
        super(props);
    }

    componentDidMount() {
        const { dispatch } = this.props
        dispatch(BagActions.testConfiguration())
    }

    render() {
        const {files, hashes, sizes, bytesUploaded, dispatch} = this.props;
        const actions = bindActionCreators(BagActions, dispatch);

        return (
            <div className="bagger">
                <ServerInfo {...this.props} updateAndTestConfiguration={actions.updateAndTestConfiguration}/>
                {this.props.configStatus.message === 'OK' && (
                    <div>
                        <SelectFiles onFilesChange={actions.addFilesAndHash} />
                        {files.size > 0 && (
                            <div className="dashboard well well-sm clearfix">
                                <Hasher files={files} hashes={hashes} />
                                <Uploader files={files} hashes={hashes} sizes={sizes} bytesUploaded={bytesUploaded} />
                            </div>
                        )}
                        {files.size > 0 && files.size === hashes.size && (
                            <Bag files={files} sizes={sizes} hashes={hashes} />
                        )}
                    </div>
                )}
            </div>
        );
    }
}

Bagger = connect(state => state.Bag)(Bagger)

export default Bagger
