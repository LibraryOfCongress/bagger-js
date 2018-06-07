// @flow
import React from 'react';
import PropTypes from 'prop-types';

class SelectFiles extends React.Component {
    processFileList(fileList: Array<any>) {
        /*
         * Convert a FileList into a map of fullpath to file which is passed to
         * this.props.onFilesSelected so all downstream callers can reliably get the full path
         */

        var files = new Map();

        for (var i = 0; i < fileList.length; i++) {
            var file = fileList[i],
                fileInfo;
            /*
                There's no standard interface for getting files with the context of a selected or dropped
                directory (see #1). Currently we're using a non-standard interface in Chrome and due to its
                limitations we have to store a fullPath property while recursing the directory tree (see
                walkDirectoryTree below) because we cannot update the built-in name property.

                To avoid having to check everywhere we want to get the filename, we'll take the opposite
                approach and set fullPath from file.name if it's not already set so we can use it elsewhere
            */
            if (
                'webkitRelativePath' in file &&
                file.webkitRelativePath.length > 0
            ) {
                fileInfo = {file, fullPath: file.webkitRelativePath};
            } else {
                fileInfo = {file, fullPath: file.name};
            }
            files.set(fileInfo.fullPath, fileInfo.file);
        }
        this.props.onFilesSelected(files);
    }
    processFileInfoList(fileList: Array<{file: File, fullPath: string}>) {
        /*
        * Convert a FileList into a map of fullpath to file which is passed to
        * this.props.onFilesSelected so all downstream callers can reliably get the full path
        */
        var files = new Map();
        for (var i = 0; i < fileList.length; i++) {
            var fileInfo = fileList[i];
            files.set(fileInfo.fullPath, fileInfo.file);
        }
        this.props.onFilesSelected(files);
    }
    componentDidMount() {
        var dropZone = this.refs.dropzone;

        var processFileList = this.processFileList.bind(this);
        var processFileInfoList = this.processFileInfoList.bind(this);

        function walkDirectoryTree(entry, basePath) {
            basePath = basePath || '';

            if (entry.isFile) {
                entry.file(function(file) {
                    var fullPath = basePath
                        ? basePath + '/' + file.name
                        : file.name;
                    processFileInfoList([
                        {
                            file,
                            fullPath
                        }
                    ]);
                });
            } else if (entry.isDirectory) {
                var dirReader = entry.createReader();
                dirReader.readEntries(function(entries) {
                    for (var j = 0; j < entries.length; j++) {
                        var subEntry = entries[j],
                            fullPath = basePath
                                ? basePath + '/' + entry.name
                                : entry.name;
                        walkDirectoryTree(subEntry, fullPath);
                    }
                });
            }
        }

        dropZone.addEventListener(
            'drop',
            function(evt) {
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
                } else {
                    processFileList(evt.dataTransfer.files);
                }

                dropZone.classList.remove('active');
            },
            false
        );

        dropZone.addEventListener(
            'dragover',
            function(evt) {
                evt.stopPropagation();
                evt.preventDefault();
                evt.dataTransfer.dropEffect = 'copy';
                dropZone.classList.add('active');
            },
            false
        );

        dropZone.addEventListener(
            'dragleave',
            function() {
                dropZone.classList.remove('active');
            },
            false
        );

        dropZone.addEventListener(
            'dragend',
            function() {
                dropZone.classList.remove('active');
            },
            false
        );
    }

    handleFileInputChange(e: any) {
        e.preventDefault();
        this.processFileList(e.target.files);
        return;
    }

    render() {
        return (
            <div ref="dropzone" id="dropzone" className="jumbotron text-center">
                <p>Drag and drop files or directories here!</p>
                <form className="form-horizontal">
                    <div className="form-group">
                        <label>
                            Select files:
                            <input
                                type="file"
                                onChange={this.handleFileInputChange.bind(this)}
                                multiple
                                webkitdirectory="true"
                            />
                        </label>
                        <button className="btn btn-primary">Go!</button>
                    </div>
                </form>
            </div>
        );
    }
}

SelectFiles.propTypes = {
    onFilesSelected: PropTypes.func.isRequired
};

export default SelectFiles;
