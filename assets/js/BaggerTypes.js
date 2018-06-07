import {Action as BagAction, State as BagState} from './BagTypes';
import {Action as HashAction, State as HashState} from './HashTypes';
import {Action as UploadAction, State as UploadState} from './UploadTypes';

export type Action = BagAction | HashAction | UploadAction;

export type State = {
    bagFiles: BagState,
    bytesHashed: HashState,
    upload: UploadState
};
