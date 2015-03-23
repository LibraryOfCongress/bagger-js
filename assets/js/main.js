/* jslint browser: true, indent: 4 */

(function () {
    "use strict";

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

            templateRow.querySelector('.file-name').textContent = file.name;
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
                    filename = row.querySelector('.file-name').textContent,
                    hash = row.querySelector('.file-hash.' + hashType + ' output').textContent;

                if (!!filename && !!hash) {
                    manifest.push([hash, filename].join("\t"));
                }
            }

            var downloadLink = document.getElementById('manifest-' + hashType);
            if (downloadLink) {
                if (manifest.length < 1) {
                    downloadLink.setAttribute('disabled', 'disabled');
                } else {
                    var payload = 'data:text/plain,' + encodeURIComponent(manifest.join("\n"));
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

        activeHashes[file.name] = taskState;

        reader.onload = function (evt) {
            var progressBar = outputRow.querySelector('.progress-bar'),
                percentDone = (100 * (taskState.currentOffset / file.size)).toFixed(0) + '%';
            progressBar.style.width = percentDone;
            progressBar.textContent = percentDone;

            hashWorker.postMessage({
                'action': 'update',
                'filename': file.name,
                'bytes': evt.target.result
            });
        };

        hashWorker.postMessage({
            'filename': file.name,
            'action': 'start'
        });

        getNextBlock(activeHashes[file.name]);
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
                        'filename': task.file.name,
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
            console.error('READ PAST END!');
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

        handleFiles(evt.dataTransfer.files);

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
