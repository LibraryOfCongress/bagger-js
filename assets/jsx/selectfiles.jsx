var React = require('react');

import { BagContents } from '../jsx/contents.jsx';

class SelectFiles extends React.Component {
    constructor(props) {
        super(props);
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
        this.props.onFilesChange(fileList);
        return;
    }
    render() {
        return (
            <form className="form-horizontal" onChange={this.handleChange.bind(this)}>
                <div className="form-group">
                    <label>Select files: <input type="file" multiple webkitdirectory /></label>
                    <button className="btn btn-primary">Go!</button>
                </div>
            </form>
        );
    }
}

export { SelectFiles };

