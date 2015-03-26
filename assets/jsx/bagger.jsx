var React = require('react');

import { BagContents } from '../jsx/contents.jsx';
import { SelectFiles } from '../jsx/selectfiles.jsx';

class Bagger extends React.Component {
    constructor(props) {
        super(props);
        this.state = {files: []};
    }
    handleClick(e) {
        e.preventDefault();
        this.setState({files: []});
    }
    handleFilesChanged(files) {
        this.setState({files: files});
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
