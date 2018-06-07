/*
    This handles several ways we get files from the user and is complicated by
    this being insufficiently standardized when you want access to directories
    and full path names.

    It's called with the element containing the drag-and-drop target and/or
    <input type=file> and a callback which will be called with a list containing
    the full pathname and a File instance for each selected file.

    We support the HTML 5 Drag and Drop API:

    https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API

    We also support the traditional <input type="file"> along with the
    non-standard webkitdirectory attribute:

    https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/webkitdirectory

    https://developer.mozilla.org/en-US/docs/Web/API/File
*/

class SelectFiles {
    constructor(dropzone, onFilesSelectedCallback) {
        this.dropzone = dropzone;
        this.onFilesSelected = onFilesSelectedCallback;

        dropzone
            .querySelector('input[type="file"]')
            .addEventListener("change", evt => {
                evt.preventDefault();
                this.processFileList(evt.target.files);
                return;
            });

        dropzone.addEventListener(
            "drop",
            evt => {
                evt.stopPropagation();
                evt.preventDefault();
                this.processDataTransferEvent(evt);
            },
            false
        );

        dropzone.addEventListener(
            "dragover",
            function(evt) {
                evt.stopPropagation();
                evt.preventDefault();
                evt.dataTransfer.dropEffect = "copy";
                dropzone.classList.add("active");
            },
            false
        );

        dropzone.addEventListener(
            "dragleave",
            function() {
                dropzone.classList.remove("active");
            },
            false
        );

        dropzone.addEventListener(
            "dragend",
            function() {
                dropzone.classList.remove("active");
            },
            false
        );
    }

    processDataTransferEvent(evt) {
        // This processes a dataTransfer event as part of the Drag and Drop API:
        // https://developer.mozilla.org/en-US/docs/Web/API/DragEvent/dataTransfer

        this.dropzone.classList.add("active");

        if (typeof evt.dataTransfer.items !== "undefined") {
            let items = evt.dataTransfer.items;

            for (let i = 0; i < items.length; i++) {
                let item = items[i],
                    entry = item.webkitGetAsEntry();

                this.walkDirectoryTree(entry);
            }
        } else {
            this.processFileList(evt.dataTransfer.files);
        }

        this.dropzone.classList.remove("active");
    }

    walkDirectoryTree(entry, basePath) {
        basePath = basePath || "";

        if (entry.isFile) {
            entry.file(file => {
                let fullPath = basePath
                    ? basePath + "/" + file.name
                    : file.name;

                this.processFileInfoList([
                    {
                        file,
                        fullPath
                    }
                ]);
            });
        } else if (entry.isDirectory) {
            let dirReader = entry.createReader();

            dirReader.readEntries(entries => {
                for (let j = 0; j < entries.length; j++) {
                    let subEntry = entries[j],
                        fullPath = basePath
                            ? basePath + "/" + entry.name
                            : entry.name;

                    this.walkDirectoryTree(subEntry, fullPath);
                }
            });
        }
    }

    processFileList(fileList) {
        /*
         * Convert a FileList into a map of fullpath to file which is passed to
         * this.onFilesSelected so all downstream callers can reliably get the full path
         */

        let files = new Map();

        for (let i = 0; i < fileList.length; i++) {
            let file = fileList[i],
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
                "webkitRelativePath" in file &&
                file.webkitRelativePath.length > 0
            ) {
                fileInfo = {file, fullPath: file.webkitRelativePath};
            } else {
                fileInfo = {file, fullPath: file.name};
            }
            files.set(fileInfo.fullPath, fileInfo.file);
        }

        this.onFilesSelected(files);
    }

    processFileInfoList(fileList) {
        /*
        * Convert a FileList into a map of fullpath to file which is passed to
        * this.onFilesSelected so all downstream callers can reliably get the full path
        */
        let files = new Map();
        for (let i = 0; i < fileList.length; i++) {
            let fileInfo = fileList[i];
            files.set(fileInfo.fullPath, fileInfo.file);
        }

        this.onFilesSelected(files);
    }
}

export default SelectFiles;
