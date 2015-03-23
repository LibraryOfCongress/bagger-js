/* jslint browser: true, indent: 4 */
/* global console */

(function () {
    'use strict';

    var dropZone = document.getElementById('dropzone'),
        bagContents = document.getElementById('bag-contents'),
        bagContentsBody = bagContents.querySelector('tbody'),
        fileRowTemplate = document.getElementById('file-row-template'),
        hashWorker,
        hashQueue = [],
        activeHashes = {},
        blockSize = 1048576;

    function handleFiles(fileList) {
        for (var i = 0; i < fileList.length; i++) {
            var file = fileList[i],
                templateRow = fileRowTemplate.content.querySelector('tr');

            /*
                There's no standard interface for getting files with the context of a selected or dropped
                directory (see #1). Currently we're using a non-standard interface in Chrome and due to its
                limitations we have to store a fullPath property while recursing the directory tree (see
                walkDirectoryTree below) because we cannot update the built-in name property.

                To avoid having to check everywhere we want to get the filename, we'll take the opposite
                approach and set fullPath from file.name if it's not already set so we can use it elsewhere
            */
            if (!('fullPath' in file)) {
                file.fullPath = file.name;
            }

            templateRow.querySelector('.file-name output').textContent = file.fullPath;
            templateRow.querySelector('.file-size output').textContent = file.size;

            var fileRow = bagContentsBody.appendChild(document.importNode(templateRow, true));

            hashQueue.push([file, fileRow]);
        }

        processHashQueue();
    }

    function updateTotal() {
        var total = 0,
            allFileSizes = bagContentsBody.querySelectorAll('.file-size');

        for (var i = 0; i < allFileSizes.length; i++) {
            total += parseInt(allFileSizes[i].textContent, 10);
        }

        bagContents.querySelector('.file-size.total').textContent = total;

        // TODO: make this dynamic:
        var hashTypes = ['sha1', 'sha256'];
        hashTypes.forEach(function (hashType) {
            var manifest = [];

            var rows = bagContentsBody.querySelectorAll('tr');

            for (i = 0; i < rows.length; i++) {
                var row = rows[i],
                    filename = row.querySelector('.file-name output').textContent,
                    hash = row.querySelector('.file-hash.' + hashType + ' output').textContent;

                if (!!filename && !!hash) {
                    manifest.push([hash, filename].join('\t'));
                }
            }

            var downloadLink = document.getElementById('manifest-' + hashType);
            if (downloadLink) {
                if (manifest.length < 1) {
                    downloadLink.setAttribute('disabled', 'disabled');
                } else {
                    var payload = 'data:text/plain,' + encodeURIComponent(manifest.join('\n'));
                    downloadLink.setAttribute('href', payload);
                    downloadLink.removeAttribute('disabled');
                }
            }
        });
    }

    function processHashQueue() {
        updateTotal();

        if (hashQueue.length < 1) {
            return;
        }

        if (!hashWorker) {
            hashWorker = new Worker('hash-worker.js');

            hashWorker.addEventListener('message', handleWorkerResponse);
        }

        // Tasks are two-element lists of File and a Table Row
        var task = hashQueue.shift(),
            file = task[0],
            outputRow = task[1],
            reader = new FileReader();

        var taskState = {
            'progress': 0,
            'row': outputRow,
            'file': file,
            'currentOffset': 0,
            'reader': reader
        };

        activeHashes[file.fullPath] = taskState;

        reader.onload = function (evt) {
            var progressBar = outputRow.querySelector('.progress-bar'),
                percentDone = (100 * (taskState.currentOffset / file.size)).toFixed(0) + '%';
            progressBar.style.width = percentDone;
            progressBar.textContent = percentDone;

            hashWorker.postMessage({
                'action': 'update',
                'filename': file.fullPath,
                'bytes': evt.target.result
            });
        };

        hashWorker.postMessage({
            'filename': file.fullPath,
            'action': 'start'
        });

        getNextBlock(activeHashes[file.fullPath]);
    }

    function handleWorkerResponse(evt) {
        var d = evt.data,
            task = activeHashes[d.filename];

        switch (d.action) {
            case 'start':
                break;
            case 'update':
                if (task.currentOffset < task.file.size) {
                    getNextBlock(task);
                } else {
                    hashWorker.postMessage({
                        'filename': task.file.fullPath,
                        'action': 'stop'
                    });
                }

                break;
            case 'stop':
                for (var i in d.output) { // jshint -W089
                    task.row.querySelector('.file-hash.' + i + ' output').textContent = d.output[i];
                }

                var progressBar = task.row.querySelector('.progress');
                if (progressBar) {
                    progressBar.parentNode.removeChild(progressBar);
                }

                processHashQueue();

            break;
        }
    }

    function getNextBlock(taskState) {
        var sliceStart = taskState.currentOffset,
            sliceEnd = sliceStart + Math.min(blockSize, taskState.file.size - sliceStart),
            slice = taskState.file.slice(sliceStart, sliceEnd);

        if (sliceStart <= taskState.file.size) {
            taskState.currentOffset = sliceEnd;
            taskState.reader.readAsArrayBuffer(slice);
        } else {
            console.error('Attempted to read past end of file!');
        }
    }

    function walkDirectoryTree(entry, basePath) {
        basePath = basePath || '';

        if (entry.isFile) {
            entry.file(function(file) {
                file.fullPath = basePath + '/' + file.name;
                handleFiles([file]);
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


    dropZone.querySelector('input[type="file"]').addEventListener('change', function () {
        dropZone.classList.add('active');
        handleFiles(this.files);
        dropZone.classList.add('active');
    });

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

        } else {
            handleFiles(evt.dataTransfer.files);
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
})();
