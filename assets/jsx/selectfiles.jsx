var React = require('react');

import { BagContents } from '../jsx/bagcontents.jsx';

class SelectFiles extends React.Component {
    constructor(props) {
        super(props);
    }
    onFilesChange(fileList) {
        var files = [];
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
                    files.push({file: file, fullPath: file.webkitRelativePath});
                } else {
                    files.push({file: file, fullPath: file.name});
                }
            }
        }
        this.props.onFilesChange(files);
    }
    componentDidMount() {
        var dropZone = this.refs.dropzone.getDOMNode();

        var files = [];
        var onFilesChange = this.props.onFilesChange;
        function walkDirectoryTree(entry, basePath) {
            basePath = basePath || '';

            if (entry.isFile) {
                entry.file(function(file) {
                    var fullPath = basePath ? basePath + '/' + file.name : file.name;
                    files.push({file: file, fullPath: fullPath});
                });
            } else if (entry.isDirectory) {
                var dirReader = entry.createReader();
                dirReader.readEntries(function(entries) {
                    for (var j = 0; j < entries.length; j++) {
                        var subEntry = entries[j],
                            fullPath = basePath ? basePath + '/' + entry.name : entry.name;
                        walkDirectoryTree(subEntry, fullPath);
                    }
                });
            }
        }

        var selectFiles = this;
        dropZone.addEventListener('drop', function (evt) {
            evt.stopPropagation();
            evt.preventDefault();

            dropZone.classList.add('active');

            if (typeof evt.dataTransfer.items !== 'undefined') {
                var items = evt.dataTransfer.items;

                for (var i = 0; i < items.length; i++) {
                    var item = items[i],
                        entry = item.webkitGetAsEntry();

                    walkDirectoryTree(entry);
                }
                onFilesChange(files);
            } else {
                selectFiles.onFilesChange(evt.dataTransfer.files);
            }

            dropZone.classList.remove('active');
        }, false);

        dropZone.addEventListener('dragover', function (evt) {
            evt.stopPropagation();
            evt.preventDefault();
            evt.dataTransfer.dropEffect = 'copy';
            dropZone.classList.add('active');
        }, false);

        dropZone.addEventListener('dragleave', function () {
            dropZone.classList.remove('active');
        }, false);

        dropZone.addEventListener('dragend', function () {
            dropZone.classList.remove('active');
        }, false);
    }
    handleChange(e) {
        e.preventDefault();
        this.onFilesChange(e.target.files);
        return;
    }

    render() {
        return (
            <div ref="dropzone" id="dropzone" className="jumbotron text-center">
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

export { SelectFiles };

