import {Action as HashAction, State as HashState} from './HashTypes'
import {Action as UploadAction, State as UploadState} from './UploadTypes'

import type Immutable from 'immutable';
import type BagFile from '../js/BagFile';

export type Action = {
    type: 'bag/filesSelected',
    files: Map <string, File> ,
} | {
    type: 'bag/fileHashed',
    path: string,
    hash: string,
} | HashAction | UploadAction;

export type State = {
    bagFiles: Immutable.Map<string, BagFile>,
    bytesHashed: HashState,
    upload: UploadState
};
