var React = require('react');

import { BagContents } from '../jsx/bagcontents.jsx';
import { SelectFiles } from '../jsx/selectfiles.jsx';

class Bagger extends React.Component {
    constructor(props) {
        super(props);
        this.state = {files: []};
    }
    handleFilesChanged(files) {
        var bagFiles = [];
        for (var i in files) {
            bagFiles.push(files[i]);
        }
        this.setState({files: bagFiles});
        return;
    }
    render() {
        if (this.state.files.length !== 0) {
            return <BagContents files={this.state.files}/>;
        }
        return (
            <div>
                <h1>Upload a bag</h1>
                <SelectFiles onFilesChange={this.handleFilesChanged.bind(this)} />
            </div>
        );
    }
}

export { Bagger };
