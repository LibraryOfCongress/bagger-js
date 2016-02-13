var React = require('react');
var Immutable = require('immutable');

import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import * as BagActions from '../js/actions/BagActions';

import {SelectFiles} from '../jsx/selectfiles.jsx';
import {Hasher} from '../jsx/hasher.jsx';
import {Uploader} from '../jsx/uploader.jsx';
import {Bag} from '../jsx/bag.jsx';
import {ServerInfo} from '../jsx/server-info.jsx';

class Bagger extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            bagInfo: new Immutable.OrderedMap([
                ['Software', 'Bagger-js']
            ])
        };
    }

    componentDidMount() {
        const { dispatch, numberOfHashWorkers } = this.props
        //const actions = bindActionCreators(BagActions, dispatch);
        dispatch(BagActions.testConfiguration())
    //     dispatch(actions.createHashWorkerPool(numberOfHashWorkers))
    }

    // componentWillReceiveProps(nextProps) {
    // }

    render() {
        const {files, hashes, sizes, dispatch} = this.props;
        const actions = bindActionCreators(BagActions, dispatch);
        var S3 = ServerInfo

        return (
            <div className="bagger">
                <ServerInfo {...this.props} updateAndTestConfiguration={actions.updateAndTestConfiguration}/>
                <SelectFiles onFilesChange={actions.addFilesAndHash} />
                <div className="dashboard well well-sm clearfix">
                    <Hasher files={files} hashes={hashes} />
                    <Uploader files={files} hashes={hashes} />
                </div>
                <Bag files={files} sizes={sizes} hashes={hashes} bagInfo={this.state.bagInfo} uploader={S3}/>
            </div>
        );
    }
}

Bagger = connect(state => state.Bag)(Bagger)

export {Bagger}
