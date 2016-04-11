// @flow

import type {Action as HashAction} from './HashTypes'
import type {Action as UploadAction} from './UploadTypes'

export type Action = {
    type: 'bag/filesSelected',
    files: Map <string, File> ,
} | {
    type: 'bag/fileHashed',
    path: string,
    hash: string,
} | HashAction | UploadAction;
