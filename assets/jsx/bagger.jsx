var React = require('react');

import { BagContents } from '../jsx/contents.jsx';

class Bagger extends React.Component {
    constructor(props) {
        super(props);
        this.state = {files: []};
    }
    handleClick(e) {
        e.preventDefault();
        this.setState({files: []});
    }
    handleChange(e) {
        e.preventDefault();
        var fileList = event.target.files;
        for (var i = 0; i < fileList.length; i++) {
            var file = fileList[i];
            /*
               There's no standard interface for getting files with the context of a selected or dropped
               directory (see #1). Currently we're using a non-standard interface in Chrome and due to its
               limitations we have to store a fullPath property while recursing the directory tree (see
               walkDirectoryTree below) because we cannot update the built-in name property.

               To avoid having to check everywhere we want to get the filename, we'll take the opposite
               approach and set fullPath from file.name if it's not already set so we can use it elsewhere
             */

            if (!('fullPath' in file)) {
                if ('webkitRelativePath' in file && file.webkitRelativePath.length > 0) {
                    file.fullPath = file.webkitRelativePath;
                } else {
                    file.fullPath = file.name;
                }
            }
        }
        this.setState({files: fileList});
        return;
    }
    render() {
        if (this.state.files.length !== 0) {
            return <BagContents files={this.state.files}/>;
        }
        return (
            <div id="dropzone" className="jumbotron text-center">
                <h1>Upload a bag</h1>
                <p>Drag and drop files or directories here!</p>
                <form className="form-horizontal" onChange={this.handleChange.bind(this)}>
                    <div className="form-group">
                        <label>Select files: <input type="file" multiple webkitdirectory /></label>
                        <button className="btn btn-primary">Go!</button>
                    </div>
                </form>
            </div>
        );
    }
}

export { Bagger };
