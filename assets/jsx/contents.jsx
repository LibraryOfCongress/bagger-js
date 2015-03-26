var React = require('react');

class BagContents extends React.Component {
    constructor(props) {
        super(props);
        this.state = {files: props.files};
    }
    componentDidMount() {
        var bagContents = document.getElementById('bag-contents'),
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

        console.log('handling files: ', this.state.files);
        handleFiles(this.state.files);

    }
    render() {
        return (
            <table id="bag-contents" className="table table-striped">
                <caption>Current Contents</caption>
                <thead>
                    <tr>
                        <th className="file-name">Filename</th>
                        <th className="file-size">Size</th>
                        <th className="file-hash">SHA-1</th>
                        <th className="file-hash">SHA-256</th>
                    </tr>
                </thead>
                <tbody>
                    <template id="file-row-template">
                        <tr>
                            <td className="file-name">
                                <output></output>
                            </td>
                            <td className="file-size">
                                <output></output>
                            </td>
                            <td className="file-hash sha1">
                                <output></output>
                            </td>
                            <td className="file-hash sha256">
                                <output></output>
                                <div className="progress">
                                    <div role="progressbar" className="progress-bar progress-bar-striped">
                                        0%
                                    </div>
                                </div>
                            </td>
                        </tr>
                    </template>
                </tbody>
                <tfoot>
                    <tr>
                        <th>Totals:</th>
                        <td className="file-size total"></td>
                        <td><a id="manifest-sha1" download="manifest-sha1.txt">manifest-sha1</a></td>
                        <td><a id="manifest-sha256" download="manifest-sha256.txt">manifest-sha256</a></td>
                    </tr>
                </tfoot>
            </table>
        );
    }
}

export { BagContents };
