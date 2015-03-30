var React = require('react');

import { BagContents } from '../jsx/bagcontents.jsx';
import { SelectFiles } from '../jsx/selectfiles.jsx';

class Bagger extends React.Component {
    constructor(props) {
        super(props);
        this.state = {files: [], pendingFileHashKeys: []};
    }

    handleFilesChanged(files) {
        // FIXME: Switch to use a set so we can add files in multiple batches & only keep the unique filenames
        var bagFiles = [], pendingKeys = [];

        for (var i in files) {
            var file = files[i];
            file.hashes = {};
            var newRowId = bagFiles.push(file) - 1;
            console.log('added', file, 'as', newRowId);
            pendingKeys.push(newRowId);
        }

        this.setState({files: bagFiles, pendingFileHashKeys: pendingKeys},
                      this.checkHashQueue);
        return;
    }

    checkHashQueue() {
        var files = this.state.files, pendingFileHashKeys = this.state.pendingFileHashKeys;

        if (pendingFileHashKeys.length < 1) {
            console.log('No pending hashes');
            return;
        }

        var file = files[pendingFileHashKeys.shift()];

        console.log('Now processing', file, '(' + pendingFileHashKeys.length + ' to go)');
        this.hashWorker.postMessage({
            'file': file,
            'action': 'hash'
        });
    }

    handleWorkerResponse(evt) {
        var d = evt.data;
        switch (d.action) {
            case 'hash':
                var file = null;
                var files = this.state.files;
                for (var i in files) {
                    file = files[i];
                    if (file.fullPath === d.file.fullPath) {
                        break;
                    }
                }
                if (file !== null) {
                    for (var hashName in d.output) { // jshint -W089
                        file.hashes[hashName] = d.output[hashName];
                    }
                } else {
                    console.log("didn't find file: ", d.file.fullPath);
                }
                this.setState({files: files});
                this.checkHashQueue();
                break;
            case 'update':
                // FIXME: update worker status display
                break;
        }
    }

    componentDidMount() {
        // FIXME: manage more than 1 hashWorker
        this.hashWorker = new Worker('hash-worker.js');
        this.hashWorker.addEventListener('message', this.handleWorkerResponse.bind(this));
    }

    render() {
        // FIXME: always have <SelectFiles> visible even after files have been added the first time
        if (this.state.files.length !== 0) {
            return <BagContents files={this.state.files} />;
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
