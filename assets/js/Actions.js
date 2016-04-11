// @flow

import {Action as HashAction} from './HashTypes'
import {Action as UploadAction} from './UploadTypes'

export type Action = {
    type: 'bag/filesSelected',
    files: Map <string, File> ,
} | {
    type: 'bag/fileHashed',
    path: string,
    hash: string,
} | HashAction | UploadAction;
