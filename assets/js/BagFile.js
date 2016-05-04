// @flow

import {Record} from 'immutable';

const BagFileRecord = Record({
    path: undefined,
    file: undefined,
    fileSize: undefined,
    hash: undefined
});

export default class BagFile extends BagFileRecord {
    path: string;
    file: File;
    fileSize: number;
    hash: string;

    constructor(path: string, file: File) {
        super({path, file, fileSize: file.size});
    }
}
